import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CARD_COLOR = 'from-indigo-500 to-blue-600';

const DEMO_ACCOUNTS = [
    { username: 'sharanya', label: 'Sharanya', role: 'student', emoji: '👩‍🎓' },
    { username: 'gayatri', label: 'Gayatri', role: 'student', emoji: '👩‍🎓' },
    { username: 'mahi', label: 'Mahi', role: 'student', emoji: '👩‍🎓' },
    { username: 'oishani', label: 'Oishani', role: 'student', emoji: '👩‍🎓' },
    { username: 'sonali', label: 'Sonali', role: 'teacher', emoji: '👩‍🏫' },
    { username: 'krishu_admin', label: 'Krishu (Admin)', role: 'admin', emoji: '🛡️' },
];

const PASSWORD = '12345';

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

    const handleQuickLogin = async (account) => {
        setError('');
        setLoading(account.username);
        try {
            const user = await login(account.username, PASSWORD);
            if (user.role === 'student') navigate('/student');
            else if (user.role === 'teacher' || user.role === 'school_admin') navigate('/teacher');
            else navigate('/admin');
        } catch (err) {
            console.error('Login error:', err);
            setError(`Login failed for ${account.label}: ${err.message}`);
        } finally {
            setLoading('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-3">📚</div>
                    <h1 className="text-3xl font-extrabold text-gray-900">VidhyaSetu</h1>
                    <p className="text-gray-500 mt-1 text-sm">Offline-First Rural Learning System</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-5 text-center">
                        {error}
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <p className="text-center text-gray-600 font-medium mb-5">Select your profile to continue</p>

                    {/* Students Section */}
                    <div className="mb-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">👩‍🎓 Students</p>
                        <div className="grid grid-cols-2 gap-3">
                            {DEMO_ACCOUNTS.filter(a => a.role === 'student').map(acc => (
                                <button
                                    key={acc.username}
                                    onClick={() => handleQuickLogin(acc)}
                                    disabled={!!loading}
                                    className={`relative overflow-hidden rounded-xl p-4 text-white font-semibold text-left transition-all duration-200 bg-gradient-to-r ${CARD_COLOR} hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none`}
                                >
                                    <div className="text-2xl mb-1">{acc.emoji}</div>
                                    <div className="text-base">{acc.label}</div>
                                    <div className="text-xs opacity-75">Class {acc.username === 'mahi' || acc.username === 'oishani' ? '7' : '8'}</div>
                                    {loading === acc.username && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Teacher & Admin Section */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">🏫 Teacher & Admin</p>
                        <div className="grid grid-cols-2 gap-3">
                            {DEMO_ACCOUNTS.filter(a => a.role !== 'student').map(acc => (
                                <button
                                    key={acc.username}
                                    onClick={() => handleQuickLogin(acc)}
                                    disabled={!!loading}
                                    className={`relative overflow-hidden rounded-xl p-4 text-white font-semibold text-left transition-all duration-200 bg-gradient-to-r ${CARD_COLOR} hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none`}
                                >
                                    <div className="text-2xl mb-1">{acc.emoji}</div>
                                    <div className="text-base">{acc.label}</div>
                                    <div className="text-xs opacity-75">{acc.role === 'teacher' ? 'Teacher' : 'Govt Admin'}</div>
                                    {loading === acc.username && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Demo Mode • Password for all accounts: <span className="font-mono font-bold text-gray-500">12345</span>
                </p>
            </div>
        </div>
    );
}
