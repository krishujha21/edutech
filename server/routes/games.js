const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function isoDateKey(d) {
    return new Date(d).toISOString().split('T')[0];
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function safeParseQuestions(q) {
    const list = typeof q === 'string' ? JSON.parse(q) : q;
    return Array.isArray(list) ? list : [];
}

function collectQuestionPool({ grade, subjectId }) {
    const quizzes = data.quizzes.filter(q => q.is_published && q.class_grade === grade && q.subject_id === subjectId);
    const pool = [];

    for (const quiz of quizzes) {
        const questions = safeParseQuestions(quiz.questions);
        for (const question of questions) {
            if (!question || !Array.isArray(question.options) || typeof question.correct !== 'number') continue;
            pool.push({
                id: question.id,
                text: question.text,
                options: question.options,
                correct: question.correct,
                quiz_id: quiz.id,
            });
        }
    }

    return pool;
}

router.use(authenticateToken);
router.use(authorizeRoles('student'));

// GET /api/games/me
// Returns available per-subject games for the logged-in student's class.
router.get('/me', (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const today = isoDateKey(new Date());

        // Subjects that have at least one question available via published quizzes for this grade.
        const subjectsForGrade = data.subjects
            .map(sub => {
                const pool = collectQuestionPool({ grade: student.class_grade, subjectId: sub.id });
                return { sub, poolSize: pool.length };
            })
            .filter(x => x.poolSize > 0)
            .map(x => x.sub);

        const games = subjectsForGrade.map(sub => {
            const playedToday = (data.game_attempts || []).some(a =>
                a.student_id === student.id &&
                a.subject_id === sub.id &&
                a.game_type === 'quick_challenge' &&
                isoDateKey(a.created_at) === today
            );

            return {
                subject_code: sub.code,
                subject_name: sub.name,
                subject_icon: sub.icon,
                game_type: 'quick_challenge',
                title: 'Quick Challenge',
                status: playedToday ? 'completed' : 'pending',
                xp_reward_up_to: 40,
            };
        });

        res.json({ games });
    } catch (err) {
        console.error('Games list error:', err);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// POST /api/games/quick-challenge/start
router.post('/quick-challenge/start', (req, res) => {
    try {
        const { subject_code } = req.body || {};

        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const subject = data.subjects.find(s => s.code === subject_code);
        if (!subject) return res.status(400).json({ error: 'Invalid subject' });

        const pool = collectQuestionPool({ grade: student.class_grade, subjectId: subject.id });
        if (pool.length === 0) return res.status(404).json({ error: 'No questions available for this subject' });

        shuffleInPlace(pool);
        const selected = pool.slice(0, Math.min(5, pool.length));

        const sessionId = uuidv4();
        (data.game_sessions || []).push({
            id: sessionId,
            student_id: student.id,
            subject_id: subject.id,
            game_type: 'quick_challenge',
            questions: selected,
            created_at: new Date(),
        });

        res.json({
            session_id: sessionId,
            game_type: 'quick_challenge',
            subject_code: subject.code,
            subject_name: subject.name,
            total_questions: selected.length,
            questions: selected.map(q => ({ id: q.id, text: q.text, options: q.options })),
        });
    } catch (err) {
        console.error('Game start error:', err);
        res.status(500).json({ error: 'Failed to start game' });
    }
});

// POST /api/games/quick-challenge/submit
router.post('/quick-challenge/submit', (req, res) => {
    try {
        const { session_id, answers, time_taken_secs } = req.body || {};

        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const sessions = data.game_sessions || [];
        const sessionIdx = sessions.findIndex(s => s.id === session_id && s.student_id === student.id && s.game_type === 'quick_challenge');
        if (sessionIdx < 0) return res.status(404).json({ error: 'Game session not found' });

        const session = sessions[sessionIdx];
        const questions = Array.isArray(session.questions) ? session.questions : [];
        if (questions.length === 0) return res.status(400).json({ error: 'Invalid game session' });

        const userAnswers = Array.isArray(answers) ? answers : [];

        let correct = 0;
        const results = questions.map((q, idx) => {
            const a = userAnswers[idx];
            const isCorrect = a === q.correct;
            if (isCorrect) correct += 1;
            return { questionId: q.id, correct: isCorrect, userAnswer: a };
        });

        const total = questions.length;
        const percentage = Math.round((correct / total) * 100);

        // XP: up to 30 for accuracy + up to 10 bonus
        let xpEarned = Math.round((correct / total) * 30);
        if (correct > 0 && xpEarned < 5) xpEarned = 5;
        if (percentage === 100) xpEarned += 5;
        const tt = Math.max(0, Math.min(parseInt(time_taken_secs || 0, 10) || 0, 3600));
        if (tt > 0 && tt <= 60 && correct >= total - 1) xpEarned += 5;
        xpEarned = Math.max(0, Math.min(xpEarned, 40));

        student.xp_points += xpEarned;
        const newLevel = Math.floor(student.xp_points / 100) + 1;
        const leveledUp = newLevel > student.current_level;
        if (leveledUp) student.current_level = newLevel;

        const attemptId = data.nextGameAttemptId();
        (data.game_attempts || []).push({
            id: attemptId,
            uuid: uuidv4(),
            student_id: student.id,
            subject_id: session.subject_id,
            game_type: session.game_type,
            total_questions: total,
            correct,
            percentage,
            time_taken_secs: tt,
            xp_earned: xpEarned,
            created_at: new Date(),
        });

        // One-time session
        sessions.splice(sessionIdx, 1);

        res.json({
            attempt_id: attemptId,
            correct,
            total_questions: total,
            percentage,
            xp_earned: xpEarned,
            updated_xp_points: student.xp_points,
            new_level: leveledUp ? newLevel : null,
            results,
        });
    } catch (err) {
        console.error('Game submit error:', err);
        res.status(500).json({ error: 'Failed to submit game' });
    }
});

module.exports = router;
