import { Router } from 'express';
import { uploadMeal, getTodayMeals } from '../controllers/meal.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/meals/today - Fetch today's scheduled meals
router.get('/today', getTodayMeals);

// GET /api/meals - Fetch meals with optional ?date=YYYY-MM-DD
router.get('/', getTodayMeals);

// POST /api/meals - Upload meal (Restricted to Chef and Admin)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMeal
);

// POST /api/meals/upload - Alias route for uploading meal
router.post(
  '/upload',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMeal
);

export default router;
