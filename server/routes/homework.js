const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/homework/me — homework assigned to my class/section in my school
router.get('/me', (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.json({ homework: [] });

        const schoolId = req.user.school_id;
        if (!schoolId) return res.json({ homework: [] });

        const section = String(student.section || '');

        let list = data.homework.filter(h => {
            if (h.school_id !== schoolId) return false;
            if (parseInt(h.class_grade) !== parseInt(student.class_grade)) return false;
            // If homework specifies a section, it must match. If it doesn't, it's for all sections.
            if (h.section && String(h.section) !== section) return false;
            return true;
        });

        const enriched = list
            .map(h => {
                const sub = data.subjects.find(s => s.id === parseInt(h.subject_id));
                const quiz = h.quiz_id ? data.quizzes.find(q => q.id === parseInt(h.quiz_id)) : null;
                return {
                    ...h,
                    subject_name: sub?.name,
                    subject_code: sub?.code,
                    subject_icon: sub?.icon,
                    quiz_title: quiz?.title,
                };
            })
            .sort((a, b) => {
                const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                if (ad !== bd) return ad - bd;
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });

        res.json({ homework: enriched });
    } catch (err) {
        console.error('Homework me error:', err);
        res.status(500).json({ error: 'Failed to fetch homework' });
    }
});

module.exports = router;
