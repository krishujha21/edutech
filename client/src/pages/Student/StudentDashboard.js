import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { dbGetAll, getOfflineStats, dbGet, dbPutBulk } from '../../db/indexedDB';
import { StatCard, Card, ProgressBar, LoadingSpinner } from '../../components/common/UI';

export default function StudentDashboard() {
    const { user } = useAuth();
    const { isOnline } = useOffline();
    const { t } = useLanguage();
    const [summary, setSummary] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [isOnline]);

    async function loadDashboard() {
        try {
            if (isOnline) {
                const [sumData, annData, hwData] = await Promise.all([
                    apiFetch('/progress/summary'),
                    apiFetch(`/announcements?role=student${user?.school_id ? `&school_id=${user.school_id}` : ''}`),
                    apiFetch('/homework/me'),
                ]);
                setSummary(sumData.summary);
                setAnnouncements(annData.announcements || []);
                setHomework(hwData.homework || []);

                // Cache for offline use (best-effort)
                try {
                    await dbPutBulk('announcements', annData.announcements || []);
                } catch (_) { }
                try {
                    await dbPutBulk('homework', hwData.homework || []);
                } catch (_) { }
            } else {
                // Load from offline storage
                const stats = await getOfflineStats();
                const cached = await dbGet('user_profile', 'current');
                const cachedAnn = await dbGetAll('announcements');
                const cachedHw = await dbGetAll('homework');
                setSummary({
                    student_name: cached?.full_name || user?.full_name,
                    xp_points: cached?.xp_points || 0,
                    current_level: cached?.current_level || 1,
                    streak_days: cached?.streak_days || 0,
                    ...stats,
                    badges: []
                });
                setAnnouncements(cachedAnn || []);
                setHomework(cachedHw || []);
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
            const stats = await getOfflineStats();
            setSummary({ student_name: user?.full_name, xp_points: 0, current_level: 1, streak_days: 0, ...stats, badges: [] });
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    const xpToNext = ((summary?.current_level || 1) * 100) - (summary?.xp_points || 0);

    const subjects = [
        { code: 'MATH', name: t('subjects.math'), icon: '🔢', color: 'bg-indigo-500' },
        { code: 'SCI', name: t('subjects.sci'), icon: '🔬', color: 'bg-green-500' },
        { code: 'ENG', name: t('subjects.eng'), icon: '📖', color: 'bg-red-500' },
        { code: 'SST', name: t('subjects.sst'), icon: '🌍', color: 'bg-yellow-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6">
                <h1 className="text-xl font-bold">👋 Namaste, {summary?.student_name || user?.full_name}!</h1>
                <p className="opacity-80 text-sm mt-1">Class {user?.class_grade} • Keep up the great work!</p>

                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold">⭐ {summary?.xp_points || 0}</p>
                        <p className="text-xs opacity-75">{t('xp_points')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">🏅 {summary?.current_level || 1}</p>
                        <p className="text-xs opacity-75">{t('level')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">🔥 {summary?.streak_days || 0}</p>
                        <p className="text-xs opacity-75">{t('streak')}</p>
                    </div>
                </div>

                <div className="mt-3">
                    <div className="flex justify-between text-xs opacity-75 mb-1">
                        <span>Level {summary?.current_level || 1}</span>
                        <span>{xpToNext > 0 ? `${xpToNext} XP to next level` : 'Level up!'}</span>
                    </div>
                    <div className="w-full bg-indigo-400 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min(100, ((summary?.xp_points || 0) % 100))}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon="📖" label="Lessons Done" value={summary?.lessons_completed || 0} color="blue" />
                <StatCard icon="✏️" label="Quizzes Taken" value={summary?.quizzes_attempted || 0} color="green" />
                <StatCard icon="📊" label="Avg Score" value={`${summary?.avg_quiz_score || 0}%`} color="yellow" />
                <StatCard icon="🏆" label="Badges" value={summary?.badges?.length || 0} color="purple" />
            </div>

            {/* Subject Quick Access */}
            <h2 className="text-lg font-bold text-gray-800 mb-3">📚 {t('lessons')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {subjects.map(sub => (
                    <Link key={sub.code} to={`/student/lessons?subject=${sub.code}`}>
                        <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                            <span className="text-3xl">{sub.icon}</span>
                            <p className="font-medium text-gray-800 text-sm mt-2">{sub.name}</p>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Link to="/student/quizzes" className="bg-green-500 text-white rounded-xl p-4 text-center hover:bg-green-600 transition-colors">
                    <span className="text-2xl">✏️</span>
                    <p className="font-bold mt-1">Take Quiz</p>
                    <p className="text-xs opacity-80">Test your knowledge</p>
                </Link>
                <Link to="/student/leaderboard" className="bg-amber-500 text-white rounded-xl p-4 text-center hover:bg-amber-600 transition-colors">
                    <span className="text-2xl">🏆</span>
                    <p className="font-bold mt-1">{t('leaderboard')}</p>
                    <p className="text-xs opacity-80">See your rank</p>
                </Link>
            </div>

            <Link to="/student/study" className="block mb-6">
                <div className="bg-indigo-600 text-white rounded-xl p-4 hover:bg-indigo-700 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold">🎮 Gamified Study</p>
                            <p className="text-xs opacity-80">Quests for Class {user?.class_grade}</p>
                        </div>
                        <span className="text-sm font-medium">Open →</span>
                    </div>
                </div>
            </Link>

            {/* Badges */}
            {summary?.badges && summary.badges.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">🏆 {t('badges')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {summary.badges.map(b => (
                            <div key={b.id} className="bg-yellow-50 rounded-xl p-3 text-center min-w-16">
                                <span className="text-2xl">{b.icon}</span>
                                <p className="text-xs font-medium text-gray-700 mt-1">{b.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Homework */}
            {homework.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Homework</h2>
                    <div className="space-y-2">
                        {homework.slice(0, 3).map(h => (
                            <Card key={h.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{h.subject_icon || '📘'}</span>
                                            <h4 className="font-medium text-gray-800 text-sm">{h.title}</h4>
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            {h.subject_name || 'Subject'}
                                            {h.due_date ? ` • Due ${new Date(h.due_date).toLocaleDateString()}` : ''}
                                        </p>
                                        {h.description && <p className="text-gray-600 text-xs mt-1">{h.description}</p>}
                                        {h.quiz_title && <p className="text-gray-500 text-xs mt-1">Quiz: {h.quiz_title}</p>}
                                    </div>

                                    {h.quiz_id ? (
                                        <Link
                                            to={`/student/quizzes/${h.quiz_id}`}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg font-medium whitespace-nowrap"
                                        >Start Quiz</Link>
                                    ) : (
                                        <span className="text-xs text-gray-400 whitespace-nowrap">—</span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Announcements */}
            {announcements.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">📢 {t('announcements')}</h2>
                    <div className="space-y-2">
                        {announcements.slice(0, 3).map(a => (
                            <Card key={a.id}>
                                <div className="flex items-start gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        a.priority === 'urgent' ? 'bg-red-500 text-white' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>{a.priority}</span>
                                    <div>
                                        <h4 className="font-medium text-gray-800 text-sm">{a.title}</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">{a.content}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
