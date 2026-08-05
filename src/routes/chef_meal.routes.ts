import { Router } from 'express';
import {
  uploadChefMeal,
  getChefMeals,
  updateChefMeal,
  deleteChefMeal,
} from '../controllers/chef_meal.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/chef/meals - Fetch paginated chef meals history from chef_meals table
router.get('/', getChefMeals);

// GET /api/chef/meals/today - Alias route for fetching today's chef meals
router.get('/today', getChefMeals);

// POST /api/chef/meals - Upload food items to chef_meals table (Restricted to Chef and Admin)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMiddleware.any(),
  uploadChefMeal
);

// POST /api/chef/meals/upload - Alias route for uploading chef meals
router.post(
  '/upload',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  uploadMiddleware.any(),
  uploadChefMeal
);

// PUT /api/chef/meals/:id - Update single meal in chef_meals table
router.put(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  updateChefMeal
);

// DELETE /api/chef/meals/:id - Delete single meal from chef_meals table
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  deleteChefMeal
);

export default router;
