import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../config/api';
import { StatCard, Card } from '../../components/common/UI';

export default function HomePage() {
    const { t } = useLanguage();
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        apiFetch('/schools/metrics').then(d => setMetrics(d.metrics)).catch(() => { });
    }, []);

    const features = [
        { icon: '📴', title: 'Offline First', desc: 'Learn without internet. Content downloads and works completely offline.' },
        { icon: '🌐', title: 'Multilingual', desc: 'Available in English, Hindi, Tamil and more regional languages.' },
        { icon: '🎮', title: 'Gamified Learning', desc: 'Earn XP, badges, climb leaderboards. Makes learning fun!' },
        { icon: '🔄', title: 'Auto Sync', desc: 'Progress syncs automatically when internet becomes available.' },
        { icon: '📊', title: 'Analytics', desc: 'Teachers and admins get real-time insights into student performance.' },
        { icon: '🤝', title: 'Bluetooth Sharing', desc: 'Share lessons with peers via Bluetooth — no internet needed.' },
    ];

    const govSchemes = [
        { name: 'Samagra Shiksha Abhiyan', desc: 'Integrated scheme for school education from pre-school to class XII' },
        { name: 'PM eVIDYA', desc: 'Digital/online education initiative with multi-mode access' },
        { name: 'National Means-cum-Merit Scholarship', desc: 'Scholarship for meritorious students from economically weaker sections' },
        { name: 'Digital India Programme', desc: 'Transforming India into a digitally empowered society' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white py-16 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        📚 {t('app_name')}
                    </h1>
                    <p className="text-xl md:text-2xl opacity-90 mb-2">{t('tagline')}</p>
                    <p className="text-base opacity-75 mb-8 max-w-2xl mx-auto">
                        Quality education for every rural student in India. Works on low-end phones,
                        even without internet. Class 5 to 10 curriculum in multiple languages.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/register" className="bg-white text-indigo-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 shadow-lg">
                            🚀 Get Started Free
                        </Link>
                        <Link to="/login" className="bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-indigo-400 border border-indigo-400">
                            📱 Open App
                        </Link>
                    </div>
                </div>
            </section>

            {/* Impact Metrics */}
            <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="🏫" label="Schools" value={metrics?.total_schools || '5+'} color="indigo" />
                    <StatCard icon="👨‍🎓" label="Students" value={metrics?.total_students || '1600+'} color="green" />
                    <StatCard icon="📖" label="Lessons" value={metrics?.total_lessons || '50+'} color="blue" />
                    <StatCard icon="🗺️" label="Districts" value={metrics?.districts_covered || '4+'} color="purple" />
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Why VidhyaSetu?</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                            <span className="text-4xl">{f.icon}</span>
                            <h3 className="text-lg font-bold text-gray-800 mt-3">{f.title}</h3>
                            <p className="text-gray-600 text-sm mt-2">{f.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Supported Languages */}
            <section className="bg-indigo-50 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">🌐 Supported Languages</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['English', 'हिन्दी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'ಕನ್ನಡ (Kannada)', 'मराठी (Marathi)'].map(lang => (
                            <span key={lang} className="bg-white px-4 py-2 rounded-full shadow text-sm font-medium text-gray-700">{lang}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Government Schemes */}
            <section className="max-w-6xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">🏛️ Government Schemes We Support</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {govSchemes.map((s, i) => (
                        <Card key={i}>
                            <h3 className="font-bold text-indigo-700">{s.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">{s.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* School Registration CTA */}
            <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-12 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-3">🏫 Register Your School</h2>
                    <p className="opacity-90 mb-6">Join the digital education revolution. Free for all government schools.</p>
                    <Link to="/register" className="bg-white text-green-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
                        Register School →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 py-8 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-lg font-bold text-white mb-2">📚 VidhyaSetu</p>
                    <p className="text-sm">Empowering rural education through technology</p>
                    <p className="text-xs mt-4">© 2026 VidhyaSetu. Built with ❤️ for rural India.</p>
                </div>
            </footer>
        </div>
    );
}
