const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('govt_admin', 'super_admin'));

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
    try {
        const activeSchools = data.schools.filter(s => s.is_active);
        const totalStudents = activeSchools.reduce((s, sc) => s + (sc.student_count || 0), 0);
        const totalTeachers = activeSchools.reduce((s, sc) => s + (sc.teacher_count || 0), 0);

        // Active in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const activeStudents = data.students.filter(s => {
            const u = data.users.find(u => u.id === s.user_id);
            return u?.last_login && new Date(u.last_login) >= weekAgo;
        }).length;

        // District performance
        const districts = {};
        for (const sc of activeSchools) {
            const key = `${sc.district}|${sc.state}`;
            if (!districts[key]) districts[key] = { district: sc.district, state: sc.state, schools: 0, students: 0, at_risk: 0, scores: [] };
            districts[key].schools++;
            districts[key].students += sc.student_count || 0;
        }
        // Add student data
        for (const s of data.students) {
            const u = data.users.find(u => u.id === s.user_id);
            const sc = data.schools.find(sc => sc.id === u?.school_id);
            if (!sc) continue;
            const key = `${sc.district}|${sc.state}`;
            if (districts[key]) {
                if (s.is_at_risk) districts[key].at_risk++;
                const attempts = data.quiz_attempts.filter(a => a.student_id === s.id);
                attempts.forEach(a => districts[key].scores.push(a.percentage));
            }
        }
        const districtPerf = Object.values(districts).map(d => ({
            ...d, avg_score: d.scores.length > 0 ? (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1) : '0.0',
            scores: undefined,
        }));

        // Dropout risk
        const dropoutRisk = data.students
            .filter(s => s.is_at_risk)
            .map(s => {
                const u = data.users.find(u => u.id === s.user_id);
                const sc = data.schools.find(sc => sc.id === u?.school_id);
                const daysInactive = u?.last_login ? Math.floor((Date.now() - new Date(u.last_login)) / 86400000) : 999;
                return { id: s.id, full_name: u?.full_name, school_id: u?.school_id, school_name: sc?.name, class_grade: s.class_grade, streak_days: s.streak_days, xp_points: s.xp_points, last_login: u?.last_login, days_inactive: daysInactive };
            })
            .sort((a, b) => b.days_inactive - a.days_inactive)
            .slice(0, 50);

        // Quiz trends (last 30 days)
        const thirtyAgo = new Date(Date.now() - 30 * 86400000);
        const recentAttempts = data.quiz_attempts.filter(a => a.completed_at && new Date(a.completed_at) >= thirtyAgo);
        const byDate = {};
        for (const a of recentAttempts) {
            const d = new Date(a.completed_at).toISOString().split('T')[0];
            if (!byDate[d]) byDate[d] = { date: d, attempts: 0, scores: [] };
            byDate[d].attempts++;
            byDate[d].scores.push(a.percentage);
        }
        const quizTrends = Object.values(byDate).map(d => ({
            date: d.date, attempts: d.attempts,
            avg_score: d.scores.length > 0 ? (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1) : '0.0',
        })).sort((a, b) => a.date.localeCompare(b.date));

        const scholarshipCount = data.students.filter(s => s.scholarship_eligible).length;

        res.json({
            overview: {
                total_schools: activeSchools.length,
                total_students: totalStudents,
                total_teachers: totalTeachers,
                active_students_7d: activeStudents,
                scholarship_eligible: scholarshipCount,
            },
            district_performance: districtPerf,
            dropout_risk: dropoutRisk,
            quiz_trends: quizTrends,
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ error: 'Failed to load admin dashboard' });
    }
});

// GET /api/admin/schools
router.get('/schools', (req, res) => {
    try {
        const result = data.schools.map(sc => {
            const schoolStudents = data.students.filter(s => {
                const u = data.users.find(u => u.id === s.user_id);
                return u?.school_id === sc.id;
            });
            const attempts = data.quiz_attempts.filter(a => schoolStudents.some(s => s.id === a.student_id));
            const avgScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0;
            const atRisk = schoolStudents.filter(s => s.is_at_risk).length;
            return { ...sc, actual_students: schoolStudents.length, avg_score: avgScore.toFixed(1), at_risk_count: atRisk };
        });
        res.json({ schools: result });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch schools' });
    }
});

// POST /api/admin/curriculum (no-op in demo)
router.post('/curriculum', (req, res) => {
    res.status(201).json({ message: 'Curriculum uploaded (demo)', id: Date.now() });
});

// GET /api/admin/scholarships
router.get('/scholarships', (req, res) => {
    try {
        res.json({ scholarships: [], applications: [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch scholarships' });
    }
});

module.exports = router;
