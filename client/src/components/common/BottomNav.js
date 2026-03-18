import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function BottomNav() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { dark } = useTheme();

    if (!user || user.role !== 'student') return null;

    const navItems = [
        { to: '/student', icon: '🏠', label: t('home') },
        { to: '/student/lessons', icon: '📖', label: t('lessons') },
        { to: '/student/study', icon: '🎮', label: t('study') },
        { to: '/student/leaderboard', icon: '🏆', label: t('leaderboard') },
        { to: '/student/profile', icon: '👤', label: t('profile') },
    ];

    return (
        <nav className={`fixed bottom-0 left-0 right-0 border-t z-50 md:hidden ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-around items-center h-14">
                {navItems.map(item => (
                    <Link key={item.to} to={item.to} className={`flex flex-col items-center hover:text-indigo-400 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
