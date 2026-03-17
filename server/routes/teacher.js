const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('teacher', 'school_admin', 'super_admin'));

function avg(nums) {
    if (!nums || nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getStudentUser(student) {
    return data.users.find(u => u.id === student.user_id);
}

// GET /api/teacher/dashboard
router.get('/dashboard', (req, res) => {
    try {
        const schoolId = req.user.school_id;
        const teacher = data.teachers.find(t => t.user_id === req.user.id);
        const teacherUser = data.users.find(u => u.id === req.user.id);

        // Students in this school
        const schoolStudents = data.students.filter(s => {
            const u = data.users.find(u => u.id === s.user_id);
            return u?.school_id === schoolId;
        });

        // Avg quiz score
        const studentIds = new Set(schoolStudents.map(s => s.id));
        const schoolAttempts = data.quiz_attempts.filter(a => studentIds.has(a.student_id));
        const avgScore = schoolAttempts.length > 0
            ? schoolAttempts.reduce((sum, a) => sum + a.percentage, 0) / schoolAttempts.length : 0;

        // At-risk students
        const atRisk = schoolStudents.filter(s => s.is_at_risk).map(s => {
            const u = data.users.find(u => u.id === s.user_id);
            return { ...s, full_name: u?.full_name, phone: u?.phone };
        });

        // Lessons completed this week (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const weeklyLessons = data.progress.filter(p =>
            studentIds.has(p.student_id) && p.status === 'completed' &&
            p.completed_at && new Date(p.completed_at) >= weekAgo
        ).length;

        // Per-subject performance
        const subjectPerf = data.subjects.map(sub => {
            const subAttempts = schoolAttempts.filter(a => {
                const quiz = data.quizzes.find(q => q.id === a.quiz_id);
                return quiz?.subject_id === sub.id;
            });
            return {
                name: sub.name, code: sub.code, icon: sub.icon,
                attempts: subAttempts.length,
                avg_score: subAttempts.length > 0
                    ? (subAttempts.reduce((s, a) => s + a.percentage, 0) / subAttempts.length).toFixed(1) : '0.0',
            };
        });

        // Class-wise performance
        const grades = [...new Set(schoolStudents.map(s => s.class_grade))].sort();
        const classPerf = grades.map(g => {
            const gradeStudents = schoolStudents.filter(s => s.class_grade === g);
            const gradeIds = new Set(gradeStudents.map(s => s.id));
            const lessonsComp = data.progress.filter(p => gradeIds.has(p.student_id) && p.status === 'completed').length;
            return {
                class_grade: g,
                students: gradeStudents.length,
                avg_xp: gradeStudents.length > 0
                    ? (gradeStudents.reduce((s, st) => s + st.xp_points, 0) / gradeStudents.length).toFixed(0) : 0,
                lessons_completed: lessonsComp,
            };
        });

        res.json({
            teacher: teacher ? { ...teacher, full_name: teacherUser?.full_name } : null,
            stats: {
                total_students: schoolStudents.length,
                avg_quiz_score: avgScore.toFixed(1),
                at_risk_count: atRisk.length,
                weekly_lessons_completed: weeklyLessons,
            },
            at_risk_students: atRisk,
            subject_performance: subjectPerf,
            class_performance: classPerf,
        });
    } catch (err) {
        console.error('Teacher dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

// GET /api/teacher/students
router.get('/students', (req, res) => {
    try {
        const { grade, section } = req.query;
        let schoolStudents = data.students.filter(s => {
            const u = data.users.find(u => u.id === s.user_id);
            return u?.school_id === req.user.school_id;
        });

        if (grade) schoolStudents = schoolStudents.filter(s => s.class_grade === parseInt(grade));
        if (section) schoolStudents = schoolStudents.filter(s => s.section === section);

        const result = schoolStudents.map(s => {
            const u = data.users.find(u => u.id === s.user_id);
            const lessonsCompleted = data.progress.filter(p => p.student_id === s.id && p.status === 'completed').length;
            const attempts = data.quiz_attempts.filter(a => a.student_id === s.id);
            const avgScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0;
            const screenTimeSecs = data.progress.filter(p => p.student_id === s.id).reduce((sum, p) => sum + (p.time_spent_secs || 0), 0)
                + attempts.reduce((sum, a) => sum + (a.time_taken_secs || 0), 0);
            return {
                ...s, full_name: u?.full_name, phone: u?.phone, last_login: u?.last_login,
                lessons_completed: lessonsCompleted, avg_score: avgScore.toFixed(1),
                screen_time_secs: screenTimeSecs,
            };
        }).sort((a, b) => a.class_grade - b.class_grade || (a.full_name || '').localeCompare(b.full_name || ''));

        res.json({ students: result });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// GET /api/teacher/students/:id — detailed student view
router.get('/students/:id', (req, res) => {
    try {
        const studentId = parseInt(req.params.id);
        const student = data.students.find(s => s.id === studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const user = getStudentUser(student);
        if (!user || user.school_id !== req.user.school_id) {
            return res.status(403).json({ error: 'Student not in your school' });
        }

        const progress = data.progress
            .filter(p => p.student_id === student.id)
            .map(p => {
                const lesson = data.lessons.find(l => l.id === p.lesson_id);
                const sub = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                return {
                    ...p,
                    lesson_title: lesson?.title,
                    class_grade: lesson?.class_grade,
                    subject_name: sub?.name,
                    subject_code: sub?.code,
                };
            })
            .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

        const attempts = data.quiz_attempts
            .filter(a => a.student_id === student.id)
            .map(a => {
                const quiz = data.quizzes.find(q => q.id === a.quiz_id);
                const sub = quiz ? data.subjects.find(s => s.id === quiz.subject_id) : null;
                return {
                    ...a,
                    quiz_title: quiz?.title,
                    class_grade: quiz?.class_grade,
                    subject_name: sub?.name,
                    subject_code: sub?.code,
                };
            })
            .sort((a, b) => new Date(b.completed_at || b.created_at || 0) - new Date(a.completed_at || a.created_at || 0));

        const lessonsCompleted = progress.filter(p => p.status === 'completed').length;
        const avgScore = avg(attempts.map(a => a.percentage));
        const screenTimeSecs = progress.reduce((sum, p) => sum + (p.time_spent_secs || 0), 0)
            + attempts.reduce((sum, a) => sum + (a.time_taken_secs || 0), 0);

        res.json({
            student: {
                ...student,
                full_name: user.full_name,
                phone: user.phone,
                email: user.email,
                last_login: user.last_login,
            },
            stats: {
                lessons_completed: lessonsCompleted,
                quiz_attempts: attempts.length,
                avg_score: avgScore.toFixed(1),
                screen_time_secs: screenTimeSecs,
            },
            progress,
            attempts,
        });
    } catch (err) {
        console.error('Teacher student detail error:', err);
        res.status(500).json({ error: 'Failed to fetch student details' });
    }
});

// POST /api/teacher/homework
router.post('/homework', (req, res) => {
    try {
        const { class_grade, section, subject_id, title, description, quiz_id, due_date } = req.body;
        const teacher = data.teachers.find(t => t.user_id === req.user.id);
        if (!teacher) return res.status(400).json({ error: 'Teacher not found' });

        const id = data.nextHomeworkId();
        data.homework.push({
            id, uuid: uuidv4(), teacher_id: teacher.id, school_id: req.user.school_id,
            class_grade, section, subject_id, title, description, quiz_id, due_date,
            created_at: new Date(),
        });

        res.status(201).json({ message: 'Homework assigned', id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to assign homework' });
    }
});

// POST /api/teacher/announcement
router.post('/announcement', (req, res) => {
    try {
        const { title, content, target_grade, priority } = req.body;
        const id = data.nextAnnouncementId();
        data.announcements.push({
            id, uuid: uuidv4(), title, content, author_id: req.user.id,
            target_role: 'student', target_school: req.user.school_id,
            target_grade, priority: priority || 'normal',
            is_active: true, expires_at: null, created_at: new Date(),
        });

        res.status(201).json({ message: 'Announcement posted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to post announcement' });
    }
});

// GET /api/teacher/homework — list assigned homework
router.get('/homework', (req, res) => {
    try {
        const { class_grade, section } = req.query;
        const teacher = data.teachers.find(t => t.user_id === req.user.id);
        if (!teacher) return res.json({ homework: [] });

        let list = data.homework.filter(h => h.teacher_id === teacher.id && h.school_id === req.user.school_id);
        if (class_grade) list = list.filter(h => parseInt(h.class_grade) === parseInt(class_grade));
        if (section) list = list.filter(h => String(h.section || '') === String(section));

        const enriched = list
            .map(h => {
                const sub = data.subjects.find(s => s.id === parseInt(h.subject_id));
                const quiz = h.quiz_id ? data.quizzes.find(q => q.id === parseInt(h.quiz_id)) : null;
                return {
                    ...h,
                    subject_name: sub?.name,
                    subject_code: sub?.code,
                    quiz_title: quiz?.title,
                };
            })
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        res.json({ homework: enriched });
    } catch (err) {
        console.error('Teacher homework list error:', err);
        res.status(500).json({ error: 'Failed to fetch homework' });
    }
});

module.exports = router;
