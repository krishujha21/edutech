const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const data = require('../data/demo');
const { authenticateToken } = require('../middleware/auth');

// POST /api/sync/push — push offline data to server (simplified for demo)
router.post('/push', authenticateToken, (req, res) => {
    try {
        const { progress: progressItems = [], quiz_attempts: qaItems = [], daily_targets: dtItems = [] } = req.body;
        const student = data.students.find(s => s.user_id === req.user.id);
        if (!student) return res.status(400).json({ error: 'Student not found for this user' });

        let pushed = 0;

        // Sync progress
        for (const p of progressItems) {
            const existing = data.progress.find(x => x.uuid === p.uuid);
            if (existing) {
                existing.progress_pct = Math.max(existing.progress_pct, p.progress_pct || 0);
                existing.time_spent_secs = Math.max(existing.time_spent_secs, p.time_spent_secs || 0);
                existing.is_synced = true;
            } else {
                data.progress.push({
                    id: data.nextProgressId(), uuid: p.uuid || uuidv4(),
                    student_id: student.id, lesson_id: p.lesson_id,
                    status: p.status, progress_pct: p.progress_pct || 0,
                    time_spent_secs: p.time_spent_secs || 0,
                    last_position: p.last_position ? JSON.stringify(p.last_position) : null,
                    completed_at: p.completed_at || null, is_synced: true, updated_at: new Date(),
                });
            }
            pushed++;
        }

        // Sync quiz attempts
        for (const qa of qaItems) {
            if (!data.quiz_attempts.find(x => x.uuid === qa.uuid)) {
                data.quiz_attempts.push({
                    id: data.nextQuizAttemptId(), uuid: qa.uuid,
                    quiz_id: qa.quiz_id, student_id: student.id,
                    answers: qa.answers, score: qa.score, total_marks: qa.total_marks,
                    percentage: qa.percentage, time_taken_secs: qa.time_taken_secs,
                    started_at: qa.started_at, completed_at: qa.completed_at,
                    is_synced: true, created_at: new Date(),
                });
                student.xp_points += (qa.percentage >= 40 ? 20 : 6);
                pushed++;
            }
        }

        // Update user last sync
        const user = data.users.find(u => u.id === req.user.id);
        if (user) user.last_sync = new Date();

        res.json({ message: 'Sync push completed', records_pushed: pushed, conflicts: 0, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Sync push error:', err);
        res.status(500).json({ error: 'Sync push failed' });
    }
});

// POST /api/sync/pull — pull updates from server
router.post('/pull', authenticateToken, (req, res) => {
    try {
        const { last_sync } = req.body;
        const sinceDate = last_sync ? new Date(last_sync) : new Date(0);

        const student = data.students.find(s => s.user_id === req.user.id);
        const grade = student?.class_grade;

        let lessonsList = data.lessons.filter(l => l.is_published && new Date(l.updated_at) > sinceDate);
        if (grade) lessonsList = lessonsList.filter(l => l.class_grade === grade);

        let quizList = data.quizzes.filter(q => q.is_published && new Date(q.updated_at) > sinceDate);
        if (grade) quizList = quizList.filter(q => q.class_grade === grade);

        const anns = data.announcements.filter(a =>
            a.is_active && new Date(a.created_at) > sinceDate &&
            (a.target_role === 'all' || a.target_role === 'student') &&
            (!a.target_school || a.target_school === req.user.school_id)
        );

        const user = data.users.find(u => u.id === req.user.id);
        if (user) user.last_sync = new Date();

        res.json({
            lessons: lessonsList, quizzes: quizList,
            announcements: anns, badges: data.badges,
            student: student || null,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Sync pull error:', err);
        res.status(500).json({ error: 'Sync pull failed' });
    }
});

// GET /api/sync/status
router.get('/status', authenticateToken, (req, res) => {
    try {
        const user = data.users.find(u => u.id === req.user.id);
        res.json({ last_sync: user?.last_sync || null, recent_syncs: [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});

module.exports = router;
