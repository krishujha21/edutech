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
    const { user, setUser } = useAuth();
    const { isOnline } = useOffline();
    const [board, setBoard] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [games, setGames] = useState([]);
    const [activeGame, setActiveGame] = useState(null);
    const [gameAnswers, setGameAnswers] = useState([]);
    const [gameQuestionIdx, setGameQuestionIdx] = useState(0);
    const [gameStartedAt, setGameStartedAt] = useState(null);
    const [gameSubmitting, setGameSubmitting] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const [loading, setLoading] = useState(true);

    const grade = useMemo(() => board?.class_grade || user?.class_grade, [board, user]);

    useEffect(() => {
        load();
    }, [isOnline]);

    useEffect(() => {
        if (!activeGame) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (e) => {
            // Don't allow ESC to dismiss the game.
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener('keydown', onKeyDown, { capture: true });

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown, { capture: true });
        };
    }, [activeGame]);

    async function load() {
        setLoading(true);
        try {
            if (!isOnline) {
                setBoard(null);
                setLeaderboard([]);
                setMyRank(null);
                setGames([]);
                setActiveGame(null);
                setGameResult(null);
                return;
            }

            const boardData = await apiFetch('/study/me');
            setBoard(boardData.board);

            // Leaderboard scoped to same school + grade + games list.
            const [lbData, rankData, gamesData] = await Promise.all([
                apiFetch(`/leaderboard?school_id=${user?.school_id || ''}&period=weekly&grade=${encodeURIComponent(boardData.board.class_grade)}`),
                apiFetch('/leaderboard/my-rank'),
                apiFetch('/games/me'),
            ]);
            setLeaderboard((lbData.leaderboard || []).slice(0, 10));
            setMyRank(rankData.rank);
            setGames(gamesData.games || []);
        } catch (err) {
            console.error('Gamified study load error:', err);
            setBoard(null);
            setLeaderboard([]);
            setMyRank(null);
            setGames([]);
        } finally {
            setLoading(false);
        }
    }

    async function startQuickChallenge(subject_code) {
        if (!isOnline) return;
        setGameResult(null);
        setGameSubmitting(false);
        const data = await apiFetch('/games/quick-challenge/start', {
            method: 'POST',
            body: JSON.stringify({ subject_code }),
        });
        setActiveGame(data);
        setGameAnswers(new Array((data.questions || []).length).fill(null));
        setGameQuestionIdx(0);
        setGameStartedAt(Date.now());
    }

    async function exitQuickChallenge() {
        if (!activeGame) return;
        try {
            await apiFetch('/games/quick-challenge/exit', {
                method: 'POST',
                body: JSON.stringify({ session_id: activeGame.session_id }),
            });
        } catch (err) {
            // Best-effort: even if the server call fails, exit the UI.
            console.error('Quick challenge exit error:', err);
        } finally {
            setActiveGame(null);
            setGameAnswers([]);
            setGameQuestionIdx(0);
            setGameStartedAt(null);
        }
    }

    async function submitQuickChallenge() {
        if (!activeGame || gameSubmitting) return;
        setGameSubmitting(true);
        try {
            const tt = gameStartedAt ? Math.round((Date.now() - gameStartedAt) / 1000) : 0;
            const result = await apiFetch('/games/quick-challenge/submit', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: activeGame.session_id,
                    answers: gameAnswers,
                    time_taken_secs: tt,
                }),
            });

            setUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    xp_points: typeof result.updated_xp_points === 'number' ? result.updated_xp_points : prev.xp_points,
                    current_level: result.new_level ? result.new_level : prev.current_level,
                };
            });

            setGameResult({
                xp_earned: result.xp_earned,
                percentage: result.percentage,
                correct: result.correct,
                total: result.total_questions,
            });
            setActiveGame(null);
            setGameAnswers([]);
            setGameQuestionIdx(0);
            setGameStartedAt(null);
            await load();
        } catch (err) {
            console.error('Quick challenge submit error:', err);
            setGameResult({ error: err?.message || 'Failed to submit game' });
        } finally {
            setGameSubmitting(false);
        }
    }

    const mergedProgress = useMemo(() => {
        if (!board) return { total: 0, completed: 0, pct: 0 };
        const gameTotal = (games || []).length;
        const gameCompleted = (games || []).filter(g => g.status === 'completed').length;
        const total = (board.total_quests || 0) + gameTotal;
        const completed = (board.completed_quests || 0) + gameCompleted;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, pct };
    }, [board, games]);

    const mergedItems = useMemo(() => {
        const questItems = (board?.quests || []).map(q => ({
            ...q,
            _sortSubject: (q.subtitle || '').split('•')[0].trim().toLowerCase(),
            _sortType: q.type === 'lesson' ? 2 : q.type === 'quiz' ? 3 : 9,
        }));

        const gameItems = (games || []).map(g => ({
            id: `game-${g.subject_code}-${g.game_type}`,
            type: 'game',
            title: `${g.subject_icon || '🎮'} ${g.subject_name} • ${g.title}`,
            subtitle: `Game • ${g.status === 'completed' ? 'Played today' : 'Not played today'}`,
            xp_reward: g.xp_reward_up_to,
            status: g.status,
            subject_code: g.subject_code,
            _sortSubject: `${g.subject_name}`.trim().toLowerCase(),
            _sortType: 1,
        }));

        return [...gameItems, ...questItems]
            .sort((a, b) => (a._sortSubject || '').localeCompare(b._sortSubject || '') || (a._sortType - b._sortType));
    }, [board, games]);

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
                            <p className="text-sm text-gray-500">{mergedProgress.completed}/{mergedProgress.total} completed</p>
                        </div>
                        <ProgressBar value={mergedProgress.pct} color={mergedProgress.pct >= 70 ? 'green' : mergedProgress.pct >= 40 ? 'yellow' : 'red'} />
                        <p className="text-xs text-gray-500 mt-2">
                            App screen time: {formatMins(user?.total_screen_time_secs || 0)} • Visits: {user?.site_visits || 0}
                        </p>
                        {gameResult?.error && (
                            <p className="text-sm text-red-600 mt-3">{gameResult.error}</p>
                        )}
                        {gameResult && !gameResult.error && (
                            <p className="text-sm text-green-700 mt-3">
                                ✅ You earned ⭐ {gameResult.xp_earned} XP ({gameResult.correct}/{gameResult.total}, {gameResult.percentage}%)
                            </p>
                        )}
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h2 className="font-bold text-gray-800">🧩 Quests & Games</h2>
                                {user?.xp_points != null && (
                                    <p className="text-sm text-gray-500 whitespace-nowrap">⭐ XP: {user.xp_points}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                {(mergedItems || []).map(q => (
                                    <div key={q.id} className={`flex items-center justify-between gap-3 rounded-lg p-3 border ${q.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{q.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{q.subtitle}{typeof q.xp_reward === 'number' ? ` • ⭐ ${q.xp_reward} XP` : ''}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {q.status === 'completed' ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">Completed</span>
                                            ) : (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">Pending</span>
                                            )}
                                            {q.type === 'game' ? (
                                                <button
                                                    onClick={() => startQuickChallenge(q.subject_code)}
                                                    className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                                                >{q.status === 'completed' ? 'Replay' : 'Start'}</button>
                                            ) : (
                                                <Link
                                                    to={q.action_path}
                                                    className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                                                >{q.type === 'quiz' ? 'Play' : 'Start'}</Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(mergedItems || []).length === 0 && (
                                    <p className="text-sm text-gray-500">No quests or games available for this class.</p>
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

            {activeGame && (
                <div className="fixed inset-0 z-50 bg-gray-50">
                    <div className="max-w-3xl mx-auto px-4 py-6 h-full flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Quick Challenge</p>
                                <h2 className="text-2xl font-bold text-gray-800">{activeGame.subject_name}</h2>
                                <p className="text-xs text-gray-500 mt-1">Question {gameQuestionIdx + 1}/{(activeGame.questions || []).length}</p>
                            </div>
                            <button
                                onClick={exitQuickChallenge}
                                className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                            >Exit Game</button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {(() => {
                                const q = (activeGame.questions || [])[gameQuestionIdx];
                                if (!q) return null;
                                return (
                                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                                        <p className="font-semibold text-gray-800 mb-3">{gameQuestionIdx + 1}. {q.text}</p>
                                        <div className="space-y-2">
                                            {(q.options || []).map((opt, oi) => (
                                                <label key={oi} className="flex items-center gap-3 text-sm text-gray-800 p-3 rounded-lg border border-gray-100 bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name={`qc-${gameQuestionIdx}`}
                                                        checked={gameAnswers[gameQuestionIdx] === oi}
                                                        onChange={() => {
                                                            setGameAnswers(prev => {
                                                                const next = [...prev];
                                                                next[gameQuestionIdx] = oi;
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                    <span className="flex-1">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setGameQuestionIdx(i => Math.max(0, i - 1))}
                                disabled={gameQuestionIdx === 0}
                                className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap ${gameQuestionIdx === 0 ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                            >Back</button>

                            {gameQuestionIdx < (activeGame.questions || []).length - 1 ? (
                                <button
                                    onClick={() => setGameQuestionIdx(i => i + 1)}
                                    disabled={gameAnswers[gameQuestionIdx] === null || gameAnswers[gameQuestionIdx] === undefined}
                                    className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap ${gameAnswers[gameQuestionIdx] === null || gameAnswers[gameQuestionIdx] === undefined ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >Next</button>
                            ) : (
                                <button
                                    onClick={submitQuickChallenge}
                                    disabled={gameSubmitting || gameAnswers.some(a => a === null || a === undefined)}
                                    className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap ${gameSubmitting || gameAnswers.some(a => a === null || a === undefined) ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >{gameSubmitting ? 'Submitting...' : 'Submit & Earn XP'}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
