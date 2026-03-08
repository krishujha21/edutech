import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { Card, StatCard, LoadingSpinner, ProgressBar } from '../../components/common/UI';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [dashboard, setDashboard] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Announcement form
    const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal' });
    const [annMsg, setAnnMsg] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'students') loadStudents();
    }, [activeTab, selectedGrade]);

    async function loadDashboard() {
        try {
            const data = await apiFetch('/teacher/dashboard');
            setDashboard(data);
        } catch (err) {
            console.error('Teacher dashboard error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadStudents() {
        try {
            const params = selectedGrade ? `?grade=${selectedGrade}` : '';
            const data = await apiFetch(`/teacher/students${params}`);
            setStudents(data.students || []);
        } catch (err) {
            console.error('Students load error:', err);
        }
    }

    async function postAnnouncement(e) {
        e.preventDefault();
        try {
            await apiFetch('/teacher/announcement', {
                method: 'POST',
                body: JSON.stringify(annForm)
            });
            setAnnMsg('✅ Announcement posted!');
            setAnnForm({ title: '', content: '', priority: 'normal' });
            setTimeout(() => setAnnMsg(''), 3000);
        } catch (err) {
            setAnnMsg('❌ Failed to post announcement');
        }
    }

    if (loading) return <LoadingSpinner text="Loading teacher dashboard..." />;

    const tabs = [
        { id: 'overview', label: '📊 Overview', icon: '📊' },
        { id: 'students', label: '👨‍🎓 Students', icon: '👨‍🎓' },
        { id: 'announce', label: '📢 Announce', icon: '📢' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">👩‍🏫 {t('teacher_dashboard')}</h1>
                    <p className="text-gray-500 text-sm">{user?.full_name} • {dashboard?.teacher?.qualification || ''}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >{tab.label}</button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && dashboard && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard icon="👨‍🎓" label="Total Students" value={dashboard.stats.total_students} color="blue" />
                        <StatCard icon="📊" label="Avg Quiz Score" value={`${dashboard.stats.avg_quiz_score}%`} color="green" />
                        <StatCard icon="⚠️" label="At Risk" value={dashboard.stats.at_risk_count} color="red" />
                        <StatCard icon="📖" label="Lessons This Week" value={dashboard.stats.weekly_lessons_completed} color="yellow" />
                    </div>

                    {/* Subject Performance */}
                    <Card className="mb-6">
                        <h2 className="font-bold text-gray-800 mb-4">📚 Subject Performance</h2>
                        <div className="space-y-3">
                            {dashboard.subject_performance?.map(sub => (
                                <div key={sub.code} className="flex items-center gap-3">
                                    <span className="text-xl w-8">{sub.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{sub.name}</span>
                                            <span className="text-gray-500">{parseFloat(sub.avg_score).toFixed(0)}% avg ({sub.attempts} attempts)</span>
                                        </div>
                                        <ProgressBar value={parseFloat(sub.avg_score)} color={
                                            parseFloat(sub.avg_score) > 70 ? 'green' : parseFloat(sub.avg_score) > 40 ? 'yellow' : 'red'
                                        } />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Class Performance */}
                    <Card className="mb-6">
                        <h2 className="font-bold text-gray-800 mb-4">📈 Class-wise Progress</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {dashboard.class_performance?.map(cp => (
                                <div key={cp.class_grade} className="bg-gray-50 rounded-lg p-3">
                                    <p className="font-bold text-gray-800">Class {cp.class_grade}</p>
                                    <p className="text-sm text-gray-500">{cp.students} students</p>
                                    <p className="text-sm text-indigo-600">⭐ {Math.round(cp.avg_xp)} avg XP</p>
                                    <p className="text-sm text-green-600">📖 {cp.lessons_completed} lessons done</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* At-Risk Students */}
                    {dashboard.at_risk_students?.length > 0 && (
                        <Card>
                            <h2 className="font-bold text-red-600 mb-4">⚠️ Students At Risk</h2>
                            <div className="space-y-2">
                                {dashboard.at_risk_students.map(s => (
                                    <div key={s.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{s.full_name}</p>
                                            <p className="text-xs text-gray-500">Class {s.class_grade}{s.section} • XP: {s.xp_points}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-red-600">Streak: {s.streak_days} days</p>
                                            <p className="text-xs text-gray-400">{s.phone}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <>
                    <div className="flex gap-2 mb-4">
                        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm">
                            <option value="">All Classes</option>
                            {[5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="p-3 font-medium text-gray-600">Student</th>
                                    <th className="p-3 font-medium text-gray-600">Class</th>
                                    <th className="p-3 font-medium text-gray-600">XP</th>
                                    <th className="p-3 font-medium text-gray-600">Lessons</th>
                                    <th className="p-3 font-medium text-gray-600">Avg Score</th>
                                    <th className="p-3 font-medium text-gray-600">Streak</th>
                                    <th className="p-3 font-medium text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{s.full_name}</td>
                                        <td className="p-3">{s.class_grade}{s.section}</td>
                                        <td className="p-3">⭐ {s.xp_points}</td>
                                        <td className="p-3">📖 {s.lessons_completed}</td>
                                        <td className="p-3">{parseFloat(s.avg_score).toFixed(0)}%</td>
                                        <td className="p-3">🔥 {s.streak_days}</td>
                                        <td className="p-3">
                                            {s.is_at_risk ? (
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">At Risk</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Announce Tab */}
            {activeTab === 'announce' && (
                <Card>
                    <h2 className="font-bold text-gray-800 mb-4">📢 Post Announcement</h2>
                    {annMsg && <p className="text-sm mb-3">{annMsg}</p>}
                    <form onSubmit={postAnnouncement} className="space-y-3">
                        <input
                            value={annForm.title}
                            onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                            placeholder="Announcement title"
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                        <textarea
                            value={annForm.content}
                            onChange={e => setAnnForm({ ...annForm, content: e.target.value })}
                            placeholder="Announcement content..."
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={4}
                            required
                        />
                        <select
                            value={annForm.priority}
                            onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value="low">Low Priority</option>
                            <option value="normal">Normal</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                            📢 Post Announcement
                        </button>
                    </form>
                </Card>
            )}
        </div>
    );
}
