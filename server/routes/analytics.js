const express = require('express');
const router = express.Router();
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

function clampInt(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    const i = Math.floor(n);
    return Math.max(min, Math.min(max, i));
}

// POST /api/analytics/visit
// Increments site_visits for the current user.
router.post('/visit', (req, res) => {
    try {
        const user = data.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.site_visits = (user.site_visits || 0) + 1;
        res.json({ message: 'Visit recorded', site_visits: user.site_visits });
    } catch (err) {
        console.error('Visit record error:', err);
        res.status(500).json({ error: 'Failed to record visit' });
    }
});

// POST /api/analytics/screen-time
// Body: { duration_secs: number }
// Adds to total_screen_time_secs for the current user.
router.post('/screen-time', (req, res) => {
    try {
        const user = data.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const durationSecs = clampInt(req.body?.duration_secs, 0, 6 * 60 * 60); // clamp to 6h per event
        if (durationSecs <= 0) return res.json({ message: 'No time recorded', total_screen_time_secs: user.total_screen_time_secs || 0 });

        user.total_screen_time_secs = (user.total_screen_time_secs || 0) + durationSecs;
        res.json({ message: 'Screen time recorded', total_screen_time_secs: user.total_screen_time_secs });
    } catch (err) {
        console.error('Screen time record error:', err);
        res.status(500).json({ error: 'Failed to record screen time' });
    }
});

module.exports = router;
