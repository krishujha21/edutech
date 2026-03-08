import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register Service Worker (production only — conflicts with dev server HMR)
if ('serviceWorker' in navigator) {
    if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                .catch(err => console.log('SW registration failed:', err));
        });
    } else {
        // Unregister any existing SW in development to prevent reload loops
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
        });
    }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
