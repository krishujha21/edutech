const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

// GET /api/lessons — filterable list
router.get('/', (req, res) => {
    try {
        const { grade, subject, language, page = 1, limit = 20 } = req.query;
        let list = data.lessons.filter(l => l.is_published);

        if (grade) list = list.filter(l => l.class_grade === parseInt(grade));
        if (subject) {
            const sub = data.subjects.find(s => s.code === subject);
            if (sub) list = list.filter(l => l.subject_id === sub.id);
        }
        if (language) list = list.filter(l => l.language === language);

        list.sort((a, b) => a.class_grade - b.class_grade || a.subject_id - b.subject_id || a.chapter_number - b.chapter_number || a.lesson_number - b.lesson_number);

        const total = list.length;
        const pg = parseInt(page);
        const lim = parseInt(limit);
        const paged = list.slice((pg - 1) * lim, pg * lim);

        // Enrich with subject info
        const enriched = paged.map(l => {
            const s = data.subjects.find(s => s.id === l.subject_id);
            return { ...l, subject_name: s?.name, subject_code: s?.code, subject_icon: s?.icon };
        });

        res.json({ lessons: enriched, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) } });
    } catch (err) {
        console.error('Lessons fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// GET /api/lessons/subjects
router.get('/subjects', (req, res) => {
    try {
        res.json({ subjects: data.subjects.filter(s => s.is_active) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// GET /api/lessons/offline/bundle  (must be BEFORE /:id)
router.get('/offline/bundle', authenticateToken, (req, res) => {
    try {
        const { grade, lastSync } = req.query;
        let list = data.lessons.filter(l => l.is_published);
        if (grade) list = list.filter(l => l.class_grade === parseInt(grade));
        if (lastSync) list = list.filter(l => new Date(l.updated_at) > new Date(lastSync));

        const lessonIds = new Set(list.map(l => l.id));
        const quizList = data.quizzes.filter(q => lessonIds.has(q.lesson_id) && q.is_published);

        res.json({ lessons: list, quizzes: quizList, timestamp: new Date().toISOString(), count: list.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch offline bundle' });
    }
});

// GET /api/lessons/:id
router.get('/:id', (req, res) => {
    try {
        const lesson = data.lessons.find(l => l.id === parseInt(req.params.id));
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        const s = data.subjects.find(s => s.id === lesson.subject_id);
        res.json({ lesson: { ...lesson, subject_name: s?.name, subject_code: s?.code } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});

module.exports = router;
