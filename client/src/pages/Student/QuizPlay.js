import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOffline } from '../../context/OfflineContext';
import { apiFetch } from '../../config/api';
import { dbGet, saveQuizAttemptOffline, generateUUID } from '../../db/indexedDB';
import { LoadingSpinner, Card, ProgressBar } from '../../components/common/UI';

export default function QuizPlay() {
    const { id } = useParams();
    const { isOnline } = useOffline();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [started, setStarted] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuiz();
    }, [id]);

    // Timer
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [started, submitted, timeLeft]);

    async function loadQuiz() {
        try {
            let quizData;
            if (isOnline) {
                const data = await apiFetch(`/quizzes/${id}`);
                quizData = data.quiz;
            } else {
                quizData = await dbGet('quizzes', parseInt(id));
            }

            if (quizData) {
                setQuiz(quizData);
                const q = typeof quizData.questions === 'string' ? JSON.parse(quizData.questions) : quizData.questions;
                setQuestions(q || []);
                setTimeLeft((quizData.time_limit_mins || 10) * 60);
            }
        } catch (err) {
            const cached = await dbGet('quizzes', parseInt(id));
            if (cached) {
                setQuiz(cached);
                const q = typeof cached.questions === 'string' ? JSON.parse(cached.questions) : cached.questions;
                setQuestions(q || []);
                setTimeLeft((cached.time_limit_mins || 10) * 60);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleAnswer = (questionIndex, answer) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleSubmit = useCallback(async () => {
        if (submitted) return;
        setSubmitted(true);

        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        const answerArray = questions.map((_, i) => answers[i] ?? null);

        // Grade locally
        let score = 0;
        const results = questions.map((q, i) => {
            const userAnswer = answerArray[i];
            const isCorrect = q.type === 'true_false'
                ? userAnswer === q.correct
                : userAnswer === q.correct;
            if (isCorrect) score += q.marks;
            return { questionId: q.id, correct: isCorrect, userAnswer, correctAnswer: q.correct, explanation: q.explanation };
        });

        const percentage = (score / quiz.total_marks) * 100;
        const passed = percentage >= (quiz.passing_score || 40);

        const attemptData = {
            uuid: generateUUID(),
            quiz_id: parseInt(id),
            answers: answerArray,
            score,
            total_marks: quiz.total_marks,
            percentage: percentage.toFixed(2),
            time_taken_secs: timeTaken,
            started_at: new Date(startTime).toISOString(),
            completed_at: new Date().toISOString()
        };

        // Save offline
        await saveQuizAttemptOffline(attemptData);

        // Try to submit online
        if (isOnline) {
            try {
                const serverResult = await apiFetch(`/quizzes/${id}/submit`, {
                    method: 'POST',
                    body: JSON.stringify(attemptData)
                });
                setResult({ ...serverResult, results, passed });
            } catch {
                setResult({ score, total_marks: quiz.total_marks, percentage, passed, results, xp_earned: passed ? quiz.xp_reward : 0 });
            }
        } else {
            setResult({ score, total_marks: quiz.total_marks, percentage, passed, results, xp_earned: passed ? quiz.xp_reward : 0 });
        }
    }, [submitted, answers, questions, quiz, id, startTime, isOnline]);

    if (loading) return <LoadingSpinner text="Loading quiz..." />;
    if (!quiz) return <div className="text-center py-12 text-gray-500">Quiz not found</div>;

    const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

    // Start Screen
    if (!started) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                <div className="text-6xl mb-4">✏️</div>
                <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
                <p className="text-gray-500 mt-2">{quiz.subject_name} • {quiz.quiz_type} quiz</p>

                <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm mx-auto">
                    <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-indigo-700">{questions.length}</p>
                        <p className="text-xs text-gray-500">Questions</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-green-700">{quiz.total_marks}</p>
                        <p className="text-xs text-gray-500">Marks</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-yellow-700">{quiz.time_limit_mins}m</p>
                        <p className="text-xs text-gray-500">Time</p>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mt-4">Pass mark: {quiz.passing_score}% • XP reward: ⭐{quiz.xp_reward}</p>

                <button
                    onClick={() => { setStarted(true); setStartTime(Date.now()); }}
                    className="mt-6 bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors"
                >
                    🚀 Start Quiz
                </button>
                <p className="mt-3">
                    <Link to="/student/quizzes" className="text-gray-400 text-sm hover:underline">← Back to Quizzes</Link>
                </p>
            </div>
        );
    }

    // Result Screen
    if (submitted && result) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className={`text-center p-8 rounded-2xl mb-6 ${result.passed ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                    <div className="text-6xl mb-3">{result.passed ? '🎉' : '💪'}</div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {result.passed ? 'Great Job!' : 'Keep Trying!'}
                    </h1>
                    <p className="text-4xl font-bold mt-4 text-gray-800">
                        {result.score} / {result.total_marks}
                    </p>
                    <p className="text-gray-500">({parseFloat(result.percentage).toFixed(0)}%)</p>
                    {result.xp_earned > 0 && (
                        <p className="text-yellow-600 font-bold mt-2">⭐ +{result.xp_earned} XP earned!</p>
                    )}
                    {result.new_level && (
                        <p className="text-indigo-600 font-bold mt-1">🎊 Level Up! You're now Level {result.new_level}!</p>
                    )}
                </div>

                {/* Answer Review */}
                <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Review Answers</h2>
                <div className="space-y-3">
                    {result.results?.map((r, i) => (
                        <Card key={i} className={r.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}>
                            <p className="font-medium text-gray-800 text-sm">
                                {r.correct ? '✅' : '❌'} Q{i + 1}: {questions[i]?.question}
                            </p>
                            {!r.correct && (
                                <p className="text-red-500 text-xs mt-1">
                                    Your answer: {String(r.userAnswer)} • Correct: {String(r.correctAnswer)}
                                </p>
                            )}
                            {r.explanation && <p className="text-gray-500 text-xs mt-1 italic">💡 {r.explanation}</p>}
                        </Card>
                    ))}
                </div>

                <div className="flex gap-3 mt-6">
                    <Link to="/student/quizzes" className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-center hover:bg-gray-300">
                        ← More Quizzes
                    </Link>
                    <Link to="/student" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center hover:bg-indigo-700">
                        Dashboard →
                    </Link>
                </div>
            </div>
        );
    }

    // Quiz Play Screen
    const q = questions[currentQ];

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Q {currentQ + 1}/{questions.length}</span>
                <span className={`text-sm font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                    ⏱ {formatTime(timeLeft)}
                </span>
            </div>

            <ProgressBar value={currentQ + 1} max={questions.length} color="indigo" />

            {/* Question */}
            <Card className="mt-4 mb-4">
                <p className="text-xs text-gray-400 mb-2">
                    {q.marks} marks • {q.type === 'true_false' ? 'True/False' : 'Multiple Choice'}
                </p>
                <h2 className="text-lg font-bold text-gray-800">{q.question}</h2>
            </Card>

            {/* Options */}
            <div className="space-y-2 mb-6">
                {q.type === 'true_false' ? (
                    <>
                        {[true, false].map(opt => (
                            <button
                                key={String(opt)}
                                onClick={() => handleAnswer(currentQ, opt)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQ] === opt
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-indigo-200'
                                    }`}
                            >
                                <span className="font-medium">{opt ? '✓ True' : '✗ False'}</span>
                            </button>
                        ))}
                    </>
                ) : (
                    q.options?.map((opt, oi) => (
                        <button
                            key={oi}
                            onClick={() => handleAnswer(currentQ, oi)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQ] === oi
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 hover:border-indigo-200'
                                }`}
                        >
                            <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + oi)}.</span>
                            <span className="font-medium">{opt}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                {currentQ > 0 && (
                    <button
                        onClick={() => setCurrentQ(prev => prev - 1)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300"
                    >
                        ← Previous
                    </button>
                )}
                {currentQ < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentQ(prev => prev + 1)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
                    >
                        ✅ Submit Quiz
                    </button>
                )}
            </div>

            {/* Question dots */}
            <div className="flex justify-center gap-1 mt-4">
                {questions.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentQ(i)}
                        className={`w-6 h-6 rounded-full text-xs font-bold ${i === currentQ ? 'bg-indigo-600 text-white' :
                                answers[i] !== undefined ? 'bg-green-200 text-green-700' :
                                    'bg-gray-200 text-gray-400'
                            }`}
                    >{i + 1}</button>
                ))}
            </div>
        </div>
    );
}
