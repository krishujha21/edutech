# 📚 GramShiksha — Offline-First Rural Learning System (Class 5–10)

> An offline-first Progressive Web App designed to bring quality education to rural India's 250M+ students, even without reliable internet.

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node](https://img.shields.io/badge/Node.js-18+-339933)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1)
![PWA](https://img.shields.io/badge/PWA-Offline%20First-ff6f00)

---

## 🎯 Problem Statement

- **120M+ rural students** lack consistent internet for digital learning
- Existing ed-tech platforms require constant connectivity
- Government monitoring of rural education is fragmented
- Students drop out due to lack of engagement and tracking

## 💡 Solution

**GramShiksha** is a complete offline-first learning platform that:
- Works **without internet** using IndexedDB + Service Workers
- **Auto-syncs** when connectivity is available
- Provides **gamified learning** (XP, levels, streaks, badges, leaderboards)
- Supports **multilingual** content (English, Hindi, Tamil)
- Includes **Teacher Dashboard** for classroom management
- Has **Government Admin Panel** for district-wide monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   PWA Client                     │
│  React 18 + Tailwind CSS + IndexedDB            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Student  │ │ Teacher  │ │ Govt Admin Panel │ │
│  │   App    │ │Dashboard │ │   (Analytics)    │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────────────┐│
│  │  Service Worker (Cache-First + Background    ││
│  │  Sync) + IndexedDB (Offline Storage)         ││
│  └──────────────────────────────────────────────┘│
└──────────────────┬──────────────────────────────┘
                   │ REST API (when online)
┌──────────────────▼──────────────────────────────┐
│              Node.js + Express API               │
│  JWT Auth │ Role-Based Access │ Sync Engine      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                 MySQL Database                    │
│  17+ Tables │ Views │ Indexes │ UTF8MB4          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+ running locally
- Git

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd edtech
npm run install:all
```

### 2. Configure Environment

```bash
# Edit .env with your MySQL credentials
cp .env.example .env
nano .env
```

Default `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=rural_learning
JWT_SECRET=hackathon_demo_secret_key_2026
```

### 3. Setup Database

```bash
# Creates tables and inserts demo data
npm run db:setup
```

### 4. Run Development Server

```bash
npm run dev
```

This starts:
- **Backend API** at `http://localhost:5000`
- **React App** at `http://localhost:3000`

---

## 🔐 Demo Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Student | `rahul_s` | `demo123` | Student Dashboard, Lessons, Quizzes |
| Student | `priya_k` | `demo123` | Student Dashboard |
| Teacher | `teacher_anita` | `demo123` | Teacher Dashboard |
| School Admin | `school_admin1` | `demo123` | Teacher Dashboard |
| Govt Admin | `govt_admin` | `demo123` | Government Admin Panel |
| Super Admin | `super_admin` | `demo123` | Full Access |

---

## 📂 Project Structure

```
edtech/
├── package.json              # Root config with scripts
├── .env                      # Environment variables
├── server/
│   ├── package.json
│   ├── index.js              # Express server entry
│   ├── config/
│   │   └── db.js             # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── database/
│   │   ├── schema.sql        # Full DB schema (17+ tables)
│   │   ├── seed.sql          # Demo data
│   │   └── setup.js          # DB setup script
│   └── routes/
│       ├── auth.js           # Login / Register / Me
│       ├── lessons.js        # CRUD + offline bundles
│       ├── quizzes.js        # Quiz engine + grading
│       ├── progress.js       # Learning progress tracking
│       ├── sync.js           # Push/Pull sync endpoints
│       ├── leaderboard.js    # Rankings & gamification
│       ├── teacher.js        # Teacher dashboard APIs
│       ├── admin.js          # Govt admin analytics
│       ├── schools.js        # School management
│       └── announcements.js  # School announcements
├── client/
│   ├── package.json
│   ├── public/
│   │   ├── index.html        # PWA entry with Tailwind CDN
│   │   ├── sw.js             # Service Worker
│   │   └── manifest.json     # PWA manifest
│   └── src/
│       ├── index.js          # React entry + SW registration
│       ├── index.css         # Global styles
│       ├── App.js            # Router + providers
│       ├── config/
│       │   └── api.js        # API client with offline fallback
│       ├── db/
│       │   ├── indexedDB.js   # IndexedDB wrapper (11 stores)
│       │   └── syncManager.js # Auto-sync engine
│       ├── context/
│       │   ├── AuthContext.js     # Auth state + offline user cache
│       │   ├── OfflineContext.js  # Online/offline/sync state
│       │   └── LanguageContext.js # i18n (en/hi/ta)
│       ├── components/
│       │   └── common/
│       │       ├── Navbar.js     # Top navigation
│       │       ├── BottomNav.js  # Mobile bottom nav
│       │       └── UI.js         # Shared UI components
│       └── pages/
│           ├── NotFound.js
│           ├── Home/
│           │   ├── HomePage.js     # Landing page
│           │   ├── LoginPage.js    # Login + demo accounts
│           │   └── RegisterPage.js # Registration
│           ├── Student/
│           │   ├── StudentDashboard.js # Main student hub
│           │   ├── LessonList.js       # Browse lessons
│           │   ├── LessonView.js       # Read lesson + progress
│           │   ├── QuizList.js         # Available quizzes
│           │   ├── QuizPlay.js         # Quiz engine + timer
│           │   ├── Leaderboard.js      # Rankings
│           │   └── StudentProfile.js   # Profile + sync
│           ├── Teacher/
│           │   └── TeacherDashboard.js # Class management
│           └── Admin/
│               └── AdminDashboard.js   # Govt analytics
```

---

## ✨ Key Features

### 📱 Offline-First Architecture
- **IndexedDB** stores lessons, quizzes, progress, and badges locally
- **Service Worker** caches static assets and API responses
- **Auto-sync** pushes local changes when internet becomes available
- Students can learn for days without internet

### 🎮 Gamification Engine
- **XP Points** for completing lessons and quizzes
- **Level System** (1→Beginner to 50→Master)
- **Streak Tracking** for daily learning habits
- **Badges** for achievements (First Lesson, Quiz Master, etc.)
- **Leaderboards** (weekly, monthly, all-time)

### 🌐 Multilingual Support
- English, Hindi, and Tamil built-in
- Easy to add more languages
- UI labels auto-translate on language switch

### 👩‍🏫 Teacher Dashboard
- View student performance by class
- Subject-wise quiz score analytics
- Identify at-risk students
- Post announcements and homework
- Export class reports

### 🏛️ Government Admin Panel
- District-wide school metrics
- Student engagement analytics
- Dropout risk detection
- Scholarship management
- Curriculum upload portal
- Quiz score trend analysis

### 📊 Analytics & Tracking
- Individual student progress
- Class-wise performance comparison
- Subject-level analytics
- Daily activity targets
- Sync status monitoring

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MySQL 8 (utf8mb4) |
| Auth | JWT (JSON Web Tokens) |
| Offline | IndexedDB, Service Workers, Cache API |
| PWA | Web App Manifest, Background Sync |
| Icons | React Icons, Emoji-based |
| Charts | Recharts |

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login with credentials
- `GET /api/auth/me` — Get current user profile

### Learning
- `GET /api/lessons` — List lessons (filterable)
- `GET /api/lessons/:id` — Get single lesson
- `GET /api/lessons/offline/bundle` — Download lessons for offline
- `GET /api/quizzes` — List quizzes
- `POST /api/quizzes/:id/submit` — Submit quiz answers

### Progress & Sync
- `GET /api/progress/summary` — Student progress summary
- `POST /api/sync/push` — Push offline data to server
- `POST /api/sync/pull` — Pull latest data from server

### Teacher
- `GET /api/teacher/dashboard` — Teacher analytics
- `GET /api/teacher/students` — Student list
- `POST /api/teacher/announcement` — Post announcement

### Admin
- `GET /api/admin/dashboard` — District-wide analytics
- `GET /api/admin/schools` — School metrics
- `POST /api/admin/curriculum` — Upload curriculum
- `GET /api/admin/scholarships` — Scholarship programmes

---

## 🗄️ Database Schema

The database includes **17+ tables** with the following key entities:

- `schools` — School registry with location and internet status
- `users` — All users (students, teachers, admins) with role-based access
- `students` / `teachers` — Role-specific profile extensions
- `subjects` — 5 subjects (Math, Science, English, Hindi, Social Studies)
- `lessons` — Learning content with multimedia support
- `quizzes` / `quiz_attempts` — Quiz engine with auto-grading
- `progress_tracking` — Lesson completion tracking
- `badges` / `student_badges` — Achievement system
- `leaderboards` — Ranked performance tables
- `scholarships` — Government scholarship schemes
- `announcements` — School/class announcements
- `sync_logs` — Offline sync tracking

---

## 🧪 Testing the Offline Flow

1. Open the app at `http://localhost:3000`
2. Login as `rahul_s` / `demo123`
3. Browse lessons and quizzes (data gets cached)
4. **Turn off your internet** (or use DevTools → Network → Offline)
5. Continue browsing and taking quizzes — everything works!
6. Turn internet back on
7. Watch the auto-sync indicator in the navbar

---

## 📝 Available Scripts

```bash
# Install all dependencies (root + server + client)
npm run install:all

# Setup MySQL database with schema + seed data
npm run db:setup

# Run both server and client in development
npm run dev

# Run only the backend server
npm run server

# Run only the React client
npm run client
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- Built for the **Rural Education Hackathon 2026**
- Inspired by India's **National Education Policy (NEP) 2020**
- Designed for low-bandwidth, intermittent connectivity environments
- Focused on **Sustainable Development Goal 4**: Quality Education

---

<p align="center">
  Made with ❤️ for Rural India's Students<br/>
  <strong>📚 GramShiksha — शिक्षा सबके लिए</strong>
</p>
