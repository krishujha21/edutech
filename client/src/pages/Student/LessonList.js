import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { getOfflineLessons, saveLessonsOffline, dbGetAll, dbGet } from '../../db/indexedDB';
import { Card, LoadingSpinner, EmptyState, ProgressBar } from '../../components/common/UI';

export default function LessonList() {
    const { user } = useAuth();
    const { isOnline } = useOffline();
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const [lessons, setLessons] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [progress, setProgress] = useState({});
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLessons();
    }, [selectedSubject, isOnline]);

    async function loadLessons() {
        setLoading(true);
        try {
            if (isOnline) {
                const params = new URLSearchParams({ grade: user?.class_grade || 7 });
                if (selectedSubject) params.append('subject', selectedSubject);

                const [lessonData, subjectData, progressData] = await Promise.all([
                    apiFetch(`/lessons?${params}`),
                    apiFetch('/lessons/subjects'),
                    apiFetch('/progress').catch(() => ({ progress: [] }))
                ]);

                setLessons(lessonData.lessons);
                setSubjects(subjectData.subjects);

                // Save for offline
                await saveLessonsOffline(lessonData.lessons);

                // Build progress map
                const pMap = {};
                (progressData.progress || []).forEach(p => { pMap[p.lesson_id] = p; });
                setProgress(pMap);
            } else {
                // Load from IndexedDB
                const offlineLessons = await getOfflineLessons(user?.class_grade);
                const filtered = selectedSubject
                    ? offlineLessons.filter(l => l.subject_code === selectedSubject)
                    : offlineLessons;
                setLessons(filtered);

                const offlineSubjects = await dbGetAll('subjects');
                setSubjects(offlineSubjects);

                const offlineProgress = await dbGetAll('progress');
                const pMap = {};
                offlineProgress.forEach(p => { pMap[p.lesson_id] = p; });
                setProgress(pMap);
            }
        } catch (err) {
            console.error('Failed to load lessons:', err);
            const offlineLessons = await getOfflineLessons(user?.class_grade);
            setLessons(offlineLessons);
        } finally {
            setLoading(false);
        }
    }

    const subjectColors = {
        MATH: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        SCI: 'bg-green-100 text-green-700 border-green-200',
        ENG: 'bg-red-100 text-red-700 border-red-200',
        SST: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        HIN: 'bg-purple-100 text-purple-700 border-purple-200',
    };

    if (loading) return <LoadingSpinner text="Loading lessons..." />;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">📖 {t('lessons')}</h1>
            <p className="text-gray-500 text-sm mb-4">
                Class {user?.class_grade} • {lessons.length} lessons available
                {!isOnline && <span className="text-yellow-600 ml-2">📴 Offline Mode</span>}
            </p>

            {/* Subject Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSelectedSubject('')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${!selectedSubject ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                        }`}
                >All Subjects</button>
                {subjects.map(s => (
                    <button
                        key={s.code}
                        onClick={() => setSelectedSubject(s.code)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedSubject === s.code ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                            }`}
                    >{s.icon} {s.name}</button>
                ))}
            </div>

            {/* Lessons Grid */}
            {lessons.length === 0 ? (
                <EmptyState icon="📭" title="No lessons found" message="Try changing the subject filter or check back later." />
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {lessons.map(lesson => {
                        const prog = progress[lesson.id];
                        const statusIcon = prog?.status === 'completed' ? '✅' : prog?.status === 'in_progress' ? '📝' : '📄';
                        return (
                            <Link key={lesson.id} to={`/student/lessons/${lesson.id}`}>
                                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${subjectColors[lesson.subject_code]?.split(' ')[0] || 'bg-gray-100'
                                            }`}>
                                            {lesson.subject_icon || '📖'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${subjectColors[lesson.subject_code] || 'bg-gray-100'}`}>
                                                    {lesson.subject_name}
                                                </span>
                                                <span className="text-xs text-gray-400">Ch {lesson.chapter_number}.{lesson.lesson_number}</span>
                                            </div>
                                            <h3 className="font-semibold text-gray-800 mt-1 text-sm truncate">{statusIcon} {lesson.title}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{lesson.description}</p>

                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>⏱ {lesson.duration_mins} min</span>
                                                <span>⭐ {lesson.xp_reward} XP</span>
                                                <span className={`px-1.5 py-0.5 rounded ${lesson.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                                                        lesson.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                    }`}>{lesson.difficulty}</span>
                                            </div>

                                            {prog && (
                                                <div className="mt-2">
                                                    <ProgressBar value={prog.progress_pct} color={prog.status === 'completed' ? 'green' : 'indigo'} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
