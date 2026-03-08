import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOffline } from '../../context/OfflineContext';
import { apiFetch } from '../../config/api';
import { dbGet, updateProgressOffline } from '../../db/indexedDB';
import { LoadingSpinner, Card, ProgressBar } from '../../components/common/UI';

export default function LessonView() {
    const { id } = useParams();
    const { isOnline } = useOffline();
    const [lesson, setLesson] = useState(null);
    const [progress, setProgress] = useState(0);
    const [startTime] = useState(Date.now());
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLesson();
        return () => saveProgress();
    }, [id]);

    async function loadLesson() {
        try {
            if (isOnline) {
                const data = await apiFetch(`/lessons/${id}`);
                setLesson(data.lesson);
            } else {
                const cached = await dbGet('lessons', parseInt(id));
                setLesson(cached);
            }

            // Load existing progress
            const prog = await dbGet('progress', parseInt(id));
            if (prog) setProgress(prog.progress_pct || 0);
        } catch (err) {
            const cached = await dbGet('lessons', parseInt(id));
            setLesson(cached);
        } finally {
            setLoading(false);
        }
    }

    async function saveProgress() {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        try {
            await updateProgressOffline(parseInt(id), {
                status: completed ? 'completed' : 'in_progress',
                progress_pct: progress,
                time_spent_secs: timeSpent
            });

            if (isOnline) {
                await apiFetch('/progress', {
                    method: 'POST',
                    body: JSON.stringify({
                        lesson_id: parseInt(id),
                        status: completed ? 'completed' : 'in_progress',
                        progress_pct: progress,
                        time_spent_secs: timeSpent
                    })
                }).catch(() => { }); // Fail silently, will sync later
            }
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    }

    const handleComplete = async () => {
        setProgress(100);
        setCompleted(true);
        await updateProgressOffline(parseInt(id), {
            status: 'completed',
            progress_pct: 100,
            time_spent_secs: Math.round((Date.now() - startTime) / 1000),
            completed_at: new Date().toISOString()
        });

        if (isOnline) {
            apiFetch('/progress', {
                method: 'POST',
                body: JSON.stringify({
                    lesson_id: parseInt(id),
                    status: 'completed',
                    progress_pct: 100,
                    time_spent_secs: Math.round((Date.now() - startTime) / 1000)
                })
            }).catch(() => { });
        }
    };

    // Handle scroll to track reading progress
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            if (height > 0) {
                const pct = Math.min(95, Math.round((scrolled / height) * 100));
                setProgress(prev => Math.max(prev, pct));
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) return <LoadingSpinner text="Loading lesson..." />;
    if (!lesson) return <div className="text-center py-12 text-gray-500">Lesson not found</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Progress bar at top */}
            <div className="sticky top-14 z-40 bg-white py-2 -mx-4 px-4 border-b">
                <div className="flex items-center gap-3">
                    <Link to="/student/lessons" className="text-gray-400 hover:text-gray-600">← Back</Link>
                    <div className="flex-1">
                        <ProgressBar value={progress} color={completed ? 'green' : 'indigo'} />
                    </div>
                    <span className="text-xs text-gray-500">{progress}%</span>
                </div>
            </div>

            {/* Lesson Header */}
            <div className="mt-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {lesson.subject_name}
                    </span>
                    <span className="text-xs text-gray-400">Chapter {lesson.chapter_number} • Lesson {lesson.lesson_number}</span>
                    {!isOnline && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">📴 Offline</span>}
                </div>
                <h1 className="text-2xl font-bold text-gray-800">{lesson.title}</h1>
                <p className="text-gray-500 text-sm mt-1">{lesson.description}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>⏱ {lesson.duration_mins} min</span>
                    <span>⭐ {lesson.xp_reward} XP reward</span>
                    <span className={`px-1.5 py-0.5 rounded ${lesson.difficulty === 'easy' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>{lesson.difficulty}</span>
                </div>
            </div>

            {/* Audio Button */}
            {lesson.audio_url && (
                <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg mb-4 hover:bg-indigo-100 w-full justify-center">
                    🔊 Listen to Audio Explanation
                </button>
            )}

            {/* Lesson Content */}
            <Card className="mb-6">
                <div
                    className="prose prose-sm max-w-none lesson-content"
                    dangerouslySetInnerHTML={{ __html: lesson.content_html || '<p>Lesson content loading...</p>' }}
                />
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                {!completed ? (
                    <button
                        onClick={handleComplete}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                        ✅ Mark as Complete (+{lesson.xp_reward} XP)
                    </button>
                ) : (
                    <div className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl font-bold text-center">
                        ✅ Lesson Completed!
                    </div>
                )}
            </div>

            {/* Navigation to quiz if available */}
            <div className="mt-4 text-center">
                <Link to="/student/quizzes" className="text-indigo-600 text-sm font-medium hover:underline">
                    Take a quiz on this topic →
                </Link>
            </div>
        </div>
    );
}
