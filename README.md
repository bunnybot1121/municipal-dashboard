# 🏛️ NagarSevak AI — Smart Municipal Dashboard

> An AI-powered municipal operations platform for smart city governance, citizen engagement, and infrastructure management.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3FCF8E?logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Verification-4285F4?logo=google&logoColor=white)

---

## ✨ Features

### 🎛️ Admin Command Center
- **Real-time Dashboard** — Live overview of municipal operations with key metrics, charts, and status indicators
- **Interactive Map** — Leaflet-powered geospatial view of reported issues, infrastructure, and city zones
- **Issue Management** — Full CRUD for citizen-reported issues with filtering, search, and status tracking
- **Staff Management** — Manage municipal workers, assign tasks, and track performance
- **Task Scheduler** — Calendar-based task scheduling with drag-and-drop support (FullCalendar)
- **Analytics** — Visual analytics dashboard powered by Recharts for trends, resolution rates, and zone heatmaps
- **Notifications** — Real-time notification system for alerts and updates

### 🤖 AI-Powered Verification
- **Gemini Vision Analysis** — Automatically verifies citizen-submitted issue photos using Google Gemini AI
- **Trust Scoring** — AI assigns verification status: ✅ Verified, ⚠️ Suspicious, or ⏳ Pending
- **Admin Visibility** — AI analysis results displayed inline in issue list and detail views

### 📱 Citizen Portal
- **Report Issues** — Citizens can report municipal issues with photos, location, and descriptions
- **Track Reports** — View submitted reports and track resolution status
- **Notifications** — Receive updates on reported issue progress
- **Onboarding** — Guided onboarding flow for new citizens

### 👷 Worker Portal
- **Worker Dashboard** — Dedicated dashboard for municipal workers to view and manage assigned tasks
- **Worker Login** — Separate authentication flow for field workers
- **Schedule Upload** — Upload and parse work schedules from markdown/documents

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite 6, Material UI (MUI), Lucide Icons |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Calendar** | FullCalendar |
| **Backend** | Express.js (Node.js) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + Custom Worker Auth (bcrypt) |
| **AI** | Google Gemini API (Vision Analysis) |
| **Routing** | React Router v7 |
| **Deployment** | GitHub Pages (frontend) |

---

## 📁 Project Structure

```
nagar/
├── src/                          # React frontend
│   ├── citizen/                  # Citizen-facing portal
│   │   ├── CitizenApp.jsx
│   │   ├── ReportIssue.jsx
│   │   └── components/
│   ├── components/               # Shared components
│   │   ├── CommandCenter/        # Dashboard map & feeds
│   │   ├── Sidebar.jsx
│   │   ├── EnhancedMap.jsx
│   │   └── Calendar.jsx
│   ├── pages/                    # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── IssueList.jsx
│   │   ├── IssueDetail.jsx
│   │   ├── Analytics.jsx
│   │   ├── Staff.jsx
│   │   ├── TaskScheduler.jsx
│   │   ├── WorkerDashboard.jsx
│   │   ├── WorkerLogin.jsx
│   │   └── ...
│   ├── contexts/                 # React context (Auth)
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # API clients & services
│   ├── utils/                    # Utilities & parsers
│   └── App.jsx                   # Root component & routing
│
├── server/                       # Express backend
│   ├── server.js                 # Entry point
│   ├── routes/
│   │   ├── issuesRoutes.js       # Issue CRUD endpoints
│   │   ├── analysisRoutes.js     # AI analysis endpoints
│   │   ├── validationRoutes.js   # Report validation endpoints
│   │   └── authRoutes.js         # Authentication endpoints
│   └── services/
│       ├── aiAnalyzer.js         # AI analysis orchestrator
│       ├── geminiService.js      # Gemini API integration
│       └── validationAgent.js    # Validation logic
│
├── index.html                    # App entry point
├── vite.config.js                # Vite configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project (for database & auth)
- A **Google Gemini API** key (for AI verification)

### Installation

```bash
# Clone the repository
git clone https://github.com/bunnybot1121/municipal-dashboard.git
cd municipal-dashboard

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Running the App

```bash
# Start both frontend (Vite) and backend (Express) concurrently
npm run dev
```

This starts:
- 🌐 **Frontend** at `http://localhost:5173`
- 🖥️ **Backend API** at `http://localhost:3001`

### Other Commands

```bash
npm run dev:frontend   # Start only the Vite dev server
npm run server         # Start only the Express backend
npm run build          # Build for production
npm run deploy         # Deploy to GitHub Pages
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues` | Fetch all issues |
| `POST` | `/api/issues` | Create a new issue |
| `PUT` | `/api/issues/:id` | Update an issue |
| `POST` | `/api/analysis/verify` | AI-verify an issue photo |
| `POST` | `/api/validation/validate` | Validate a citizen report |
| `POST` | `/api/auth/login` | Worker authentication |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Built with ❤️ for smarter cities
</p>
