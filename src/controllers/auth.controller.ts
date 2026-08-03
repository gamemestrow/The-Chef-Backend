import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !role) {
      throw new AppError(400, 'Email and Role (chef, student, admin) are required');
    }

    if (!Object.values(UserRole).includes(role)) {
      throw new AppError(400, `Invalid role. Allowed roles: ${Object.values(UserRole).join(', ')}`);
    }

    // Save to Neon DB logic here
    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} registered successfully`,
      data: {
        id: `usr_${Date.now()}`,
        email,
        name: name || '',
        role,
        token: 'sample_jwt_token',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    // Verify user in Neon DB
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: 'usr_sample',
        email,
        role: UserRole.STUDENT,
        token: 'sample_jwt_token',
      },
    });
  } catch (error) {
    next(error);
  }
};
