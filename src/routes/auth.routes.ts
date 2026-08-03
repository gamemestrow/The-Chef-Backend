import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register - Register new Chef, Student, or Admin
router.post('/register', register);

// POST /api/auth/login - Log in and receive JWT token
router.post('/login', login);

// GET /api/auth/me - Get current logged-in user profile (Protected)
router.get('/me', authenticate, getMe);

export default router;
