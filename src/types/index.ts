import { Request } from 'express';

// Application Roles
export enum UserRole {
  ADMIN = 'admin',
  CHEF = 'chef',
  STUDENT = 'student',
}

// Authenticated User Payload attached to Request
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

// Custom Request with Authenticated User
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Standard API Response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | null;
  meta?: Record<string, unknown>;
}

// Meal of the Day interface
export interface MealOfTheDay {
  name: string;
  image: string;
  quantity: number;
}

