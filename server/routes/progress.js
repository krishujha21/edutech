const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

// GET /api/progress — my progress
router.get('/', authenticateToken, (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.json({ progress: [] });

        const list = data.progress
            .filter(p => p.student_id === student.id)
            .map(p => {
                const lesson = data.lessons.find(l => l.id === p.lesson_id);
                const sub = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                return {
                    ...p,
                    lesson_title: lesson?.title,
                    chapter_number: lesson?.chapter_number,
                    lesson_number: lesson?.lesson_number,
                    subject_name: sub?.name,
                    subject_code: sub?.code,
                    subject_icon: sub?.icon,
                };
            })
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        res.json({ progress: list });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// POST /api/progress — update lesson progress
router.post('/', authenticateToken, (req, res) => {
    try {
        const { lesson_id, status, progress_pct, time_spent_secs, last_position, uuid: clientUuid } = req.body;

        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(400).json({ error: 'Student not found' });

        // Check for existing entry
        let entry = data.progress.find(p => p.student_id === student.id && p.lesson_id === lesson_id);

        if (entry) {
            // Update
            entry.status = status || entry.status;
            entry.progress_pct = Math.max(entry.progress_pct, progress_pct || 0);
            entry.time_spent_secs += (time_spent_secs || 0);
            entry.last_position = last_position ? JSON.stringify(last_position) : entry.last_position;
            entry.is_synced = true;
            entry.updated_at = new Date();
            if (status === 'completed' && !entry.completed_at) entry.completed_at = new Date();
        } else {
            const progressUuid = clientUuid || uuidv4();
            entry = {
                id: data.nextProgressId(), uuid: progressUuid,
                student_id: student.id, lesson_id,
                status: status || 'not_started',
                progress_pct: progress_pct || 0,
                time_spent_secs: time_spent_secs || 0,
                last_position: last_position ? JSON.stringify(last_position) : null,
                completed_at: status === 'completed' ? new Date() : null,
                is_synced: true, updated_at: new Date(),
            };
            data.progress.push(entry);
        }

        // Award XP on completion
        if (status === 'completed') {
            const lesson = data.lessons.find(l => l.id === lesson_id);
            if (lesson) student.xp_points += lesson.xp_reward;
        }

        res.json({ message: 'Progress updated', uuid: entry.uuid });
    } catch (err) {
        console.error('Progress update error:', err);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// GET /api/progress/summary — overall stats
router.get('/summary', authenticateToken, (req, res) => {
    try {
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.json({ summary: null });

        const user = data.users.find(u => u.id === req.user.id);
        const lessonsCompleted = data.progress.filter(p => p.student_id === student.id && p.status === 'completed').length;
        const attempts = data.quiz_attempts.filter(a => a.student_id === student.id);
        const avgScore = attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0;

        const studentBadges = data.student_badges
            .filter(sb => sb.student_id === student.id)
            .map(sb => data.badges.find(b => b.id === sb.badge_id))
            .filter(Boolean);

        const dailyTarget = data.daily_targets.find(
            dt => dt.student_id === student.id && dt.target_date === new Date().toISOString().split('T')[0]
        );

        res.json({
            summary: {
                student_name: user?.full_name,
                xp_points: student.xp_points,
                current_level: student.current_level,
                streak_days: student.streak_days,
                lessons_completed: lessonsCompleted,
                quizzes_attempted: attempts.length,
                avg_quiz_score: avgScore.toFixed(1),
                badges: studentBadges,
                daily_target: dailyTarget || null,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

module.exports = router;
