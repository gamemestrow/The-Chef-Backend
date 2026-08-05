import { Router } from 'express';
import { uploadMeal, getMeals, getTodayMeals } from '../controllers/meal.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/meals/today - Fetch today's scheduled meals
router.get('/today', getTodayMeals);

// GET /api/meals - Fetch paginated meals history with filters/search/sorting
router.get('/', getMeals);

// POST /api/meals - Upload all food items together in a single request (Restricted to Chef and Admin)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMiddleware.any(),
  uploadMeal
);

// POST /api/meals/upload - Alias route for uploading meals
router.post(
  '/upload',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMiddleware.any(),
  uploadMeal
);

export default router;
