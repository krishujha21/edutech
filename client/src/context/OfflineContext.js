import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import syncManager from '../db/syncManager';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(syncManager.getLastSync());
    const [syncStatus, setSyncStatus] = useState(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for sync events
        const unsub = syncManager.onSync((event) => {
            switch (event.type) {
                case 'ONLINE': setIsOnline(true); break;
                case 'OFFLINE': setIsOnline(false); break;
                case 'SYNC_START': setIsSyncing(true); setSyncStatus('Syncing...'); break;
                case 'SYNC_COMPLETE':
                    setIsSyncing(false);
                    setLastSync(event.timestamp);
                    setSyncStatus('Sync complete');
                    setTimeout(() => setSyncStatus(null), 3000);
                    break;
                case 'SYNC_ERROR':
                    setIsSyncing(false);
                    setSyncStatus('Sync failed');
                    setTimeout(() => setSyncStatus(null), 5000);
                    break;
                default: break;
            }
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsub();
        };
    }, []);

    const triggerSync = useCallback(() => {
        syncManager.syncAll();
    }, []);

    return (
        <OfflineContext.Provider value={{ isOnline, isSyncing, lastSync, syncStatus, triggerSync }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const ctx = useContext(OfflineContext);
    if (!ctx) throw new Error('useOffline must be inside OfflineProvider');
    return ctx;
}
