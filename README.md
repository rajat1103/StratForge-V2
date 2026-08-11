# StratForge 🚀

**StratForge** is a full-stack, production-ready AI-powered exam preparation platform built with Next.js 14, TypeScript, Prisma ORM, PostgreSQL, and Groq (Meta Llama 3.3 70B).

---

## 🏗️ Project Architecture

```text
StratForge Web Application
├── Frontend UI (Next.js 14 App Router, React 18, Tailwind CSS, Recharts)
├── Backend API Routes (Serverless Next.js API Endpoints)
├── AI Service Layer (StratForge AI Service → Groq Cloud SDK)
└── Database Layer (PostgreSQL via Neon Tech + Prisma ORM)
```

### Directory Structure

```text
stratforge-v2/
├── frontend/                     ← Primary Full-Stack Application
│   ├── src/
│   │   ├── app/                 ← Next.js App Router Pages & API Routes
│   │   │   ├── api/             ← Auth, Exams, Topics, Plans, Progress, Sessions, Insights, Assistant
│   │   │   ├── analytics/       ← 30-Day Activity & 5-Dimension Radar Comparison
│   │   │   ├── assistant/       ← AI Tutor Chat Interface (Groq/Llama SSE Streaming)
│   │   │   ├── auth/            ← Login, Register, Onboarding
│   │   │   ├── dashboard/       ← Command Center Dashboard
│   │   │   ├── exam/            ← Exam List & Command Center Detail Pages
│   │   │   ├── focus/           ← Pomodoro & Deep Work Session Timer
│   │   │   └── planner/         ← Weekly Study Calendar & Task Manager
│   │   ├── components/          ← UI Components, Cards, Charts, Modals
│   │   ├── lib/                 ← AI Service, Auth JWT, Prisma Client, Utilities
│   │   └── types/               ← Core TypeScript Type Definitions
│   ├── prisma/                  ← Database Schema & Dynamic Seed Script
│   └── .env.example             ← Environment Variable Template
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your keys in `frontend/.env`:

```env
DATABASE_URL="postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require"
GROQ_API_KEY="gsk_..."
JWT_SECRET="ad086731bcc481dd421945ab985fa96dcbfe5974a4719b676f5ac13935ed37df"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed

```bash
npx prisma db push
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo Account Credentials:**
- **Email:** `demo@stratforge.app`
- **Password:** `password123`

---

## 🧠 AI Provider & Architecture

- **Provider:** Groq Cloud API (`groq-sdk@1.5.0`)
- **Model:** `llama-3.3-70b-versatile` (Meta Llama 3.3 70B, 131,072 token context window)
- **Service Layer:** `src/lib/ai/client.ts` abstracts all AI operations (streaming assistant chat, study plan generation, data-driven insights). Application routes call the service layer — zero direct coupling to provider SDKs in business logic.

---

## 📊 Features & Capabilities

- **Command Center Dashboard:** Real-time KPIs, weekly study progress, active exam deadlines, and topic heatmaps.
- **Exam & Topic Management:** CRUD operations for competitive, university, certification, and skill exams with custom color themes and checklist items.
- **AI Study Planner:** Automated plan generation matching topics and dates dynamically, with interactive task completion tracking.
- **Focus Timer:** Pomodoro & Deep Work timer recording both progress logs and study session metrics to PostgreSQL.
- **Analytics Studio:** 30-day study activity, confidence trends, session type breakdown, and a 5-dimension Radar Chart comparing exam performance.
- **AI Study Assistant:** Context-aware tutoring with server-sent events (SSE) streaming.
- **Data Isolation:** All database queries and AI prompts are strictly scoped to the authenticated `session.userId`.

---

## 🛠️ Production Build & Verification

Run verification suite:

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm run build
```

---

## 🚀 Deploy to Vercel

1. Push `frontend/` to GitHub.
2. Import project on [Vercel](https://vercel.com) and set Root Directory to `frontend`.
3. Configure `DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` in environment settings.
4. Deploy.
