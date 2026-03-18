const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('govt_admin', 'super_admin'));

function isoDateKey(d) {
    return new Date(d).toISOString().split('T')[0];
}

function avg(nums) {
    if (!nums || nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getSchoolStudentIds(schoolId) {
    const studentIds = [];
    for (const s of data.students) {
        const u = data.users.find(u => u.id === s.user_id);
        if (u?.school_id === schoolId) studentIds.push(s.id);
    }
    return studentIds;
}

function getSchoolTeacherCount(schoolId) {
    const teacherUserIds = new Set(
        data.users.filter(u => u.role === 'teacher' && u.school_id === schoolId).map(u => u.id)
    );
    return data.teachers.filter(t => teacherUserIds.has(t.user_id)).length;
}

function getStudentAvgScore(studentId) {
    const attempts = data.quiz_attempts.filter(a => a.student_id === studentId);
    return avg(attempts.map(a => a.percentage));
}

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
    try {
        const activeSchools = data.schools.filter(s => s.is_active);
        const totalLessons = data.lessons.length;
        const totalQuizAttempts = data.quiz_attempts.length;
        const avgQuizScoreAll = avg(data.quiz_attempts.map(a => a.percentage));

        // Active in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const activeStudentsWeek = data.students.filter(s => {
            const u = data.users.find(u => u.id === s.user_id);
            return u?.last_login && new Date(u.last_login) >= weekAgo;
        }).length;

        // Per-school performance (AdminDashboard expects this shape)
        const schoolPerf = activeSchools.map(sc => {
            const studentIds = getSchoolStudentIds(sc.id);
            const schoolAttempts = data.quiz_attempts.filter(a => studentIds.includes(a.student_id));
            const avgScore = avg(schoolAttempts.map(a => a.percentage));

            const lessonsCompleted = data.progress.filter(p =>
                studentIds.includes(p.student_id) && p.status === 'completed'
            ).length;

            const totalStudents = studentIds.length;
            const totalTeachers = getSchoolTeacherCount(sc.id) || sc.teacher_count || 0;

            return {
                school_id: sc.id,
                school_name: sc.name,
                district: sc.district,
                state: sc.state,
                total_students: totalStudents,
                total_teachers: totalTeachers,
                avg_score: avgScore.toFixed(1),
                total_lessons_completed: lessonsCompleted,
            };
        }).sort((a, b) => (b.total_students || 0) - (a.total_students || 0));

        // Dropout risk
        const dropoutRisk = data.students
            .filter(s => s.is_at_risk)
            .map(s => {
                const u = data.users.find(u => u.id === s.user_id);
                const sc = data.schools.find(sc => sc.id === u?.school_id);
                const daysInactive = u?.last_login ? Math.floor((Date.now() - new Date(u.last_login)) / 86400000) : 999;
                return {
                    id: s.id,
                    full_name: u?.full_name,
                    school_id: u?.school_id,
                    school_name: sc?.name,
                    class_grade: s.class_grade,
                    streak_days: s.streak_days,
                    xp_points: s.xp_points,
                    last_login: u?.last_login,
                    days_inactive: daysInactive,
                };
            })
            .sort((a, b) => b.days_inactive - a.days_inactive)
            .slice(0, 50);

        // Quiz trends (last 30 days) — UI expects { period, avg_score, total_attempts }
        const thirtyAgo = new Date(Date.now() - 30 * 86400000);
        const recentAttempts = data.quiz_attempts.filter(a => a.completed_at && new Date(a.completed_at) >= thirtyAgo);
        const byPeriod = {};
        for (const a of recentAttempts) {
            const key = isoDateKey(a.completed_at);
            if (!byPeriod[key]) byPeriod[key] = { period: key, total_attempts: 0, scores: [] };
            byPeriod[key].total_attempts++;
            byPeriod[key].scores.push(a.percentage);
        }
        const quizTrends = Object.values(byPeriod)
            .map(p => ({
                period: p.period,
                date: p.period,
                total_attempts: p.total_attempts,
                avg_score: avg(p.scores).toFixed(1),
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        // Overview counts based on actual records (not just school.student_count)
        const totalStudents = data.students.length;
        const totalTeachers = data.users.filter(u => u.role === 'teacher').length;

        const overallScreenTimeSecs = data.users.reduce((sum, u) => sum + (u.total_screen_time_secs || 0), 0);
        const overallSiteVisits = data.users.reduce((sum, u) => sum + (u.site_visits || 0), 0);

        res.json({
            overview: {
                total_schools: activeSchools.length,
                total_students: totalStudents,
                total_teachers: totalTeachers,
                total_lessons: totalLessons,
                total_quiz_attempts: totalQuizAttempts,
                avg_quiz_score: avgQuizScoreAll.toFixed(1),
                active_students_week: activeStudentsWeek,
                active_students_7d: activeStudentsWeek,
                overall_screen_time_secs: overallScreenTimeSecs,
                overall_site_visits: overallSiteVisits,
            },
            district_performance: schoolPerf,
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

            // Normalize fields expected by the client AdminDashboard
            return {
                ...sc,
                total_students: sc.student_count ?? schoolStudents.length,
                total_teachers: sc.teacher_count ?? getSchoolTeacherCount(sc.id),
                school_type: sc.school_type || 'government',
                has_internet: sc.has_internet ?? true,
                actual_students: schoolStudents.length,
                avg_score: avgScore.toFixed(1),
                at_risk_count: atRisk,
            };
        });
        res.json({ schools: result });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch schools' });
    }
});

// PATCH /api/admin/schools/:id/toggle — demo toggle active/inactive
router.patch('/schools/:id/toggle', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const school = data.schools.find(s => s.id === id);
        if (!school) return res.status(404).json({ error: 'School not found' });

        school.is_active = !school.is_active;
        res.json({ message: 'School status updated', school: { id: school.id, is_active: school.is_active } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update school status' });
    }
});

// POST /api/admin/curriculum (no-op in demo)
router.post('/curriculum', (req, res) => {
    res.status(201).json({ message: 'Curriculum uploaded (demo)', id: Date.now() });
});

// GET /api/admin/scholarships
router.get('/scholarships', (req, res) => {
    try {
        // Demo scholarship schemes
        const scholarships = [
            {
                id: 1,
                name: 'Merit + Attendance Scholarship',
                description: 'For students with consistent progress and strong quiz performance.',
                amount: 5000,
                min_score: 70,
                min_xp: 200,
                eligible_grades: '5-10',
                deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
                is_active: true,
            },
            {
                id: 2,
                name: 'STEM Boost Grant',
                description: 'Encourages Science and Math excellence among rural learners.',
                amount: 3000,
                min_score: 60,
                min_xp: 150,
                eligible_grades: '6-9',
                deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
                is_active: true,
            },
        ];
        res.json({ scholarships, applications: [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch scholarships' });
    }
});

// GET /api/admin/scholarships/eligible — computed eligibility list
router.get('/scholarships/eligible', (req, res) => {
    try {
        const schemes = [
            { id: 1, name: 'Merit + Attendance Scholarship', min_score: 70, min_xp: 200 },
            { id: 2, name: 'STEM Boost Grant', min_score: 60, min_xp: 150 },
        ];

        const list = data.students.map(s => {
            const u = data.users.find(u => u.id === s.user_id);
            const school = data.schools.find(sc => sc.id === u?.school_id);
            const avgScore = getStudentAvgScore(s.id);
            const eligibleFor = schemes
                .filter(sc => (s.xp_points || 0) >= sc.min_xp && avgScore >= sc.min_score)
                .map(sc => ({ id: sc.id, name: sc.name }));

            return {
                id: s.id,
                full_name: u?.full_name,
                school_id: u?.school_id,
                school_name: school?.name,
                class_grade: s.class_grade,
                section: s.section,
                xp_points: s.xp_points,
                avg_score: avgScore.toFixed(1),
                streak_days: s.streak_days,
                eligible_for: eligibleFor,
            };
        })
            .filter(s => s.eligible_for.length > 0)
            .sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0) || parseFloat(b.avg_score) - parseFloat(a.avg_score));

        res.json({ eligible_students: list.slice(0, 100) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to compute eligible students' });
    }
});

module.exports = router;
