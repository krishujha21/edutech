const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

function getWeekNumber(d) {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}

// GET /api/leaderboard
router.get('/', (req, res) => {
    try {
        const { school_id, period = 'weekly', grade } = req.query;

        const now = new Date();
        let periodKey;
        if (period === 'weekly') {
            periodKey = `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, '0')}`;
        } else if (period === 'monthly') {
            periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        } else {
            periodKey = `${now.getFullYear()}`;
        }

        // Build leaderboard from current student data
        let entries = data.students.map(s => {
            const user = data.users.find(u => u.id === s.user_id);
            const school = data.schools.find(sc => sc.id === user?.school_id);
            const lessonsCompleted = data.progress.filter(p => p.student_id === s.id && p.status === 'completed').length;
            const attempts = data.quiz_attempts.filter(a => a.student_id === s.id);
            const quizzesPassed = attempts.filter(a => a.percentage >= 40).length;
            const avgScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0;
            return {
                student_id: s.id, school_id: user?.school_id,
                full_name: user?.full_name, avatar_url: user?.avatar_url,
                class_grade: s.class_grade, school_name: school?.name,
                xp_points: s.xp_points, lessons_completed: lessonsCompleted,
                quizzes_passed: quizzesPassed, avg_score: avgScore,
                period_type: period, period_key: periodKey,
            };
        });

        if (school_id) entries = entries.filter(e => e.school_id === parseInt(school_id));
        if (grade) entries = entries.filter(e => e.class_grade === parseInt(grade));

        entries.sort((a, b) => b.xp_points - a.xp_points);
        const ranked = entries.slice(0, 50).map((e, idx) => ({ ...e, rank: idx + 1 }));

        res.json({ leaderboard: ranked, period, period_key: periodKey });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// GET /api/leaderboard/my-rank
router.get('/my-rank', authenticateToken, (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.json({ rank: null });

        // Rank among all students in the same school
        const user = data.users.find(u => u.id === req.user.id);
        const sameSchool = data.students
            .filter(s => {
                const u = data.users.find(u => u.id === s.user_id);
                return u?.school_id === user?.school_id;
            })
            .sort((a, b) => b.xp_points - a.xp_points);

        const idx = sameSchool.findIndex(s => s.id === student.id);

        res.json({
            rank: {
                rank: idx + 1,
                xp_points: student.xp_points,
                student_id: student.id,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch rank' });
    }
});

// POST /api/leaderboard/refresh  (no-op in demo)
router.post('/refresh', authenticateToken, (req, res) => {
    res.json({ message: 'Leaderboard refreshed', students_updated: data.students.length });
});

module.exports = router;
