const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken, generateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, full_name, email, phone, preferred_lang, school_id,
            class_grade, section, roll_number, parent_name, gender } = req.body;

        if (data.users.find(u => u.username === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const uuid = uuidv4();
        const userId = data.nextUserId();
        const userRole = role || 'student';

        data.users.push({
            id: userId, uuid, username, password_hash,
            role: userRole, full_name, email, phone,
            preferred_lang: preferred_lang || 'en',
            school_id: school_id || null, avatar_url: null,
            last_login: new Date(), last_sync: null,
            total_screen_time_secs: 0,
            site_visits: 0,
        });

        if (userRole === 'student') {
            data.students.push({
                id: data.nextStudentId(), user_id: userId,
                class_grade: class_grade || 5, section, roll_number,
                parent_name, gender,
                xp_points: 0, current_level: 1, streak_days: 0,
                is_at_risk: false, scholarship_eligible: false,
            });
        }

        if (userRole === 'teacher') {
            data.teachers.push({ id: data.nextTeacherId(), user_id: userId });
        }

        const token = generateToken({ id: userId, uuid, role: userRole, school_id });

        res.status(201).json({
            message: 'Registration successful', token,
            user: {
                id: userId, uuid, username, role: userRole,
                full_name, preferred_lang: preferred_lang || 'en', school_id,
                total_screen_time_secs: 0,
                site_visits: 0,
            },
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed', message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = data.users.find(u => u.username === username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(401).json({ error: 'Invalid credentials' });

        user.last_login = new Date();
        const student = data.students.find(s => s.user_id === user.id);
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id, uuid: user.uuid, username: user.username,
                role: user.role, full_name: user.full_name, email: user.email,
                preferred_lang: user.preferred_lang, school_id: user.school_id,
                class_grade: student?.class_grade || null,
                xp_points: student?.xp_points || 0,
                current_level: student?.current_level || 1,
                streak_days: student?.streak_days || 0,
                avatar_url: user.avatar_url,
                total_screen_time_secs: user.total_screen_time_secs || 0,
                site_visits: user.site_visits || 0,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = data.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const student = data.students.find(s => s.user_id === user.id);

        res.json({
            user: {
                id: user.id, uuid: user.uuid, username: user.username,
                role: user.role, full_name: user.full_name, email: user.email,
                phone: user.phone, preferred_lang: user.preferred_lang,
                school_id: user.school_id, avatar_url: user.avatar_url,
                class_grade: student?.class_grade || null,
                xp_points: student?.xp_points || 0,
                current_level: student?.current_level || 1,
                streak_days: student?.streak_days || 0,
                section: student?.section || null,
                total_screen_time_secs: user.total_screen_time_secs || 0,
                site_visits: user.site_visits || 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
