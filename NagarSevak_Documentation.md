# 🏛️ NagarSevak AI — Comprehensive System Walkthrough

This document serves as a complete technical and functional walkthrough of **NagarSevak AI**. It details the architecture, file structures, database logic, and how data moves through the application to help team members quickly understand every aspect of the project.

---

## 1. 🌟 System Overview

**NagarSevak AI** is an AI-powered municipal operations platform designed to bridge the gap between citizens, workers, and administrators. It solves real-world urban management problems by using AI to verify citizen reports, real-time mapping for situation awareness, and automated dispatching for city workers.

There are three primary actors in the system:
1. **The Citizen**: Reports civic issues (potholes, garbage, broken streetlights) from a mobile-optimized view.
2. **The Worker**: Receives assignments, travels to the location, resolves the issue, and uploads proof of completion.
3. **The Administrator**: Views the city-wide dashboard, manages zones, assigns staff, and leverages AI analytics for policy making.

---

## 2. 🏗️ Technology Choices & Detailed Analysis

The application adopts a modern, decoupled architecture. Below is a deep dive into the programming languages, frameworks, and libraries used, and the strategic reasons behind their selection.

### 💻 Core Languages
1. **JavaScript (ES6+) / JSX**: 
   * **Where it's used**: Across the entire stack (Frontend React, Backend Node.js, and utility scripts).
   * **Why it was chosen**: Using a single language across the stack (Isomorphic JavaScript) dramatically reduces context switching for developers. It allows for seamless sharing of data structures (like JSON) between the Express backend and the React frontend. JSX allows declarative UI rendering, blending HTML-like syntax directly within JavaScript logic for rapid component creation.
2. **SQL (PostgreSQL)**:
   * **Where it's used**: Database schemas, Row Level Security (RLS) policies, and custom database functions.
   * **Why it was chosen**: SQL provides robust relational data guarantees. The system requires strict relational mapping (e.g., tying a `worker_id` to a specific `task` and linking that to a civic `issue`), which SQL handles natively through foreign keys and cascading updates.

### 🎨 Frontend Framework & Libraries
1. **React.js (v18)**:
   * **Why it was chosen**: React's component-based architecture is essential for a large multi-portal dashboard. UI elements like the Sidebar, Notifications, and Map needed to be modular and reactive to state changes. React 18's concurrent rendering ensures the UI remains highly responsive even when fetching massive datasets (like hundreds of civic issues).
2. **Vite**:
   * **Why it was chosen**: Adopted as the bundler over Create React App (CRA) or Webpack. Vite uses native ES modules to serve code instantly, reducing local server cold-starts to milliseconds. Its significantly faster Hot Module Replacement (HMR) massively accelerated the UI development and testing cycle.
3. **Tailwind CSS & Material UI (MUI)**:
   * **Why they were chosen**: **Tailwind** is used for rapid, utility-first styling (e.g., flexbox layouts, spacing, responsive design) directly in the markup, avoiding massive, unmaintainable `.css` stylesheets. **MUI** was integrated specifically for its complex, accessible pre-built components (like Modal dialogs, Data Tables, and Icons) that guarantee a premium enterprise look out-of-the-box.
4. **Leaflet & React-Leaflet**:
   * **Why it was chosen**: The core of the Command Center revolves around geospatial awareness (knowing exactly *where* a citizen reported an issue). Leaflet is an open-source, highly performant mapping library, and `react-leaflet` seamlessly wraps it into the React component lifecycle, avoiding the immense costs associated with enterprise map solutions like Google Maps API.

### ⚙️ Backend & Infrastructure
1. **Node.js & Express.js**:
   * **Why it was chosen**: The system mandated a secure middleware layer. Since the database handles most direct CRUD operations, the Node server is utilized almost exclusively as an "AI Agent Server." Express is unopinionated, fast, and perfect for spinning up the endpoints (e.g., `/api/analyze`) required to securely communicate with external LLM APIs without leaking API keys to the client browser.
2. **Supabase (PostgreSQL Backend-as-a-Service)**:
   * **Why it was chosen**: Historically, building a REST API meant writing boilerplate code for every `GET`, `POST`, `PUT`, and `DELETE` operation. Supabase auto-generates secure APIs directly from the PostgreSQL schema, handles Authentication (JWTs), and inherently offers **WebSockets for Real-time subscriptions**. This is the technological backbone that allows the Admin dashboard to update *instantly* when a worker resolves a task, without resorting to inefficient server polling.

### 🤖 Artificial Intelligence
1. **Google Gemini Vision API**:
   * **Why it was chosen**: To prevent spam in the Citizen portal (e.g., citizens uploading unrelated images just to test the system), we required advanced Vision capabilities. Gemini offers state-of-the-art multi-modal analysis. The Express backend receives an image representation, feeds it to Gemini, and prompts the model to classify the severity and validity of the civic issue. It outputs a structured JSON confidence score, saving human administrators thousands of hours in manual visual verification.

---

## 3. 📂 Core File Structure

The workspace is organized into a frontend React codebase and a dedicated folder for backend API services.

