// In development, use relative URLs so the CRA proxy (package.json "proxy") forwards to the backend.
// In production, use the full backend URL.
const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default API_BASE;

export function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: getHeaders(),
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API request failed');
        return data;
    } catch (err) {
        // If offline, throw with offline flag
        if (!navigator.onLine) {
            const error = new Error('You are offline');
            error.offline = true;
            throw error;
        }
        throw err;
    }
}
