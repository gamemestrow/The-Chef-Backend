import { Request, Response, NextFunction } from 'express';
import {
  createFeedbackInDb,
  getAllFeedbacksFromDb,
  getFeedbackStatsFromDb,
  deleteFeedbackFromDb,
} from '../models/feedback.model';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * Submit feedback (Students, Chefs, Admins or Guests)
 * Endpoint: POST /api/feedback
 * Body: { comment, category, mealId, menuItemId, userName, userEmail }
 */
export const submitFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      comment,
      message,
      category,
      mealId,
      menuItemId,
      userName,
      userEmail,
    } = req.body;

    const finalComment = comment || message;
    if (!finalComment || typeof finalComment !== 'string' || !finalComment.trim()) {
      throw new AppError(400, 'Feedback comment is required');
    }

    const feedback = await createFeedbackInDb({
      userId: req.user?.id || null,
      userName: req.user?.name || userName || null,
      userEmail: req.user?.email || userEmail || null,
      comment: finalComment.trim(),
      category: category ? String(category).trim() : 'general',
      mealId: mealId ? String(mealId).trim() : null,
      menuItemId: menuItemId ? String(menuItemId).trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been submitted successfully.',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedbacks with optional filters
 * Endpoint: GET /api/feedback
 * Query Params: ?category=meal&mealId=...&limit=20&page=1
 */
export const getFeedbacks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, userId, mealId, menuItemId, limit, page } = req.query;

    const parsedLimit = limit ? Math.min(Number(limit), 100) : 50;
    const parsedPage = page ? Math.max(Number(page), 1) : 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const feedbacks = await getAllFeedbacksFromDb({
      category: category ? String(category) : undefined,
      userId: userId ? String(userId) : undefined,
      mealId: mealId ? String(mealId) : undefined,
      menuItemId: menuItemId ? String(menuItemId) : undefined,
      limit: parsedLimit,
      offset,
    });

    res.status(200).json({
      success: true,
      message: 'Feedbacks retrieved successfully',
      count: feedbacks.length,
      page: parsedPage,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overall feedback statistics
 * Endpoint: GET /api/feedback/stats
 */
export const getFeedbackStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await getFeedbackStatsFromDb();

    res.status(200).json({
      success: true,
      message: 'Feedback statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user's submitted feedbacks
 * Endpoint: GET /api/feedback/my
 */
export const getMyFeedbacks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Not authenticated');
    }

    const feedbacks = await getAllFeedbacksFromDb({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: 'My feedbacks retrieved successfully',
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete feedback (Admin or feedback owner)
 * Endpoint: DELETE /api/feedback/:id
 */
export const deleteFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Feedback ID is required');
    }

    const isAdmin = req.user?.role === UserRole.ADMIN;
    const userId = req.user?.id;

    const deleted = await deleteFeedbackFromDb(id, userId, isAdmin);

    if (!deleted) {
      throw new AppError(404, 'Feedback not found or you are not authorized to delete it');
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
