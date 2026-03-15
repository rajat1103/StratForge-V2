import { Router } from 'express'
// Migrate logic from: frontend/src/app/api/exams/route.ts
const router = Router()
router.get('/', (_, res) => res.json({ message: 'exams route placeholder' }))
export const examsRouter = router
