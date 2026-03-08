import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../config/api';
import { dbPut, dbGet } from '../db/indexedDB';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            if (navigator.onLine) {
                const data = await apiFetch('/auth/me');
                setUser(data.user);
                await dbPut('user_profile', { id: 'current', ...data.user });
            } else {
                // Load from IndexedDB when offline
                const cached = await dbGet('user_profile', 'current');
                if (cached) setUser(cached);
            }
        } catch (err) {
            // Try offline cache
            const cached = await dbGet('user_profile', 'current');
            if (cached) setUser(cached);
            else logout();
        } finally {
            setLoading(false);
        }
    }

    const login = useCallback(async (username, password) => {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        await dbPut('user_profile', { id: 'current', ...data.user });
        return data.user;
    }, []);

    const register = useCallback(async (userData) => {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
