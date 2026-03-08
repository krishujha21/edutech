import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { getOfflineStats, getUnsyncedData, dbGetAll } from '../../db/indexedDB';
import syncManager from '../../db/syncManager';
import { Card, StatCard, ProgressBar } from '../../components/common/UI';

export default function StudentProfile() {
    const { user, logout } = useAuth();
    const { isOnline, lastSync, triggerSync, isSyncing } = useOffline();
    const { t, lang, changeLang } = useLanguage();
    const [offlineStats, setOfflineStats] = useState(null);
    const [unsyncedCount, setUnsyncedCount] = useState(0);
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const stats = await getOfflineStats();
        setOfflineStats(stats);

        const unsynced = await getUnsyncedData();
        setUnsyncedCount(unsynced.quiz_attempts.length + unsynced.progress.length);

        const b = await dbGetAll('badges');
        setBadges(b);
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 text-center">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center text-4xl">
                    👤
                </div>
                <h1 className="text-xl font-bold mt-3">{user?.full_name}</h1>
                <p className="opacity-75 text-sm">@{user?.username} • Class {user?.class_grade}</p>
                <div className="flex justify-center gap-6 mt-4">
                    <div>
                        <p className="text-2xl font-bold">⭐ {user?.xp_points || 0}</p>
                        <p className="text-xs opacity-75">{t('xp_points')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">🏅 {user?.current_level || 1}</p>
                        <p className="text-xs opacity-75">{t('level')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">🔥 {user?.streak_days || 0}</p>
                        <p className="text-xs opacity-75">{t('streak')}</p>
                    </div>
                </div>
            </div>

            {/* Offline Stats */}
            <Card className="mb-4">
                <h2 className="font-bold text-gray-800 mb-3">📊 Offline Statistics</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500">Lessons Completed</p>
                        <p className="text-xl font-bold text-blue-700">{offlineStats?.lessons_completed || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500">Quizzes Taken</p>
                        <p className="text-xl font-bold text-green-700">{offlineStats?.quizzes_attempted || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500">Avg Quiz Score</p>
                        <p className="text-xl font-bold text-yellow-700">{offlineStats?.avg_quiz_score || 0}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500">Study Time</p>
                        <p className="text-xl font-bold text-purple-700">{offlineStats?.total_time_mins || 0} min</p>
                    </div>
                </div>
            </Card>

            {/* Sync Status */}
            <Card className="mb-4">
                <h2 className="font-bold text-gray-800 mb-3">🔄 Sync Status</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Connection</span>
                        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Last Synced</span>
                        <span className="text-sm text-gray-700">
                            {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Unsynced Items</span>
                        <span className={`text-sm font-medium ${unsyncedCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {unsyncedCount} {unsyncedCount === 0 ? '✓' : '⚠️'}
                        </span>
                    </div>

                    <button
                        onClick={triggerSync}
                        disabled={!isOnline || isSyncing}
                        className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSyncing ? '⟳ Syncing...' : '↻ Sync Now'}
                    </button>
                </div>
            </Card>

            {/* Language Preference */}
            <Card className="mb-4">
                <h2 className="font-bold text-gray-800 mb-3">🌐 Language / भाषा</h2>
                <div className="flex gap-2">
                    {[
                        { code: 'en', name: 'English' },
                        { code: 'hi', name: 'हिन्दी' },
                        { code: 'ta', name: 'தமிழ்' },
                    ].map(l => (
                        <button
                            key={l.code}
                            onClick={() => changeLang(l.code)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${lang === l.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >{l.name}</button>
                    ))}
                </div>
            </Card>

            {/* Badges */}
            {badges.length > 0 && (
                <Card className="mb-4">
                    <h2 className="font-bold text-gray-800 mb-3">🏆 {t('badges')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {badges.map(b => (
                            <div key={b.id} className="bg-yellow-50 rounded-xl p-3 text-center">
                                <span className="text-2xl">{b.icon}</span>
                                <p className="text-xs font-medium mt-1">{b.name}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Logout */}
            <button onClick={logout} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 mt-4">
                🚪 {t('logout')}
            </button>
        </div>
    );
}
