import { Router } from 'express'
// Migrate logic from: frontend/src/app/api/auth/route.ts
const router = Router()
router.get('/', (_, res) => res.json({ message: 'auth route placeholder' }))
export const authRouter = router
