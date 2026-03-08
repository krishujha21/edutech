import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { dbGetAll } from '../../db/indexedDB';
import { Card, LoadingSpinner, EmptyState } from '../../components/common/UI';

export default function Leaderboard() {
    const { user } = useAuth();
    const { isOnline } = useOffline();
    const { t } = useLanguage();
    const [leaderboard, setLeaderboard] = useState([]);
    const [period, setPeriod] = useState('weekly');
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [period, isOnline]);

    async function loadLeaderboard() {
        setLoading(true);
        try {
            if (isOnline) {
                const [lbData, rankData] = await Promise.all([
                    apiFetch(`/leaderboard?school_id=${user?.school_id || ''}&period=${period}`),
                    apiFetch('/leaderboard/my-rank')
                ]);
                setLeaderboard(lbData.leaderboard);
                setMyRank(rankData.rank);
            } else {
                const cached = await dbGetAll('leaderboard');
                setLeaderboard(cached);
            }
        } catch (err) {
            const cached = await dbGetAll('leaderboard');
            setLeaderboard(cached);
        } finally {
            setLoading(false);
        }
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-50 border-yellow-300';
        if (rank === 2) return 'bg-gray-50 border-gray-300';
        if (rank === 3) return 'bg-orange-50 border-orange-300';
        return 'bg-white border-gray-100';
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">🏆 {t('leaderboard')}</h1>
            <p className="text-gray-500 text-sm mb-4">
                See how you rank against your peers
                {!isOnline && <span className="text-yellow-600 ml-2">📴 Offline</span>}
            </p>

            {/* Period selector */}
            <div className="flex gap-2 mb-6">
                {['weekly', 'monthly', 'all_time'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {p === 'weekly' ? '📅 This Week' : p === 'monthly' ? '📆 This Month' : '🏆 All Time'}
                    </button>
                ))}
            </div>

            {/* My Rank */}
            {myRank && (
                <Card className="mb-4 bg-indigo-50 border-indigo-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-indigo-600 font-medium">Your Rank</p>
                            <p className="text-3xl font-bold text-indigo-700">{getRankIcon(myRank.rank || '—')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">⭐ {myRank.xp_points} XP</p>
                            <p className="text-sm text-gray-500">📊 {parseFloat(myRank.avg_score || 0).toFixed(0)}% avg</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Leaderboard */}
            {loading ? (
                <LoadingSpinner text="Loading leaderboard..." />
            ) : leaderboard.length === 0 ? (
                <EmptyState icon="🏆" title="No rankings yet" message="Complete lessons and quizzes to appear on the leaderboard!" />
            ) : (
                <div className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                        <Card key={entry.id || idx} className={`${getRankColor(entry.rank)} border`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                                    {getRankIcon(entry.rank)}
                                </div>
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
                                    {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="w-10 h-10 rounded-full" /> : '👤'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{entry.full_name}</p>
                                    <p className="text-xs text-gray-400">{entry.school_name} • Class {entry.class_grade}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600">⭐ {entry.xp_points}</p>
                                    <p className="text-xs text-gray-400">
                                        📖 {entry.lessons_completed} • 📊 {parseFloat(entry.avg_score || 0).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
