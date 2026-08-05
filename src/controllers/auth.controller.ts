import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole, AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { createUserInDb, findUserByEmailInDb, findUserByIdInDb } from '../models/user.model';
import { signJwtToken } from '../utils/jwt';

/**
 * Register a new user in Neon PostgreSQL with Role (Admin, Chef, or Student).
 * Endpoint: POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new AppError(400, 'Name, email, password, and role are all required');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters long');
    }

    const assignedRole = role.toLowerCase() as UserRole;
    if (!Object.values(UserRole).includes(assignedRole)) {
      throw new AppError(
        400,
        `Invalid role. Allowed roles: ${Object.values(UserRole).join(', ')}`
      );
    }

    // Check if user already exists in Neon database
    const existingUser = await findUserByEmailInDb(email);
    if (existingUser) {
      throw new AppError(409, 'A user with this email already exists');
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into Neon DB
    const newUser = await createUserInDb({
      email,
      passwordHash,
      name,
      role: assignedRole,
    });

    // Generate JWT token
    const token = signJwtToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: `${assignedRole.toUpperCase()} registered successfully in Neon Database`,
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user with Neon PostgreSQL and return a signed JWT.
 * Endpoint: POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    // Find user in Neon DB
    const user = await findUserByEmailInDb(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user details from Neon DB.
 * Endpoint: GET /api/auth/me
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Not authenticated');
    }

    const user = await findUserByIdInDb(req.user.id);
    if (!user) {
      throw new AppError(404, 'User not found in database');
    }

    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
