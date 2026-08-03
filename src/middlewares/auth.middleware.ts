import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from './error.middleware';
import { verifyJwtToken } from '../utils/jwt';

/**
 * Authentication Middleware:
 * Extracts Bearer token, verifies signature, and attaches user info to req.user.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token required. Format: Bearer <token>'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError(401, 'Invalid authorization token format'));
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired authentication token'));
  }
};

/**
 * Optional Authentication Middleware:
 * If Bearer token is provided, decodes and attaches user to req.user; otherwise proceeds.
 */
export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    // If token invalid in optional mode, continue as guest
  }

  next();
};

/**
 * Role-Based Authorization Middleware:
 * Restricts endpoint access to specific user roles (e.g. 'admin', 'chef', 'student').
 */
export const authorizeRoles = (...roles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized: User is not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          `Forbidden: You do not have permission. Required role(s): [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};
