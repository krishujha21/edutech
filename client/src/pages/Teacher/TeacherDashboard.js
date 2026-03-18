import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { Card, StatCard, LoadingSpinner, ProgressBar } from '../../components/common/UI';

function formatDuration(secs) {
    const s = Math.max(0, Math.floor(secs || 0));
    const mins = Math.floor(s / 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [dashboard, setDashboard] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Student details
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [studentDetailLoading, setStudentDetailLoading] = useState(false);

    // Homework
    const [subjects, setSubjects] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [homeworkList, setHomeworkList] = useState([]);
    const [hwLoading, setHwLoading] = useState(false);
    const [hwMsg, setHwMsg] = useState('');
    const [hwForm, setHwForm] = useState({
        class_grade: '',
        section: '',
        subject_id: '',
        title: '',
        description: '',
        quiz_id: '',
        due_date: '',
    });

    // Announcement form
    const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal' });
    const [annMsg, setAnnMsg] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'students') loadStudents();
        if (activeTab === 'homework') initHomeworkTab();
    }, [activeTab, selectedGrade, selectedSection]);

    useEffect(() => {
        if (selectedStudentId) loadStudentDetail(selectedStudentId);
    }, [selectedStudentId]);

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
            const params = new URLSearchParams();
            if (selectedGrade) params.set('grade', selectedGrade);
            if (selectedSection) params.set('section', selectedSection);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const data = await apiFetch(`/teacher/students${qs}`);
            setStudents(data.students || []);
        } catch (err) {
            console.error('Students load error:', err);
        }
    }

    async function loadStudentDetail(id) {
        setStudentDetailLoading(true);
        try {
            const data = await apiFetch(`/teacher/students/${id}`);
            setStudentDetail(data);
        } catch (err) {
            console.error('Student detail error:', err);
            setStudentDetail(null);
        } finally {
            setStudentDetailLoading(false);
        }
    }

    async function initHomeworkTab() {
        try {
            const subData = await apiFetch('/lessons/subjects');
            setSubjects(subData.subjects || []);
        } catch (err) {
            console.error('Subjects load error:', err);
        }
        await loadHomework();
    }

    async function loadHomework() {
        setHwLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedGrade) params.set('class_grade', selectedGrade);
            if (selectedSection) params.set('section', selectedSection);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const data = await apiFetch(`/teacher/homework${qs}`);
            setHomeworkList(data.homework || []);
        } catch (err) {
            console.error('Homework load error:', err);
        } finally {
            setHwLoading(false);
        }
    }

    async function loadQuizzesForForm() {
        try {
            if (!hwForm.class_grade) {
                setQuizzes([]);
                return;
            }
            const data = await apiFetch(`/quizzes?grade=${encodeURIComponent(hwForm.class_grade)}`);
            setQuizzes(data.quizzes || []);
        } catch (err) {
            console.error('Quiz list load error:', err);
        }
    }

    async function assignHomework(e) {
        e.preventDefault();
        setHwMsg('');
        try {
            await apiFetch('/teacher/homework', {
                method: 'POST',
                body: JSON.stringify({
                    ...hwForm,
                    class_grade: hwForm.class_grade ? parseInt(hwForm.class_grade) : null,
                    subject_id: hwForm.subject_id ? parseInt(hwForm.subject_id) : null,
                    quiz_id: hwForm.quiz_id ? parseInt(hwForm.quiz_id) : null,
                })
            });
            setHwMsg('✅ Homework assigned!');
            setHwForm({ class_grade: '', section: '', subject_id: '', title: '', description: '', quiz_id: '', due_date: '' });
            setQuizzes([]);
            await loadHomework();
            setTimeout(() => setHwMsg(''), 3000);
        } catch (err) {
            setHwMsg('❌ Failed to assign homework');
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
        { id: 'homework', label: '📝 Homework', icon: '📝' },
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

                    {/* Gamified Study */}
                    {dashboard.gamified_study?.by_class?.length > 0 && (
                        <Card className="mb-6">
                            <h2 className="font-bold text-gray-800 mb-4">🎮 Gamified Study (By Class)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="p-3 font-medium text-gray-600">Class</th>
                                            <th className="p-3 font-medium text-gray-600">Students</th>
                                            <th className="p-3 font-medium text-gray-600">Lessons</th>
                                            <th className="p-3 font-medium text-gray-600">Quizzes</th>
                                            <th className="p-3 font-medium text-gray-600">Lesson Completions</th>
                                            <th className="p-3 font-medium text-gray-600">Quiz Attempts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboard.gamified_study.by_class.map((c) => (
                                            <tr key={c.class_grade} className="border-t hover:bg-gray-50">
                                                <td className="p-3 font-medium">Class {c.class_grade}</td>
                                                <td className="p-3">{c.students}</td>
                                                <td className="p-3">{c.total_lessons}</td>
                                                <td className="p-3">{c.total_quizzes}</td>
                                                <td className="p-3">{c.lessons_completed}</td>
                                                <td className="p-3">{c.quiz_attempts}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

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
                    <div className="flex gap-2 mb-4 flex-wrap">
                        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm">
                            <option value="">All Classes</option>
                            {[5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                        </select>

                        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm">
                            <option value="">All Sections</option>
                            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>

                        {selectedStudentId && (
                            <button
                                onClick={() => { setSelectedStudentId(null); setStudentDetail(null); }}
                                className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >Clear Selection</button>
                        )}
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
                                    <th className="p-3 font-medium text-gray-600">App Screen Time</th>
                                    <th className="p-3 font-medium text-gray-600">Visits</th>
                                    <th className="p-3 font-medium text-gray-600">Status</th>
                                    <th className="p-3 font-medium text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id} className={`border-t hover:bg-gray-50 ${selectedStudentId === s.id ? 'bg-indigo-50' : ''}`}>
                                        <td className="p-3 font-medium">{s.full_name}</td>
                                        <td className="p-3">{s.class_grade}{s.section}</td>
                                        <td className="p-3">⭐ {s.xp_points}</td>
                                        <td className="p-3">📖 {s.lessons_completed}</td>
                                        <td className="p-3">{parseFloat(s.avg_score).toFixed(0)}%</td>
                                        <td className="p-3">🔥 {s.streak_days}</td>
                                        <td className="p-3">{formatDuration(s.app_screen_time_secs || 0)}</td>
                                        <td className="p-3">{s.site_visits || 0}</td>
                                        <td className="p-3">
                                            {s.is_at_risk ? (
                                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">At Risk</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Active</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => setSelectedStudentId(s.id)}
                                                className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Student Detail Panel */}
                    {selectedStudentId && (
                        <Card className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-800">🧾 Student Details</h3>
                                <span className="text-xs text-gray-500">ID: {selectedStudentId}</span>
                            </div>
                            {studentDetailLoading ? (
                                <LoadingSpinner text="Loading student details..." />
                            ) : studentDetail ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <StatCard icon="⭐" label="XP" value={studentDetail.student.xp_points} color="purple" />
                                        <StatCard icon="📖" label="Lessons" value={studentDetail.stats.lessons_completed} color="green" />
                                        <StatCard icon="✏️" label="Quiz Attempts" value={studentDetail.stats.quiz_attempts} color="blue" />
                                        <StatCard icon="📊" label="Avg Score" value={`${parseFloat(studentDetail.stats.avg_score).toFixed(1)}%`} color="indigo" />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="font-medium text-gray-800">{studentDetail.student.full_name}</p>
                                            <p className="text-xs text-gray-500">Class {studentDetail.student.class_grade}{studentDetail.student.section} • Streak {studentDetail.student.streak_days} days</p>
                                            <p className="text-xs text-gray-500">Last login: {studentDetail.student.last_login ? new Date(studentDetail.student.last_login).toLocaleString() : '—'}</p>
                                            <p className="text-xs text-gray-500">Screen time: {Math.round((studentDetail.stats.screen_time_secs || 0) / 60)} mins</p>
                                            <p className="text-xs text-gray-500">App screen time: {formatDuration(studentDetail.stats.app_screen_time_secs || 0)}</p>
                                            <p className="text-xs text-gray-500">Site visits: {studentDetail.stats.site_visits || 0}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="font-medium text-gray-800 mb-2">Recent Quiz Attempts</p>
                                            <div className="space-y-2">
                                                {(studentDetail.attempts || []).slice(0, 5).map(a => (
                                                    <div key={a.id} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-800">{a.quiz_title || 'Quiz'}</p>
                                                            <p className="text-xs text-gray-500">{a.subject_name || ''} • {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-indigo-700">{parseFloat(a.percentage).toFixed(0)}%</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(studentDetail.attempts || []).length === 0 && <p className="text-xs text-gray-500">No quiz attempts yet.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">Unable to load student details.</p>
                            )}
                        </Card>
                    )}
                </>
            )}

            {/* Homework Tab */}
            {activeTab === 'homework' && (
                <div className="space-y-6">
                    <Card>
                        <h2 className="font-bold text-gray-800 mb-4">📝 Assign Homework</h2>
                        {hwMsg && <p className="text-sm mb-3">{hwMsg}</p>}
                        <form onSubmit={assignHomework} className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <select
                                    value={hwForm.class_grade}
                                    onChange={async (e) => {
                                        const v = e.target.value;
                                        setHwForm(prev => ({ ...prev, class_grade: v, quiz_id: '' }));
                                        setTimeout(loadQuizzesForForm, 0);
                                    }}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Class</option>
                                    {[5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                                </select>

                                <select
                                    value={hwForm.section}
                                    onChange={e => setHwForm(prev => ({ ...prev, section: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">All Sections</option>
                                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>

                                <select
                                    value={hwForm.subject_id}
                                    onChange={e => setHwForm(prev => ({ ...prev, subject_id: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                                </select>

                                <input
                                    type="date"
                                    value={hwForm.due_date}
                                    onChange={e => setHwForm(prev => ({ ...prev, due_date: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <input
                                value={hwForm.title}
                                onChange={e => setHwForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Homework title"
                                className="w-full px-3 py-2 border rounded-lg"
                                required
                            />

                            <textarea
                                value={hwForm.description}
                                onChange={e => setHwForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Instructions / description..."
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                            />

                            <div className="grid md:grid-cols-2 gap-3">
                                <select
                                    value={hwForm.quiz_id}
                                    onChange={e => setHwForm(prev => ({ ...prev, quiz_id: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">(Optional) Link a quiz</option>
                                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                                </select>

                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                                    ✅ Assign Homework
                                </button>
                            </div>
                        </form>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800">📚 Assigned Homework</h2>
                            <button
                                onClick={loadHomework}
                                className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >Refresh</button>
                        </div>
                        {hwLoading ? (
                            <LoadingSpinner text="Loading homework..." />
                        ) : homeworkList.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No homework assigned yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {homeworkList.slice(0, 20).map(h => (
                                    <div key={h.id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">{h.title}</p>
                                                <p className="text-xs text-gray-500">Class {h.class_grade}{h.section ? h.section : ''} • {h.subject_name || 'Subject'}{h.quiz_title ? ` • Quiz: ${h.quiz_title}` : ''}</p>
                                                {h.due_date && <p className="text-xs text-gray-500">Due: {new Date(h.due_date).toLocaleDateString()}</p>}
                                            </div>
                                            <span className="text-xs text-gray-400">#{h.id}</span>
                                        </div>
                                        {h.description && <p className="text-sm text-gray-600 mt-2">{h.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
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

                        <select
                            value={annForm.target_grade || ''}
                            onChange={e => setAnnForm({ ...annForm, target_grade: e.target.value ? parseInt(e.target.value) : null })}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value="">All Classes</option>
                            {[5, 6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Class {g}</option>)}
                        </select>

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
