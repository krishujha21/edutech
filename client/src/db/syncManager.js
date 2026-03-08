/* ====================================================
   Sync Manager - Handles offline/online data sync
   Automatically syncs when internet becomes available
   ==================================================== */

import { apiFetch } from '../config/api';
import {
    getUnsyncedData,
    markAsSynced,
    saveLessonsOffline,
    dbPutBulk,
    dbPut,
    dbGetAll,
    dbClear
} from './indexedDB';

class SyncManager {
    constructor() {
        this.isSyncing = false;
        this.listeners = new Set();
        this.lastSync = localStorage.getItem('lastSync') || null;
        this.setupListeners();
    }

    // Listen for online/offline events
    setupListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online! Starting sync...');
            this.notifyListeners({ type: 'ONLINE' });
            this.syncAll();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline');
            this.notifyListeners({ type: 'OFFLINE' });
        });

        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'SYNC_TRIGGERED') {
                    this.syncAll();
                }
            });
        }

        // Periodic sync check (every 5 minutes when online)
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.syncAll();
            }
        }, 5 * 60 * 1000);
    }

    // Subscribe to sync events
    onSync(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event) {
        this.listeners.forEach(cb => cb(event));
    }

    // Full sync cycle: push local changes, then pull updates
    async syncAll() {
        if (this.isSyncing || !navigator.onLine) return;

        this.isSyncing = true;
        this.notifyListeners({ type: 'SYNC_START' });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.isSyncing = false;
                return;
            }

            // Step 1: Push local changes
            await this.pushChanges();

            // Step 2: Pull updates from server
            await this.pullUpdates();

            // Update last sync time
            this.lastSync = new Date().toISOString();
            localStorage.setItem('lastSync', this.lastSync);

            this.notifyListeners({ type: 'SYNC_COMPLETE', timestamp: this.lastSync });
            console.log('✅ Sync completed at', this.lastSync);
        } catch (err) {
            console.error('❌ Sync failed:', err);
            this.notifyListeners({ type: 'SYNC_ERROR', error: err.message });
        } finally {
            this.isSyncing = false;
        }
    }

    // Push offline data to server
    async pushChanges() {
        const unsynced = await getUnsyncedData();
        const totalItems =
            unsynced.quiz_attempts.length +
            unsynced.progress.length +
            unsynced.daily_targets.length;

        if (totalItems === 0) {
            console.log('📤 Nothing to push');
            return;
        }

        console.log(`📤 Pushing ${totalItems} items...`);
        this.notifyListeners({ type: 'PUSH_START', count: totalItems });

        const result = await apiFetch('/sync/push', {
            method: 'POST',
            body: JSON.stringify({
                progress: unsynced.progress,
                quiz_attempts: unsynced.quiz_attempts,
                daily_targets: unsynced.daily_targets,
                device_id: this.getDeviceId()
            })
        });

        // Mark pushed items as synced
        if (unsynced.quiz_attempts.length > 0) {
            await markAsSynced('quiz_attempts', unsynced.quiz_attempts.map(a => a.uuid));
        }
        if (unsynced.progress.length > 0) {
            await markAsSynced('progress', unsynced.progress.map(p => p.lesson_id));
        }

        this.notifyListeners({ type: 'PUSH_COMPLETE', result });
    }

    // Pull updates from server
    async pullUpdates() {
        console.log('📥 Pulling updates...');
        this.notifyListeners({ type: 'PULL_START' });

        const result = await apiFetch('/sync/pull', {
            method: 'POST',
            body: JSON.stringify({
                last_sync: this.lastSync,
                device_id: this.getDeviceId()
            })
        });

        // Save pulled data to IndexedDB
        if (result.lessons?.length > 0) {
            await saveLessonsOffline(result.lessons);
            console.log(`📥 Pulled ${result.lessons.length} lessons`);
        }

        if (result.quizzes?.length > 0) {
            await dbPutBulk('quizzes', result.quizzes);
            console.log(`📥 Pulled ${result.quizzes.length} quizzes`);
        }

        if (result.announcements?.length > 0) {
            await dbClear('announcements');
            await dbPutBulk('announcements', result.announcements);
        }

        if (result.badges?.length > 0) {
            await dbPutBulk('badges', result.badges);
        }

        if (result.student) {
            await dbPut('user_profile', { id: 'current', ...result.student });
        }

        this.notifyListeners({
            type: 'PULL_COMPLETE',
            counts: {
                lessons: result.lessons?.length || 0,
                quizzes: result.quizzes?.length || 0,
                announcements: result.announcements?.length || 0
            }
        });
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    isOnline() {
        return navigator.onLine;
    }

    getLastSync() {
        return this.lastSync;
    }
}

// Singleton instance
const syncManager = new SyncManager();
export default syncManager;
