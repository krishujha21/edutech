import React from 'react';

export function Card({ children, className = '', onClick }) {
    return (
        <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function StatCard({ icon, label, value, sub, color = 'indigo' }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700',
        green: 'bg-green-50 text-green-700',
        yellow: 'bg-yellow-50 text-yellow-700',
        red: 'bg-red-50 text-red-700',
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
    };

    return (
        <div className={`rounded-xl p-4 ${colors[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm opacity-75">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}

export function ProgressBar({ value, max = 100, color = 'indigo', height = 'h-2', showLabel = false }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const barColors = {
        indigo: 'bg-indigo-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{value}/{max}</span>
                    <span>{pct}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full ${height}`}>
                <div className={`${barColors[color]} ${height} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export function Badge({ icon, name, earned = true }) {
    return (
        <div className={`flex flex-col items-center p-2 rounded-lg ${earned ? 'opacity-100' : 'opacity-30'}`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-center mt-1">{name}</span>
        </div>
    );
}

export function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-3 text-sm">{text}</p>
        </div>
    );
}

export function EmptyState({ icon = '📭', title, message }) {
    return (
        <div className="text-center py-12">
            <span className="text-5xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-700 mt-3">{title}</h3>
            <p className="text-gray-500 text-sm mt-1">{message}</p>
        </div>
    );
}

export function OfflineBadge() {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            📴 Offline
        </span>
    );
}
