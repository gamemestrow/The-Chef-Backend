import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from './error.middleware';

// Middleware to verify authentication
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token required'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError(401, 'Invalid authorization token'));
  }

  // Set user payload on request (can be connected with jwt.verify)
  req.user = {
    id: 'user_123',
    email: 'user@example.com',
    role: UserRole.STUDENT,
  };

  next();
};

// Middleware to restrict access based on user role (admin, chef, student)
export const authorizeRoles = (...roles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized: Please log in'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, `Forbidden: Requires [${roles.join(', ')}] role`));
    }

    next();
  };
};
