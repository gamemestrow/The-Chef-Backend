import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register - Register new Chef, Student, or Admin
router.post('/register', register);

// POST /api/auth/login - Log in and receive JWT token
router.post('/login', login);

// GET /api/auth/me - Get current logged-in user profile (Protected)
router.get('/me', authenticate, getMe);

// POST /api/auth/change-password - Change user password (Protected)
router.post('/change-password', authenticate, changePassword);

// PUT /api/auth/change-password - Alias for changing password (Protected)
router.put('/change-password', authenticate, changePassword);

export default router;
