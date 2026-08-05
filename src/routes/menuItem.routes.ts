import { Router } from 'express';
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
} from '../controllers/menuItem.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/menu-items - Fetch all menu items
router.get('/', getMenuItems);

// GET /api/menu-items/:id - Fetch single menu item by ID
router.get('/:id', getMenuItemById);

// POST /api/menu-items - Create new menu item (Chef and Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  createMenuItem
);

export default router;
