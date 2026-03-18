import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        full_name: '', username: '', password: '', role: 'student',
        class_grade: '7', preferred_lang: 'en', school_id: '1',
        phone: '', gender: 'male', parent_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await register({
                ...form,
                class_grade: parseInt(form.class_grade),
                school_id: parseInt(form.school_id)
            });
            navigate(user.role === 'student' ? '/student' : '/teacher');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-6">
                        <span className="text-5xl">📝</span>
                        <h1 className="text-2xl font-bold text-gray-800 mt-2">{t('register')}</h1>
                        <p className="text-gray-500 text-sm mt-1">Join VidhyaSetu for free</p>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input name="full_name" value={form.full_name} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input name="username" value={form.username} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required minLength={4} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                                <select name="role" value={form.role} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select name="class_grade" value={form.class_grade} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    {[5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select name="preferred_lang" value={form.preferred_lang} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="ta">தமிழ்</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={form.phone} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 mt-4">
                            {loading ? 'Creating account...' : '🚀 Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account? <Link to="/login" className="text-indigo-600 font-medium">{t('login')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
