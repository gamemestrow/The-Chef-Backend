import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { findUserByIdInDb, getAllUsersFromDb } from '../models/user.model';
import { AppError } from '../middlewares/error.middleware';

/**
 * Get Profile of Authenticated User
 * Endpoint: GET /api/users/profile
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await findUserByIdInDb(req.user.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Users from Neon DB (Restricted to Admin)
 * Endpoint: GET /api/users
 */
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleQuery = req.query.role as UserRole | undefined;
    const users = await getAllUsersFromDb(roleQuery);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully from database',
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
