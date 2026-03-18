import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { apiFetch } from '../../config/api';
import { Card, LoadingSpinner, ProgressBar, EmptyState } from '../../components/common/UI';

function formatMins(secs) {
    const m = Math.round((secs || 0) / 60);
    if (m < 60) return `${m} mins`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${h}h ${r}m`;
}

export default function GamifiedStudy() {
    const { user } = useAuth();
    const { isOnline } = useOffline();
    const [board, setBoard] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const grade = useMemo(() => board?.class_grade || user?.class_grade, [board, user]);

    useEffect(() => {
        load();
    }, [isOnline]);

    async function load() {
        setLoading(true);
        try {
            if (!isOnline) {
                setBoard(null);
                setLeaderboard([]);
                setMyRank(null);
                return;
            }

            const boardData = await apiFetch('/study/me');
            setBoard(boardData.board);

            // Leaderboard scoped to same school + grade.
            const [lbData, rankData] = await Promise.all([
                apiFetch(`/leaderboard?school_id=${user?.school_id || ''}&period=weekly&grade=${encodeURIComponent(boardData.board.class_grade)}`),
                apiFetch('/leaderboard/my-rank')
            ]);
            setLeaderboard((lbData.leaderboard || []).slice(0, 10));
            setMyRank(rankData.rank);
        } catch (err) {
            console.error('Gamified study load error:', err);
            setBoard(null);
            setLeaderboard([]);
            setMyRank(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading study arena..." />;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🎮 Gamified Study</h1>
                    <p className="text-gray-500 text-sm">
                        Class {grade}{board?.section || user?.section || ''} • Complete quests to earn XP
                        {!isOnline && <span className="text-yellow-600 ml-2">📴 Offline</span>}
                    </p>
                </div>
                <Link
                    to="/student/leaderboard"
                    className="text-sm px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                >View Leaderboard</Link>
            </div>

            {!isOnline ? (
                <EmptyState icon="📴" title="Offline" message="Connect to the internet to load your study arena." />
            ) : !board ? (
                <EmptyState icon="🎮" title="No board yet" message="We couldn't load your class study board." />
            ) : (
                <>
                    <Card className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-gray-800">🏁 Your Quest Progress</h2>
                            <p className="text-sm text-gray-500">{board.completed_quests}/{board.total_quests} completed</p>
                        </div>
                        <ProgressBar value={board.completion_pct} color={board.completion_pct >= 70 ? 'green' : board.completion_pct >= 40 ? 'yellow' : 'red'} />
                        <p className="text-xs text-gray-500 mt-2">
                            App screen time: {formatMins(user?.total_screen_time_secs || 0)} • Visits: {user?.site_visits || 0}
                        </p>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <h2 className="font-bold text-gray-800 mb-3">🧩 Quests</h2>
                            <div className="space-y-2">
                                {(board.quests || []).map(q => (
                                    <div key={q.id} className={`flex items-center justify-between gap-3 rounded-lg p-3 border ${q.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{q.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{q.subtitle} • ⭐ {q.xp_reward} XP</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {q.status === 'completed' ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">Completed</span>
                                            ) : (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">Pending</span>
                                            )}
                                            <Link
                                                to={q.action_path}
                                                className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                                            >{q.type === 'quiz' ? 'Play' : 'Start'}</Link>
                                        </div>
                                    </div>
                                ))}
                                {(board.quests || []).length === 0 && (
                                    <p className="text-sm text-gray-500">No quests available for this class.</p>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="font-bold text-gray-800 mb-3">🏆 Class Leaderboard (Weekly)</h2>
                            {!leaderboard || leaderboard.length === 0 ? (
                                <p className="text-sm text-gray-500">No rankings yet for your class.</p>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map(e => (
                                        <div key={`${e.student_id}-${e.rank}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">#{e.rank} {e.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">📖 {e.lessons_completed} • 📊 {parseFloat(e.avg_score || 0).toFixed(0)}%</p>
                                            </div>
                                            <p className="font-bold text-indigo-700 whitespace-nowrap">⭐ {e.xp_points}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {myRank?.rank && (
                                <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                    <p className="text-xs text-indigo-700 font-medium">Your school rank</p>
                                    <p className="text-2xl font-bold text-indigo-800">#{myRank.rank}</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
