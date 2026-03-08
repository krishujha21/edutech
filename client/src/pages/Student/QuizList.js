import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { dbGetAll } from '../../db/indexedDB';
import { Card, LoadingSpinner, EmptyState } from '../../components/common/UI';

export default function QuizList() {
    const { user } = useAuth();
    const { isOnline } = useOffline();
    const { t } = useLanguage();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuizzes();
    }, [isOnline]);

    async function loadQuizzes() {
        try {
            if (isOnline) {
                const data = await apiFetch(`/quizzes?grade=${user?.class_grade || 7}`);
                setQuizzes(data.quizzes);
            } else {
                const cached = await dbGetAll('quizzes');
                setQuizzes(cached.filter(q => !user?.class_grade || q.class_grade === user.class_grade));
            }
        } catch (err) {
            const cached = await dbGetAll('quizzes');
            setQuizzes(cached);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading quizzes..." />;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">✏️ {t('quizzes')}</h1>
            <p className="text-gray-500 text-sm mb-6">
                Test your knowledge • {quizzes.length} quizzes available
                {!isOnline && <span className="text-yellow-600 ml-2">📴 Offline Mode</span>}
            </p>

            {quizzes.length === 0 ? (
                <EmptyState icon="✏️" title="No quizzes available" message="Check back later or sync to get new quizzes." />
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {quizzes.map(quiz => {
                        const questions = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
                        return (
                            <Link key={quiz.id} to={`/student/quizzes/${quiz.id}`}>
                                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                            ✏️
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                {quiz.subject_name}
                                            </span>
                                            <h3 className="font-semibold text-gray-800 mt-1 text-sm">{quiz.title}</h3>

                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>❓ {questions?.length || 0} questions</span>
                                                <span>🏆 {quiz.total_marks} marks</span>
                                                <span>⏱ {quiz.time_limit_mins} min</span>
                                                <span>⭐ +{quiz.xp_reward} XP</span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded ${quiz.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                                                        quiz.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                    }`}>{quiz.difficulty}</span>
                                                <span className="text-xs text-gray-400">{quiz.quiz_type}</span>
                                            </div>
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
