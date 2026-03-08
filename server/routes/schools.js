const express = require('express');
const router = express.Router();
const data = require('../data/demo');

// GET /api/schools
router.get('/', (req, res) => {
    try {
        const { district, state } = req.query;
        let list = data.schools.filter(s => s.is_active);
        if (district) list = list.filter(s => s.district === district);
        if (state) list = list.filter(s => s.state === state);
        list.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            schools: list.map(s => ({
                id: s.id, name: s.name, code: s.code, district: s.district,
                state: s.state, student_count: s.student_count, teacher_count: s.teacher_count,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch schools' });
    }
});

// POST /api/schools/register
router.post('/register', (req, res) => {
    try {
        const { name, district, state, block, pin_code, address, principal_name, contact_phone, contact_email } = req.body;
        const code = `SCH-${Date.now().toString(36).toUpperCase()}`;
        const id = data.schools.length + 1;
        data.schools.push({
            id, name, code, district, state, block, pin_code, address,
            principal_name, contact_phone, contact_email,
            student_count: 0, teacher_count: 0, is_active: true,
        });

        res.status(201).json({ message: 'School registered', id, code });
    } catch (err) {
        res.status(500).json({ error: 'School registration failed' });
    }
});

// GET /api/schools/metrics
router.get('/metrics', (req, res) => {
    try {
        const activeSchools = data.schools.filter(s => s.is_active);
        const districts = new Set(activeSchools.map(s => s.district));
        res.json({
            metrics: {
                total_schools: activeSchools.length,
                total_students: data.students.length,
                total_teachers: data.teachers.length,
                total_lessons: data.lessons.filter(l => l.is_published).length,
                total_quiz_attempts: data.quiz_attempts.length,
                districts_covered: districts.size,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

module.exports = router;
