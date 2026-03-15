import { Router } from 'express'
// Migrate logic from: frontend/src/app/api/plans/route.ts
const router = Router()
router.get('/', (_, res) => res.json({ message: 'plans route placeholder' }))
export const plansRouter = router
