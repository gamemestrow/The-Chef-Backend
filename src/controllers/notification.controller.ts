import { Request, Response, NextFunction } from 'express';
import {
  createNotificationInDb,
  getStudentNotificationsFromDb,
  getNotificationByIdFromDb,
  markNotificationAsReadInDb,
  markAllNotificationsAsReadInDb,
  deleteNotificationFromDb,
} from '../models/notification.model';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * Create a new student notification (Chef & Admin)
 * Endpoint: POST /api/student-notifications
 * Body: { title, message, type, studentId, datetime }
 */
export const createStudentNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, message, body, type, studentId, datetime, dateTime } = req.body;

    const finalTitle = title ? String(title).trim() : '';
    if (!finalTitle) {
      throw new AppError(400, 'Notification title is required');
    }

    const finalMessage = message || body;
    if (!finalMessage || typeof finalMessage !== 'string' || !finalMessage.trim()) {
      throw new AppError(400, 'Notification message is required');
    }

    const finalDatetime = datetime || dateTime || new Date().toISOString();

    const notification = await createNotificationInDb({
      studentId: studentId ? String(studentId).trim() : null,
      title: finalTitle,
      message: finalMessage.trim(),
      type: type ? String(type).trim() : 'general',
      datetime: finalDatetime,
    });

    res.status(201).json({
      success: true,
      message: 'Student notification created successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notifications for current student (or by query)
 * Endpoint: GET /api/student-notifications
 * Query Params: ?isRead=false&type=meal_alert&limit=20&page=1
 */
export const getStudentNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isRead, read, type, limit, page, studentId } = req.query;

    // If student is logged in, use their ID; otherwise if chef/admin, allow query parameter
    const effectiveStudentId =
      req.user?.role === UserRole.STUDENT
        ? req.user.id
        : studentId
        ? String(studentId)
        : req.user?.id;

    const isReadFilter =
      isRead !== undefined
        ? isRead === 'true' || isRead === '1'
        : read !== undefined
        ? read === 'true' || read === '1'
        : undefined;

    const parsedLimit = limit ? Math.min(Number(limit), 100) : 50;
    const parsedPage = page ? Math.max(Number(page), 1) : 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const notifications = await getStudentNotificationsFromDb(effectiveStudentId, {
      isRead: isReadFilter,
      type: type ? String(type) : undefined,
      limit: parsedLimit,
      offset,
    });

    res.status(200).json({
      success: true,
      message: 'Student notifications retrieved successfully',
      count: notifications.length,
      page: parsedPage,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single notification by ID
 * Endpoint: GET /api/student-notifications/:id
 */
export const getNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Notification ID is required');
    }

    const notification = await getNotificationByIdFromDb(id);

    if (!notification) {
      throw new AppError(404, `Notification with ID '${id}' not found`);
    }

    res.status(200).json({
      success: true,
      message: 'Notification retrieved successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * Endpoint: PATCH /api/student-notifications/:id/read
 */
export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Notification ID is required');
    }

    const studentId = req.user?.role === UserRole.STUDENT ? req.user.id : undefined;
    const updated = await markNotificationAsReadInDb(id, studentId);

    if (!updated) {
      throw new AppError(404, 'Notification not found or already marked as read');
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current student
 * Endpoint: PATCH /api/student-notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }

    const updatedCount = await markAllNotificationsAsReadInDb(req.user.id);

    res.status(200).json({
      success: true,
      message: `${updatedCount} notifications marked as read successfully`,
      count: updatedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * Endpoint: DELETE /api/student-notifications/:id
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Notification ID is required');
    }

    const isAdminOrChef =
      req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CHEF;
    const studentId = req.user?.id;

    const deleted = await deleteNotificationFromDb(id, studentId, isAdminOrChef);

    if (!deleted) {
      throw new AppError(404, 'Notification not found or you are not authorized to delete it');
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
