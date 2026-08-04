import { Request, Response, NextFunction } from 'express';
import {
  createBulkMealsService,
  getHistoryMealsService,
  getMealOfTheDayService,
} from '../services/meal.service';
import { AuthenticatedRequest, MealQueryParams } from '../types';

/**
 * Controller to upload multiple food items together in a single request.
 * Endpoint: POST /api/meals
 * Accepts: multipart/form-data
 */
export const uploadMeal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const createdRecords = await createBulkMealsService(
      req.body,
      req.files as Express.Multer.File[],
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: `${createdRecords.length} food item(s) uploaded successfully`,
      data: createdRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch paginated meal history with server-side filtering, searching, and sorting in PostgreSQL.
 * Endpoint: GET /api/meals
 * Query Params: page, limit, search, mealTime, hostelId, date, sortBy, sortOrder
 */
export const getMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryParams: MealQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      search: req.query.search ? (req.query.search as string) : undefined,
      mealTime: req.query.mealTime ? (req.query.mealTime as string) : undefined,
      hostelId: req.query.hostelId ? (req.query.hostelId as string) : undefined,
      date: req.query.date ? (req.query.date as string) : undefined,
      sortBy: req.query.sortBy ? (req.query.sortBy as string) : undefined,
      sortOrder: req.query.sortOrder
        ? ((req.query.sortOrder as string).toUpperCase() as 'ASC' | 'DESC')
        : undefined,
    };

    const response = await getHistoryMealsService(queryParams);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch Meal of the Day by date (legacy/simplified route).
 * Endpoint: GET /api/meals/today
 */
export const getTodayMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedDate = (req.query.date as string) || undefined;
    const meals = await getMealOfTheDayService(requestedDate);

    res.status(200).json({
      success: true,
      message: 'Meals retrieved successfully',
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
};
