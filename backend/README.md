# StratForge Backend

Standalone Express.js API server — for future use when you want to separate
the backend from the Next.js frontend for scaling.

## Currently

The `frontend` folder contains a **full-stack Next.js app** that handles both
the UI and the API routes (`/src/app/api/*`). You do NOT need this backend
folder to run StratForge — it is here for future use only.

## When to use this

Switch to this Express backend when you want to:
- Host the API on a separate server (e.g. Railway, Render, Fly.io)
- Add WebSocket support for real-time features
- Scale the API independently from the frontend

## Setup (future use)

```bash
cd backend
npm install
cp .env.example .env   # add DATABASE_URL and ANTHROPIC_API_KEY
npm run dev            # runs on http://localhost:4000
```
