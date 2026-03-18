const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('student'));

// GET /api/study/me
// Returns a gamified "study board" for the logged-in student's class.
router.get('/me', (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const grade = student.class_grade;
        const section = student.section;

        const lessons = data.lessons
            .filter(l => l.is_published && l.class_grade === grade)
            .sort((a, b) => (a.subject_id - b.subject_id) || (a.order_index - b.order_index));

        const quizzes = data.quizzes
            .filter(q => q.is_published && q.class_grade === grade)
            .sort((a, b) => (a.subject_id - b.subject_id) || (a.id - b.id));

        const progress = data.progress.filter(p => p.student_id === student.id);
        const completedLessonIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.lesson_id));

        const attempts = data.quiz_attempts.filter(a => a.student_id === student.id);
        const attemptedQuizIds = new Set(attempts.map(a => a.quiz_id));

        const quests = [];

        for (const lesson of lessons) {
            const sub = data.subjects.find(s => s.id === lesson.subject_id);
            const completed = completedLessonIds.has(lesson.id);
            quests.push({
                id: `lesson-${lesson.id}`,
                type: 'lesson',
                title: lesson.title,
                subtitle: `${sub?.icon || '📘'} ${sub?.name || 'Subject'} • Lesson`,
                xp_reward: lesson.xp_reward || 0,
                status: completed ? 'completed' : 'pending',
                action_path: `/student/lessons/${lesson.id}`,
            });
        }

        for (const quiz of quizzes) {
            const sub = data.subjects.find(s => s.id === quiz.subject_id);
            const attempted = attemptedQuizIds.has(quiz.id);
            quests.push({
                id: `quiz-${quiz.id}`,
                type: 'quiz',
                title: quiz.title,
                subtitle: `${sub?.icon || '✏️'} ${sub?.name || 'Subject'} • Quiz`,
                xp_reward: quiz.xp_reward || 0,
                status: attempted ? 'completed' : 'pending',
                action_path: `/student/quizzes/${quiz.id}`,
            });
        }

        const total = quests.length;
        const completed = quests.filter(q => q.status === 'completed').length;

        res.json({
            board: {
                class_grade: grade,
                section,
                total_quests: total,
                completed_quests: completed,
                completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
                quests,
            },
        });
    } catch (err) {
        console.error('Study board error:', err);
        res.status(500).json({ error: 'Failed to load study board' });
    }
});

module.exports = router;
