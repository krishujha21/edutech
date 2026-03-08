import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { Card, StatCard, LoadingSpinner, ProgressBar } from '../../components/common/UI';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [schools, setSchools] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [curriculumForm, setCurriculumForm] = useState({
    title: '',
    subject_id: '',
    class_grade: '',
    description: '',
    file_url: ''
  });
  const [curriculumMsg, setCurriculumMsg] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'schools') loadSchools();
    if (activeTab === 'scholarships') loadScholarships();
  }, [activeTab]);

  async function loadDashboard() {
    try {
      const data = await apiFetch('/admin/dashboard');
      setDashboard(data);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSchools() {
    try {
      const data = await apiFetch('/admin/schools');
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Schools load error:', err);
    }
  }

  async function loadScholarships() {
    try {
      const data = await apiFetch('/admin/scholarships');
      setScholarships(data.scholarships || []);
    } catch (err) {
      console.error('Scholarships load error:', err);
    }
  }

  async function uploadCurriculum(e) {
    e.preventDefault();
    try {
      await apiFetch('/admin/curriculum', {
        method: 'POST',
        body: JSON.stringify(curriculumForm)
      });
      setCurriculumMsg('✅ Curriculum uploaded successfully!');
      setCurriculumForm({ title: '', subject_id: '', class_grade: '', description: '', file_url: '' });
      setTimeout(() => setCurriculumMsg(''), 3000);
    } catch (err) {
      setCurriculumMsg('❌ Failed to upload curriculum');
    }
  }

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'schools', label: '🏫 Schools' },
    { id: 'scholarships', label: '🎓 Scholarships' },
    { id: 'curriculum', label: '📚 Curriculum' },
  ];

  const overview = dashboard?.overview || {};
  const districtPerf = dashboard?.district_performance || [];
  const dropoutRisk = dashboard?.dropout_risk || [];
  const quizTrends = dashboard?.quiz_trends || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏛️ Government Admin Panel</h1>
          <p className="text-gray-500 text-sm">{user?.full_name} • District Education Portal</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
          {user?.role === 'super_admin' ? '🔑 Super Admin' : '🏛️ Govt Admin'}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <>
          {/* Top-level Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="🏫" label="Active Schools" value={overview.total_schools || 0} color="blue" />
            <StatCard icon="👨‍🎓" label="Total Students" value={overview.total_students || 0} color="green" />
            <StatCard icon="👩‍🏫" label="Total Teachers" value={overview.total_teachers || 0} color="purple" />
            <StatCard icon="📖" label="Total Lessons" value={overview.total_lessons || 0} color="yellow" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="✅" label="Quizzes Taken" value={overview.total_quiz_attempts || 0} color="green" />
            <StatCard icon="📊" label="Avg Quiz Score" value={`${parseFloat(overview.avg_quiz_score || 0).toFixed(1)}%`} color="blue" />
            <StatCard icon="🔥" label="Active This Week" value={overview.active_students_week || 0} color="red" />
            <StatCard icon="⚠️" label="Dropout Risk" value={dropoutRisk.length} color="red" />
          </div>

          {/* District Performance */}
          {districtPerf.length > 0 && (
            <Card className="mb-6">
              <h2 className="font-bold text-gray-800 mb-4">🗺️ District Performance by School</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 font-medium text-gray-600">School</th>
                      <th className="p-3 font-medium text-gray-600">District</th>
                      <th className="p-3 font-medium text-gray-600">Students</th>
                      <th className="p-3 font-medium text-gray-600">Teachers</th>
                      <th className="p-3 font-medium text-gray-600">Avg Score</th>
                      <th className="p-3 font-medium text-gray-600">Lessons Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtPerf.map((d, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{d.school_name}</td>
                        <td className="p-3 text-gray-500">{d.district || 'N/A'}</td>
                        <td className="p-3">{d.total_students}</td>
                        <td className="p-3">{d.total_teachers}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={parseFloat(d.avg_score || 0)}
                              color={parseFloat(d.avg_score) > 70 ? 'green' : parseFloat(d.avg_score) > 40 ? 'yellow' : 'red'}
                            />
                            <span className="text-xs text-gray-500 w-10">{parseFloat(d.avg_score || 0).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-3">{d.total_lessons_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Dropout Risk Students */}
          {dropoutRisk.length > 0 && (
            <Card className="mb-6">
              <h2 className="font-bold text-red-600 mb-4">⚠️ Students at Dropout Risk</h2>
              <p className="text-sm text-gray-500 mb-3">Students with low activity and declining performance</p>
              <div className="space-y-2">
                {dropoutRisk.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-800">{s.full_name}</p>
                      <p className="text-xs text-gray-500">
                        Class {s.class_grade} • {s.school_name || 'Unknown School'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-red-600">Streak: {s.streak_days} days</p>
                      <p className="text-xs text-gray-400">XP: {s.xp_points}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quiz Score Trends */}
          {quizTrends.length > 0 && (
            <Card>
              <h2 className="font-bold text-gray-800 mb-4">📈 Quiz Score Trends (Last 30 Days)</h2>
              <div className="space-y-3">
                {quizTrends.map((trend, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-400">{trend.period}</p>
                    </div>
                    <div className="flex-1">
                      <ProgressBar value={parseFloat(trend.avg_score || 0)} color="blue" />
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-medium">{parseFloat(trend.avg_score || 0).toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{trend.total_attempts} attempts</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ─── Schools Tab ─── */}
      {activeTab === 'schools' && (
        <Card>
          <h2 className="font-bold text-gray-800 mb-4">🏫 Registered Schools</h2>
          {schools.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No schools registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3 font-medium text-gray-600">School Name</th>
                    <th className="p-3 font-medium text-gray-600">District</th>
                    <th className="p-3 font-medium text-gray-600">State</th>
                    <th className="p-3 font-medium text-gray-600">Type</th>
                    <th className="p-3 font-medium text-gray-600">Internet</th>
                    <th className="p-3 font-medium text-gray-600">Students</th>
                    <th className="p-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(s => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-gray-500">{s.district}</td>
                      <td className="p-3 text-gray-500">{s.state}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.school_type === 'government' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{s.school_type}</span>
                      </td>
                      <td className="p-3">
                        {s.has_internet ? (
                          <span className="text-green-600">🌐 Yes</span>
                        ) : (
                          <span className="text-red-500">📵 No</span>
                        )}
                      </td>
                      <td className="p-3">{s.total_students || '—'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Scholarships Tab ─── */}
      {activeTab === 'scholarships' && (
        <div>
          <Card className="mb-6">
            <h2 className="font-bold text-gray-800 mb-4">🎓 Scholarship Programmes</h2>
            {scholarships.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scholarships configured.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {scholarships.map(sch => (
                  <div key={sch.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{sch.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{sch.is_active ? 'Active' : 'Closed'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{sch.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-bold text-blue-700">₹{Number(sch.amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Min Score</p>
                        <p className="font-bold text-green-700">{sch.min_score}%</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Min XP</p>
                        <p className="font-bold text-purple-700">{sch.min_xp} XP</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Eligible Classes</p>
                        <p className="font-bold text-yellow-700">{sch.eligible_grades || 'All'}</p>
                      </div>
                    </div>
                    {sch.deadline && (
                      <p className="text-xs text-gray-400 mt-2">
                        Deadline: {new Date(sch.deadline).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Eligible Students Preview */}
          <Card>
            <h2 className="font-bold text-gray-800 mb-2">🌟 Quick Stats</h2>
            <p className="text-sm text-gray-500 mb-4">
              Students meeting scholarship criteria are auto-flagged based on XP and quiz scores.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-700">{overview.total_students || 0}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{scholarships.length}</p>
                <p className="text-xs text-gray-500">Active Schemes</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{overview.active_students_week || 0}</p>
                <p className="text-xs text-gray-500">Active This Week</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Curriculum Upload Tab ─── */}
      {activeTab === 'curriculum' && (
        <Card>
          <h2 className="font-bold text-gray-800 mb-4">📚 Upload Curriculum Content</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload new learning materials for students across all schools.
          </p>
          {curriculumMsg && <p className="text-sm mb-3">{curriculumMsg}</p>}
          <form onSubmit={uploadCurriculum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={curriculumForm.title}
                onChange={e => setCurriculumForm({ ...curriculumForm, title: e.target.value })}
                placeholder="e.g., Class 8 Science - Chapter 5: Light"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={curriculumForm.subject_id}
                  onChange={e => setCurriculumForm({ ...curriculumForm, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="1">Mathematics</option>
                  <option value="2">Science</option>
                  <option value="3">English</option>
                  <option value="4">Hindi</option>
                  <option value="5">Social Studies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Grade</label>
                <select
                  value={curriculumForm.class_grade}
                  onChange={e => setCurriculumForm({ ...curriculumForm, class_grade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Class</option>
                  {[5, 6, 7, 8, 9, 10].map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={curriculumForm.description}
                onChange={e => setCurriculumForm({ ...curriculumForm, description: e.target.value })}
                placeholder="Brief description of the curriculum content..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
              <input
                value={curriculumForm.file_url}
                onChange={e => setCurriculumForm({ ...curriculumForm, file_url: e.target.value })}
                placeholder="https://example.com/content/lesson.pdf"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Provide a URL to the hosted content (PDF, video, or HTML)</p>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              📤 Upload Curriculum
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
