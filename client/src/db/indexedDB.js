/* ====================================================
   IndexedDB - Offline Storage for Rural Learning System
   Complete local database with all stores needed
   ==================================================== */

const DB_NAME = 'GramShikshaDB';
const DB_VERSION = 1;

let dbInstance = null;

export function openDB() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Lessons store
            if (!db.objectStoreNames.contains('lessons')) {
                const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
                lessonStore.createIndex('subject_id', 'subject_id', { unique: false });
                lessonStore.createIndex('class_grade', 'class_grade', { unique: false });
                lessonStore.createIndex('uuid', 'uuid', { unique: true });
            }

            // Quizzes store
            if (!db.objectStoreNames.contains('quizzes')) {
                const quizStore = db.createObjectStore('quizzes', { keyPath: 'id' });
                quizStore.createIndex('lesson_id', 'lesson_id', { unique: false });
                quizStore.createIndex('class_grade', 'class_grade', { unique: false });
            }

            // Quiz attempts (offline)
            if (!db.objectStoreNames.contains('quiz_attempts')) {
                const attemptStore = db.createObjectStore('quiz_attempts', { keyPath: 'uuid' });
                attemptStore.createIndex('quiz_id', 'quiz_id', { unique: false });
                attemptStore.createIndex('is_synced', 'is_synced', { unique: false });
            }

            // Progress tracking (offline)
            if (!db.objectStoreNames.contains('progress')) {
                const progressStore = db.createObjectStore('progress', { keyPath: 'lesson_id' });
                progressStore.createIndex('status', 'status', { unique: false });
                progressStore.createIndex('is_synced', 'is_synced', { unique: false });
            }

            // Daily targets
            if (!db.objectStoreNames.contains('daily_targets')) {
                const targetStore = db.createObjectStore('daily_targets', { keyPath: 'date' });
                targetStore.createIndex('is_synced', 'is_synced', { unique: false });
            }

            // User profile cache
            if (!db.objectStoreNames.contains('user_profile')) {
                db.createObjectStore('user_profile', { keyPath: 'id' });
            }

            // Announcements cache
            if (!db.objectStoreNames.contains('announcements')) {
                db.createObjectStore('announcements', { keyPath: 'id' });
            }

            // Badges
            if (!db.objectStoreNames.contains('badges')) {
                db.createObjectStore('badges', { keyPath: 'id' });
            }

            // Sync queue for pending operations
            if (!db.objectStoreNames.contains('sync_queue')) {
                const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('type', 'type', { unique: false });
                syncStore.createIndex('created_at', 'created_at', { unique: false });
            }

            // Subjects
            if (!db.objectStoreNames.contains('subjects')) {
                db.createObjectStore('subjects', { keyPath: 'id' });
            }

            // Leaderboard cache
            if (!db.objectStoreNames.contains('leaderboard')) {
                db.createObjectStore('leaderboard', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(new Error('Failed to open IndexedDB: ' + event.target.error));
        };
    });
}

// Generic CRUD operations
export async function dbPut(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function dbGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function dbGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function dbDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function dbClear(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function dbGetByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function dbPutBulk(storeName, items) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        items.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ============ HIGH-LEVEL OFFLINE OPERATIONS ============

// Save lessons for offline use
export async function saveLessonsOffline(lessons) {
    await dbPutBulk('lessons', lessons);
    console.log(`📦 Saved ${lessons.length} lessons offline`);
}

// Get offline lessons filtered
export async function getOfflineLessons(grade, subjectId) {
    const all = await dbGetAll('lessons');
    return all.filter(l =>
        (!grade || l.class_grade === parseInt(grade)) &&
        (!subjectId || l.subject_id === parseInt(subjectId))
    );
}

// Save quiz attempt offline
export async function saveQuizAttemptOffline(attempt) {
    const data = {
        ...attempt,
        uuid: attempt.uuid || generateUUID(),
        is_synced: false,
        created_at: new Date().toISOString()
    };
    await dbPut('quiz_attempts', data);
    return data;
}

// Get unsynced data
export async function getUnsyncedData() {
    const attempts = await dbGetByIndex('quiz_attempts', 'is_synced', false);
    const progress = await dbGetByIndex('progress', 'is_synced', false);
    const targets = await dbGetByIndex('daily_targets', 'is_synced', false);
    return { quiz_attempts: attempts, progress, daily_targets: targets };
}

// Mark items as synced
export async function markAsSynced(storeName, keys) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const key of keys) {
        const item = await new Promise(r => {
            const req = store.get(key);
            req.onsuccess = () => r(req.result);
        });
        if (item) {
            item.is_synced = true;
            item.synced_at = new Date().toISOString();
            store.put(item);
        }
    }
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Update lesson progress offline
export async function updateProgressOffline(lessonId, data) {
    const existing = await dbGet('progress', lessonId);
    const updated = {
        lesson_id: lessonId,
        ...existing,
        ...data,
        is_synced: false,
        updated_at: new Date().toISOString()
    };
    await dbPut('progress', updated);
    return updated;
}

// Get overall offline stats
export async function getOfflineStats() {
    const progress = await dbGetAll('progress');
    const attempts = await dbGetAll('quiz_attempts');

    const completed = progress.filter(p => p.status === 'completed').length;
    const totalTime = progress.reduce((sum, p) => sum + (p.time_spent_secs || 0), 0);
    const avgScore = attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
        : 0;

    return {
        lessons_completed: completed,
        lessons_in_progress: progress.filter(p => p.status === 'in_progress').length,
        quizzes_attempted: attempts.length,
        avg_quiz_score: avgScore.toFixed(1),
        total_time_mins: Math.round(totalTime / 60),
        unsynced_items: (await getUnsyncedData()).quiz_attempts.length +
            (await getUnsyncedData()).progress.length
    };
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export { generateUUID };
