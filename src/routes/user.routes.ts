import { Router } from 'express';
import { getProfile, getAllUsers } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/users/profile (All authenticated users)
router.get('/profile', authenticate, getProfile);

// GET /api/users (Admin only)
router.get('/', authenticate, authorizeRoles(UserRole.ADMIN), getAllUsers);

export default router;
