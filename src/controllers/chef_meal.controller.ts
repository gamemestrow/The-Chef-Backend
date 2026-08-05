import { Request, Response, NextFunction } from 'express';
import {
  createBulkChefMealsService,
  getChefHistoryMealsService,
  updateChefMealService,
  deleteChefMealService,
} from '../services/chef_meal.service';
import { AuthenticatedRequest, ChefMealQueryParams, ChefMealStatus } from '../types';

/**
 * Controller to upload multiple chef food items together in a single request.
 * Endpoint: POST /api/chef/meals
 * Accepts: multipart/form-data
 */
export const uploadChefMeal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const createdRecords = await createBulkChefMealsService(
      req.body,
      req.files as Express.Multer.File[],
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: `${createdRecords.length} food item(s) uploaded successfully to chef_meals`,
      data: createdRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch paginated chef meal history with server-side filtering, searching, and sorting in PostgreSQL.
 * Endpoint: GET /api/chef/meals
 * Query Params: page, limit, search, mealTime, hostelId, date, status, sortBy, sortOrder
 */
export const getChefMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryParams: ChefMealQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      search: req.query.search ? (req.query.search as string) : undefined,
      mealTime: req.query.mealTime ? (req.query.mealTime as string) : undefined,
      hostelId: req.query.hostelId ? (req.query.hostelId as string) : undefined,
      date: req.query.date ? (req.query.date as string) : undefined,
      status: req.query.status ? (req.query.status as ChefMealStatus) : undefined,
      sortBy: req.query.sortBy ? (req.query.sortBy as string) : undefined,
      sortOrder: req.query.sortOrder
        ? ((req.query.sortOrder as string).toUpperCase() as 'ASC' | 'DESC')
        : undefined,
    };

    const response = await getChefHistoryMealsService(queryParams);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update an existing chef meal entry in chef_meals table.
 * Endpoint: PUT /api/chef/meals/:id
 */
export const updateChefMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedRecord = await updateChefMealService(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Chef meal updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete an existing chef meal entry from chef_meals table.
 * Endpoint: DELETE /api/chef/meals/:id
 */
export const deleteChefMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteChefMealService(id);
    res.status(200).json({
      success: true,
      message: `Chef meal record "${id}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
