# StratForge 🚀

AI-Powered Exam Preparation Platform

## Project Structure

```
stratforge-v2/
├── frontend/       ← Next.js full-stack app (run this to use StratForge)
│   ├── src/
│   │   ├── app/          ← Pages + API routes
│   │   ├── components/   ← UI components
│   │   ├── lib/          ← Auth, AI, DB, utilities
│   │   └── types/        ← TypeScript types
│   ├── prisma/           ← Database schema + seed data
│   └── .env.example      ← Copy to .env and fill in your keys
│
└── backend/        ← Standalone Express API (future use only)
    └── README.md   ← Read this before using
```

## Quick Start (just use the frontend folder)

```bash
cd frontend
npm install
copy .env.example .env     # Windows
# OR
cp .env.example .env       # Mac/Linux

# Edit .env with your keys, then:
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

**Demo login:** `demo@stratforge.app` / `password123`

## Environment Variables (frontend/.env)

```env
DATABASE_URL="postgresql://..."      # from neon.tech (free)
ANTHROPIC_API_KEY="sk-ant-..."       # from console.anthropic.com
JWT_SECRET="any-random-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Deploy to Vercel

1. Push the `frontend` folder to GitHub
2. Import on vercel.com → set root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Custom JWT (jose)
- **AI:** Anthropic Claude (claude-sonnet-4)
- **State:** Zustand + TanStack Query
- **Charts:** Recharts
