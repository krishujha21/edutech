import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
    en: {
        app_name: 'VidhyaSetu',
        tagline: 'Learn Anytime, Anywhere — Even Offline',
        home: 'Home',
        lessons: 'Lessons',
        quizzes: 'Quizzes',
        study: 'Study',
        progress: 'Progress',
        leaderboard: 'Leaderboard',
        profile: 'Profile',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        offline_mode: 'Offline Mode',
        online: 'Online',
        syncing: 'Syncing...',
        sync_now: 'Sync Now',
        last_synced: 'Last synced',
        subjects: { math: 'Mathematics', sci: 'Science', eng: 'English', sst: 'Social Science', hin: 'Hindi' },
        quiz_start: 'Start Quiz',
        quiz_submit: 'Submit',
        quiz_score: 'Your Score',
        next_lesson: 'Next Lesson',
        complete: 'Complete',
        download_offline: 'Download for Offline',
        xp_points: 'XP Points',
        level: 'Level',
        streak: 'Day Streak',
        badges: 'Badges',
        daily_target: 'Daily Target',
        teacher_dashboard: 'Teacher Dashboard',
        admin_panel: 'Admin Panel',
        students: 'Students',
        schools: 'Schools',
        at_risk: 'At Risk',
        announcements: 'Announcements',
    },
    hi: {
        app_name: 'VidhyaSetu',
        tagline: 'कभी भी, कहीं भी सीखें — ऑफ़लाइन भी',
        home: 'होम',
        lessons: 'पाठ',
        quizzes: 'प्रश्नोत्तरी',
        study: 'अध्ययन',
        progress: 'प्रगति',
        leaderboard: 'लीडरबोर्ड',
        profile: 'प्रोफ़ाइल',
        login: 'लॉग इन',
        register: 'रजिस्टर',
        logout: 'लॉग आउट',
        offline_mode: 'ऑफ़लाइन मोड',
        online: 'ऑनलाइन',
        syncing: 'सिंक हो रहा है...',
        sync_now: 'अभी सिंक करें',
        last_synced: 'अंतिम सिंक',
        subjects: { math: 'गणित', sci: 'विज्ञान', eng: 'अंग्रेज़ी', sst: 'सामाजिक विज्ञान', hin: 'हिन्दी' },
        quiz_start: 'प्रश्नोत्तरी शुरू करें',
        quiz_submit: 'जमा करें',
        quiz_score: 'आपका स्कोर',
        next_lesson: 'अगला पाठ',
        complete: 'पूर्ण',
        download_offline: 'ऑफ़लाइन डाउनलोड करें',
        xp_points: 'XP अंक',
        level: 'स्तर',
        streak: 'दिन की लय',
        badges: 'बैज',
        daily_target: 'दैनिक लक्ष्य',
        teacher_dashboard: 'शिक्षक डैशबोर्ड',
        admin_panel: 'प्रशासन पैनल',
        students: 'छात्र',
        schools: 'विद्यालय',
        at_risk: 'खतरे में',
        announcements: 'घोषणाएं',
    },
    ta: {
        app_name: 'VidhyaSetu',
        tagline: 'எப்போதும், எங்கும் கற்றுக்கொள்ளுங்கள் — ஆஃப்லைன் கூட',
        home: 'முகப்பு',
        lessons: 'பாடங்கள்',
        quizzes: 'வினாடி வினா',
        study: 'படிப்பு',
        progress: 'முன்னேற்றம்',
        leaderboard: 'தரவரிசை',
        profile: 'சுயவிவரம்',
        login: 'உள்நுழைய',
        register: 'பதிவு',
        logout: 'வெளியேறு',
        offline_mode: 'ஆஃப்லைன் பயன்முறை',
        online: 'ஆன்லைன்',
        syncing: 'ஒத்திசைக்கிறது...',
        sync_now: 'இப்போது ஒத்திசை',
        last_synced: 'கடைசி ஒத்திசைவு',
        subjects: { math: 'கணிதம்', sci: 'அறிவியல்', eng: 'ஆங்கிலம்', sst: 'சமூக அறிவியல்', hin: 'இந்தி' },
        quiz_start: 'வினாடி வினா தொடங்கு',
        quiz_submit: 'சமர்ப்பி',
        quiz_score: 'உங்கள் மதிப்பெண்',
        next_lesson: 'அடுத்த பாடம்',
        complete: 'நிறைவு',
        download_offline: 'ஆஃப்லைன் பதிவிறக்கம்',
        xp_points: 'XP புள்ளிகள்',
        level: 'நிலை',
        streak: 'நாள் தொடர்',
        badges: 'பதக்கங்கள்',
        daily_target: 'தினசரி இலக்கு',
        teacher_dashboard: 'ஆசிரியர் டாஷ்போர்டு',
        admin_panel: 'நிர்வாக பேனல்',
        students: 'மாணவர்கள்',
        schools: 'பள்ளிகள்',
        at_risk: 'ஆபத்தில்',
        announcements: 'அறிவிப்புகள்',
    }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

    const changeLang = useCallback((newLang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    }, []);

    const t = useCallback((key) => {
        const keys = key.split('.');
        let value = translations[lang];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || translations['en']?.[keys[keys.length - 1]] || key;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, changeLang, t, languages: ['en', 'hi', 'ta'] }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
    return ctx;
}
