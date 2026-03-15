import { Router } from 'express'
// Migrate logic from: frontend/src/app/api/progress/route.ts
const router = Router()
router.get('/', (_, res) => res.json({ message: 'progress route placeholder' }))
export const progressRouter = router
