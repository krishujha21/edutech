import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { isOnline, isSyncing, syncStatus, triggerSync, lastSync } = useOffline();
    const { lang, changeLang, t } = useLanguage();
    const { dark, toggle } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 font-bold text-lg">
                        <span className="text-2xl">📚</span>
                        <span>{t('app_name')}</span>
                    </Link>

                    {/* Connection Status */}
                    <div className="flex items-center space-x-3">
                        {/* Online/Offline indicator */}
                        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-200' : 'bg-red-200'} animate-pulse`}></span>
                            <span>{isOnline ? t('online') : t('offline_mode')}</span>
                        </div>

                        {/* Sync button */}
                        {user && isOnline && (
                            <button
                                onClick={triggerSync}
                                disabled={isSyncing}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded"
                                title={lastSync ? `${t('last_synced')}: ${new Date(lastSync).toLocaleString()}` : ''}
                            >
                                {isSyncing ? '⟳ ' + t('syncing') : '↻ ' + t('sync_now')}
                            </button>
                        )}

                        {/* Dark / Light toggle */}
                        <button
                            onClick={toggle}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-2 py-1 rounded transition-colors"
                            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {dark ? '☀️' : '🌙'}
                        </button>

                        {/* Language selector */}
                        <select
                            value={lang}
                            onChange={(e) => changeLang(e.target.value)}
                            className="bg-indigo-600 text-white text-xs rounded px-1 py-1 border-0"
                        >
                            <option value="en">EN</option>
                            <option value="hi">हिं</option>
                            <option value="ta">தமி</option>
                        </select>

                        {/* Auth buttons */}
                        {user ? (
                            <div className="flex items-center space-x-2">
                                <Link to={
                                    user.role === 'teacher' ? '/teacher' :
                                        user.role === 'govt_admin' || user.role === 'super_admin' ? '/admin' :
                                            '/student'
                                } className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded">
                                    {user.full_name?.split(' ')[0]}
                                </Link>
                                <button onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="text-xs bg-white text-indigo-700 px-3 py-1 rounded font-semibold hover:bg-gray-100">
                                {t('login')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Sync status bar */}
            {syncStatus && (
                <div className="bg-yellow-500 text-yellow-900 text-xs text-center py-1 font-medium">
                    {syncStatus}
                </div>
            )}
        </nav>
    );
}
