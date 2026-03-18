import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';

function nowMs() {
    return Date.now();
}

export default function AnalyticsTracker() {
    const { user } = useAuth();
    const location = useLocation();

    const enabled = useMemo(() => Boolean(user && navigator.onLine), [user]);

    const lastVisibleAtRef = useRef(null);
    const lastPathRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        // Record a "visit" on route changes.
        const path = `${location.pathname}${location.search || ''}`;
        if (lastPathRef.current !== path) {
            lastPathRef.current = path;
            apiFetch('/analytics/visit', { method: 'POST', body: JSON.stringify({ path }) }).catch(() => { });
        }
    }, [enabled, location.pathname, location.search]);

    useEffect(() => {
        if (!enabled) return;

        function flushScreenTime() {
            const lastVisibleAt = lastVisibleAtRef.current;
            if (!lastVisibleAt) return;
            const durationSecs = Math.floor((nowMs() - lastVisibleAt) / 1000);
            lastVisibleAtRef.current = nowMs();
            if (durationSecs <= 0) return;
            apiFetch('/analytics/screen-time', {
                method: 'POST',
                body: JSON.stringify({ duration_secs: durationSecs })
            }).catch(() => { });
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'hidden') {
                flushScreenTime();
            } else if (document.visibilityState === 'visible') {
                lastVisibleAtRef.current = nowMs();
            }
        }

        function onPageHide() {
            flushScreenTime();
        }

        // Start timing if visible.
        if (document.visibilityState === 'visible') {
            lastVisibleAtRef.current = nowMs();
        }

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide);

        // Also flush periodically for long sessions.
        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') flushScreenTime();
        }, 30000);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('pagehide', onPageHide);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            flushScreenTime();
        };
    }, [enabled]);

    return null;
}
