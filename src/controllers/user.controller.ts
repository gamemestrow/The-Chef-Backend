import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

// Get Current User Profile (Chef, Student, or Admin)
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user?.id || 'usr_123',
        email: user?.email || 'user@example.com',
        role: user?.role || UserRole.STUDENT,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin only: Get all users
export const getAllUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: [
        { id: '1', name: 'Chef Mario', role: UserRole.CHEF },
        { id: '2', name: 'Student Alex', role: UserRole.STUDENT },
        { id: '3', name: 'Admin Root', role: UserRole.ADMIN },
      ],
    });
  } catch (error) {
    next(error);
  }
};
