import { Router } from 'express'
// Migrate logic from: frontend/src/app/api/topics/route.ts
const router = Router()
router.get('/', (_, res) => res.json({ message: 'topics route placeholder' }))
export const topicsRouter = router
