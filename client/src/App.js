import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Home/LoginPage';
import RegisterPage from './pages/Home/RegisterPage';
import StudentDashboard from './pages/Student/StudentDashboard';
import LessonList from './pages/Student/LessonList';
import LessonView from './pages/Student/LessonView';
import QuizList from './pages/Student/QuizList';
import QuizPlay from './pages/Student/QuizPlay';
import Leaderboard from './pages/Student/Leaderboard';
import StudentProfile from './pages/Student/StudentProfile';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
}

function AppRoutes() {
    const { dark } = useTheme();
    return (
        <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <Navbar />
            <main className="pb-16 md:pb-0">
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Student */}
                    <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/student/lessons" element={<ProtectedRoute roles={['student']}><LessonList /></ProtectedRoute>} />
                    <Route path="/student/lessons/:id" element={<ProtectedRoute roles={['student']}><LessonView /></ProtectedRoute>} />
                    <Route path="/student/quizzes" element={<ProtectedRoute roles={['student']}><QuizList /></ProtectedRoute>} />
                    <Route path="/student/quizzes/:id" element={<ProtectedRoute roles={['student']}><QuizPlay /></ProtectedRoute>} />
                    <Route path="/student/leaderboard" element={<ProtectedRoute roles={['student']}><Leaderboard /></ProtectedRoute>} />
                    <Route path="/student/profile" element={<ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>} />

                    {/* Teacher */}
                    <Route path="/teacher" element={<ProtectedRoute roles={['teacher', 'school_admin']}><TeacherDashboard /></ProtectedRoute>} />

                    {/* Admin */}
                    <Route path="/admin" element={<ProtectedRoute roles={['govt_admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <BottomNav />
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <ThemeProvider>
                <LanguageProvider>
                    <AuthProvider>
                        <OfflineProvider>
                            <AppRoutes />
                        </OfflineProvider>
                    </AuthProvider>
                </LanguageProvider>
            </ThemeProvider>
        </Router>
    );
}
