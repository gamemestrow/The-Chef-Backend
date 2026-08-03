import { Request, Response, NextFunction } from 'express';
import { getMealOfTheDay, getFormattedDate } from '../services/meal.service';
import { createMealInDb } from '../models/meal.model';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * Controller to upload a new meal to the database.
 * Requires: name, image, quantity. Optional: date (defaults to today YYYY-MM-DD).
 * Endpoint: POST /api/meals
 */
export const uploadMeal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, image, quantity, date } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, 'Meal name is required');
    }

    if (!image || typeof image !== 'string' || !image.trim()) {
      throw new AppError(400, 'Meal image is required (URL or image data)');
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      throw new AppError(400, 'Meal quantity must be a valid positive integer');
    }

    // Target date formatting
    const scheduledDate = date ? String(date).trim() : getFormattedDate();

    // Insert meal into Neon PostgreSQL
    const newMeal = await createMealInDb({
      name: name.trim(),
      image: image.trim(),
      quantity: parsedQuantity,
      date: scheduledDate,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Meal uploaded successfully to database',
      data: newMeal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch Meal of the Day by date
 * Endpoint: GET /api/meals/today or GET /api/meals?date=YYYY-MM-DD
 */
export const getTodayMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedDate = (req.query.date as string) || undefined;
    const targetDate = requestedDate || getFormattedDate();

    const meals = await getMealOfTheDay(requestedDate);

    res.status(200).json({
      success: true,
      message: `Meals for ${targetDate} retrieved successfully`,
      date: targetDate,
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
};
