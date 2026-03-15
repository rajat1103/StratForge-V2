import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { examsRouter } from './routes/exams'
import { topicsRouter } from './routes/topics'
import { plansRouter } from './routes/plans'
import { insightsRouter } from './routes/insights'
import { progressRouter } from './routes/progress'
import { assistantRouter } from './routes/assistant'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'StratForge API' }))

// Routes
app.use('/api/auth',      authRouter)
app.use('/api/exams',     examsRouter)
app.use('/api/topics',    topicsRouter)
app.use('/api/plans',     plansRouter)
app.use('/api/insights',  insightsRouter)
app.use('/api/progress',  progressRouter)
app.use('/api/assistant', assistantRouter)

app.listen(PORT, () => {
  console.log(`🚀 StratForge API running on http://localhost:${PORT}`)
})

export default app