```text
nagar/
├── public/                 # Static assets
├── src/                    # Frontend React Source
│   ├── citizen/            # Contains all Citizen WebApp components (CitizenApp.jsx, modals, etc.)
│   ├── components/         # Reusable/Shared UI components (Sidebar, AppBars)
│   ├── contexts/           # AuthContext.jsx (Supabase authentication & global state)
│   ├── pages/              # Admin and Worker Page components (Dashboard, Staff, Analytics, etc.)
│   ├── services/           # Supabase API handlers (fetch issues, create tasks, auth)
│   ├── utils/              # Helper functions (e.g., markdownScheduleParser.js)
│   └── App.jsx             # Main Router configuring layouts based on User Roles
│
├── server/                 # Express.js Backend Server
│   ├── routes/             # API routes (analysisRoutes.js, validationRoutes.js)
│   ├── services/           # AI Services (geminiService.js for photo verification)
│   └── server.js           # Express App Entry Point
│
├── supabase sql files      # E.g., COMPLETE_RLS_FIX.sql, worker_portal_setup.sql (Schema design)
└── vite.config.js          # Vite Bundler config
```

---

## 4. 💾 Database Topology (Supabase)

The entire state is maintained in PostgreSQL. Key tables include:

### 1. `profiles`
*   **Purpose**: Manages authorizations and basic user information.
*   **Columns**: `id` (uuid, mapping to auth.users), `role` ('admin', 'worker', 'citizen'), `username`, `status` ('available', 'busy'), `sector`.
*   **RLS Security**: Workers can view their own profile; Admins can view/update all.

### 2. `issues` (Citizen Reports)
*   **Purpose**: Stores citizen-submitted data.
*   **Columns**: `id`, `title`, `description`, `category`, `lat` & `lng`, `image_url`, `status` ('pending', 'in-progress', 'resolved').
*   **AI Extensions**: Includes columns for `ai_confidence_score` and `ai_status` updated by the Gemini backend.

### 3. `tasks` (Worker Schedules)
*   **Purpose**: Action items assigned to municipal staff.
*   **Columns**: `id`, `issue_id` (Foreign Key), `worker_id` (Foreign Key), `status`, `scheduled_date`.

### 4. `notifications`
*   **Purpose**: Real-time push alerts.
*   **Mechanism**: Driven by Supabase Real-time functionality. Any insert triggers an active WebSocket ping to the connected device.

---

## 5. 🔄 Processing Workflows (How Things Work)

Below are the exact execution paths for the three most vital features.

### Flow A: The Citizen Reporting Pipeline
1.  **UI Interaction**: The user accesses the PWA (Citizen Portal) at `/citizen.html`.
2.  **Geolocation**: The browser captures GPS coordinates natively (`watchPosition`).
3.  **Submission**: User fills out `ReportingModal.jsx` and clicks submit.
4.  **Database Insert**: React natively calls `supabase.from('issues').insert(...)`.
5.  **AI Trigger**: 
    *   Simultaneously, the frontend pings the Express Server at `/api/analyze`.
    *   The backend pulls the image and sends it to **Gemini Vision AI**.
    *   Gemini determines if the image legitimately depicts the claimed issue (e.g., verifying a pothole).
    *   The DB is updated with an `ai_status` of "Verified" or "Suspicious".

### Flow B: Admin Command Center Visualization
1.  **Session Init**: The Administrator logs into the central dashboard (`/`).
2.  **Auth Guard**: `<ProtectedRoute>` inside `App.jsx` verifies the `user.role === 'admin'`.
3.  **Data Fetch**: `DashboardLayout` mounts. The app subscribes to the Supabase `issues` and `tasks` tables.
4.  **Display**:
    *   **Map**: The issues are overlaid onto Leaflet (`EnhancedMap.jsx`).
    *   **Metrics**: `Recharts` dynamically generates charts determining high-incident sectors (`Analytics.jsx`).
5.  **Dispatch**: Admin drags and drops an issue to a worker via the `TaskScheduler`. This executes an `update` on the `tasks` table affecting the worker's schedule.

### Flow C: Worker Execution
1.  **Worker Sign-in**: The municipal field worker logs into `/worker` on their mobile device. 
2.  **RLS Implementation**: Data is fetched safely. Row Level Security guarantees the query `SELECT * FROM tasks` *automatically* filters down to `where worker_id = auth.uid()`.
3.  **Action**: The worker arrives at the job site, completes the task, and clicks "Mark Resolved".
4.  **System Sync**: 
    *   Task status changes to `resolved`.
    *   The associated `issues` row cascades to `resolved`.
    *   A notification is pushed to the citizen indicating their report was fixed!

---

## 6. 🛡️ Security & Scalability Features

*   **Row-Level Security (RLS)**: By routing everything through Supabase, no custom backend endpoints had to be written for data fetching. Security is baked directly into the DB. For example, `COMPLETE_RLS_FIX.sql` contains rules to ensure citizens cannot delete tasks, and workers can only update their own status.
*   **Next-Gen Bundling**: Vite handles local development (`npm run dev:frontend`) efficiently, hot-reloading changes in milliseconds.

## 7. 🚀 Local Development Checklist

To run the application locally or contribute:
1.  **Dependencies**: Run `npm install` in root, and `npm install` in `server/`.
2.  **Environment Variables**: Ensure `.env` is populated with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
3.  **Execution**: `npm run dev` starts both the Vite Frontend and the Node Backend concurrently