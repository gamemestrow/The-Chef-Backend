import { Router } from 'express';
import {
  createStudentNotification,
  getStudentNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notification.controller';
import {
  authenticate,
  authorizeRoles,
} from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/student-notifications - Get student's notifications with datetime (Protected)
router.get('/', authenticate, getStudentNotifications);

// PATCH /api/student-notifications/read-all - Mark all notifications as read (Protected)
router.patch('/read-all', authenticate, markAllNotificationsAsRead);

// GET /api/student-notifications/:id - Get notification by ID (Protected)
router.get('/:id', authenticate, getNotificationById);

// POST /api/student-notifications - Create new notification (Chef & Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.CHEF, UserRole.ADMIN),
  createStudentNotification
);

// PATCH /api/student-notifications/:id/read - Mark notification as read (Protected)
router.patch('/:id/read', authenticate, markNotificationAsRead);

// DELETE /api/student-notifications/:id - Delete notification (Protected)
router.delete('/:id', authenticate, deleteNotification);

export default router;
