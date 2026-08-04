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

// Single Food Item Input for Bulk Upload
export interface SingleFoodInput {
  name: string;
  image: string;
  quantity: number;
  unit: string;
}

// Create Bulk Meals Input
export interface CreateBulkMealsInput {
  date: string;
  mealTime: string;
  hostelId: string;
  foods: SingleFoodInput[];
  createdBy?: string;
}

// Meal Record as stored and returned from Database
export interface MealRecord {
  id: string;
  hostelId: string | null;
  mealTime: string | null;
  mealName: string;
  name: string;
  imageUrl: string;
  image: string;
  quantity: number;
  unit: string;
  mealDate: string;
  date: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Legacy / Simple Meal of the Day interface
export interface MealOfTheDay {
  name: string;
  image: string;
  quantity: number;
  unit: string;
}

// Query parameters for History API
export interface MealQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  mealTime?: string;
  hostelId?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

// Pagination Metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Paginated API Response structure
export interface PaginatedMealsResponse {
  success: boolean;
  message: string;
  data: MealRecord[];
  pagination: PaginationMeta;
}
