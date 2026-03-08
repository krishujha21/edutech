const express = require('express');
const router = express.Router();
const data = require('../data/demo');

// GET /api/announcements
router.get('/', (req, res) => {
    try {
        const { school_id, role } = req.query;
        let list = data.announcements.filter(a =>
            a.is_active && (!a.expires_at || new Date(a.expires_at) > new Date())
        );

        if (school_id) list = list.filter(a => !a.target_school || a.target_school === parseInt(school_id));
        if (role) list = list.filter(a => a.target_role === 'all' || a.target_role === role);

        // Enrich with author name
        const enriched = list.map(a => {
            const author = data.users.find(u => u.id === a.author_id);
            return { ...a, author_name: author?.full_name || 'System' };
        });

        enriched.sort((a, b) => {
            const prio = { high: 3, normal: 2, low: 1 };
            return (prio[b.priority] || 0) - (prio[a.priority] || 0) || new Date(b.created_at) - new Date(a.created_at);
        });

        res.json({ announcements: enriched.slice(0, 20) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

module.exports = router;
