const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

// GET /api/quizzes — filterable list
router.get('/', (req, res) => {
    try {
        const { grade, subject, type, lesson_id } = req.query;
        let list = data.quizzes.filter(q => q.is_published);

        if (grade) list = list.filter(q => q.class_grade === parseInt(grade));
        if (subject) {
            const sub = data.subjects.find(s => s.code === subject);
            if (sub) list = list.filter(q => q.subject_id === sub.id);
        }
        if (type) list = list.filter(q => q.quiz_type === type);
        if (lesson_id) list = list.filter(q => q.lesson_id === parseInt(lesson_id));

        const enriched = list.map(q => {
            const s = data.subjects.find(s => s.id === q.subject_id);
            return { ...q, subject_name: s?.name, subject_code: s?.code };
        });

        res.json({ quizzes: enriched });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// GET /api/quizzes/attempts/me  (MUST be before /:id)
router.get('/attempts/me', authenticateToken, (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.json({ attempts: [] });

        const attempts = data.quiz_attempts
            .filter(a => a.student_id === student.id)
            .map(a => {
                const quiz = data.quizzes.find(q => q.id === a.quiz_id);
                const sub = quiz ? data.subjects.find(s => s.id === quiz.subject_id) : null;
                return { ...a, quiz_title: quiz?.title, subject_name: sub?.name };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ attempts });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
});

// GET /api/quizzes/:id
router.get('/:id', (req, res) => {
    try {
        const quiz = data.quizzes.find(q => q.id === parseInt(req.params.id));
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        const s = data.subjects.find(s => s.id === quiz.subject_id);
        res.json({ quiz: { ...quiz, subject_name: s?.name } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', authenticateToken, (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        const { answers, time_taken_secs, started_at, uuid } = req.body;

        const quiz = data.quizzes.find(q => q.id === quizId);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(400).json({ error: 'Student not found' });

        const questions = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;

        // Grade
        let score = 0;
        const results = questions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correct;
            if (isCorrect) score += q.marks;
            return { questionId: q.id, correct: isCorrect, userAnswer, correctAnswer: q.correct, explanation: q.explanation };
        });

        const percentage = (score / quiz.total_marks) * 100;
        const passed = percentage >= quiz.passing_score;

        // Save attempt
        const attemptId = data.nextQuizAttemptId();
        data.quiz_attempts.push({
            id: attemptId, uuid: uuid || uuidv4(), quiz_id: quizId, student_id: student.id,
            answers, score, total_marks: quiz.total_marks, percentage,
            time_taken_secs, started_at: started_at || new Date(),
            completed_at: new Date(), is_synced: true, created_at: new Date(),
        });

        // Award XP
        let xpEarned = passed ? quiz.xp_reward : Math.floor(quiz.xp_reward * 0.3);
        if (percentage === 100) xpEarned += 10;
        student.xp_points += xpEarned;

        // Level up (every 100 XP)
        const newLevel = Math.floor(student.xp_points / 100) + 1;
        const leveledUp = newLevel > student.current_level;
        if (leveledUp) student.current_level = newLevel;

        res.json({
            attempt_id: attemptId, score, total_marks: quiz.total_marks, percentage,
            passed, xp_earned: xpEarned, results,
            new_level: leveledUp ? newLevel : null,
        });
    } catch (err) {
        console.error('Quiz submit error:', err);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

module.exports = router;
