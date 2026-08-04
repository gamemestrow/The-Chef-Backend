import {
  createBulkChefMealsInDb,
  findChefMealsWithPaginationInDb,
  findChefMealByIdInDb,
  updateChefMealInDb,
  deleteChefMealInDb,
} from '../models/chef_meal.model';
import {
  CreateBulkChefMealsInput,
  SingleChefFoodInput,
  ChefMealRecord,
  ChefMealQueryParams,
} from '../types';
import { AppError } from '../middlewares/error.middleware';

export interface PaginatedChefMealsResponse {
  success: boolean;
  message: string;
  data: ChefMealRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Service to process bulk chef meal uploads.
 */
export const createBulkChefMealsService = async (
  rawBody: any,
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
  userId?: string
): Promise<ChefMealRecord[]> => {
  const { date, mealTime, hostelId } = rawBody;

  if (!date || typeof date !== 'string' || !date.trim()) {
    throw new AppError(400, 'Meal date is required (YYYY-MM-DD)');
  }
  if (!mealTime || typeof mealTime !== 'string' || !mealTime.trim()) {
    throw new AppError(400, 'Meal time is required (e.g., Breakfast, Lunch, Dinner)');
  }
  if (!hostelId || typeof hostelId !== 'string' || !hostelId.trim()) {
    throw new AppError(400, 'Hostel ID is required');
  }

  let foodsArray: any[] = [];
  if (typeof rawBody.foods === 'string') {
    try {
      foodsArray = JSON.parse(rawBody.foods);
    } catch {
      throw new AppError(400, 'Invalid JSON format for foods field');
    }
  } else if (Array.isArray(rawBody.foods)) {
    foodsArray = rawBody.foods;
  } else if (rawBody['foods[0][name]'] !== undefined) {
    const foodMap: { [index: number]: Partial<SingleChefFoodInput> } = {};
    Object.keys(rawBody).forEach((key) => {
      const match = key.match(/^foods\[(\d+)\]\[(\w+)\]$/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!foodMap[index]) foodMap[index] = {};
        (foodMap[index] as any)[field] = rawBody[key];
      }
    });
    foodsArray = Object.values(foodMap);
  }

  if (!Array.isArray(foodsArray) || foodsArray.length === 0) {
    throw new AppError(400, 'At least one food item must be provided in foods array');
  }

  const uploadedFilesList: Express.Multer.File[] = Array.isArray(files)
    ? files
    : files
      ? Object.values(files).flat()
      : [];

  const parsedFoods: SingleChefFoodInput[] = foodsArray.map((item, idx) => {
    let name = item?.name;
    let image = item?.image || item?.imageUrl;
    let quantity = Number(item?.quantity || 1);
    let rawUnit = (item?.unit || 'kg').toString().toLowerCase().trim();

    if (uploadedFilesList[idx]) {
      const file = uploadedFilesList[idx];
      image = `/uploads/${file.filename}`;
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, `Food item #${idx + 1} requires a valid name`);
    }

    if (!image || typeof image !== 'string' || !image.trim()) {
      throw new AppError(
        400,
        `Food item #${idx + 1} ("${name.trim()}") requires an image URL or image file`
      );
    }

    if (isNaN(quantity) || quantity < 1) {
      throw new AppError(400, `Food item #${idx + 1} quantity must be a positive integer`);
    }

    if (!['kg', 'pieces', 'liters', 'liter'].includes(rawUnit)) {
      throw new AppError(400, `Food item #${idx + 1} unit must be "kg", "pieces", or "liters"`);
    }

    const unit = rawUnit === 'liter' ? 'liters' : rawUnit;

    return {
      name: name.trim(),
      image: image.trim(),
      quantity,
      unit,
    };
  });

  const bulkInput: CreateBulkChefMealsInput = {
    date: date.trim(),
    mealTime: mealTime.trim(),
    hostelId: hostelId.trim(),
    foods: parsedFoods,
    createdBy: userId,
    status: 'submitted',
  };

  return await createBulkChefMealsInDb(bulkInput);
};

/**
 * Service to fetch paginated, filtered, searched, and sorted chef meal history.
 */
export const getChefHistoryMealsService = async (
  queryParams: ChefMealQueryParams
): Promise<PaginatedChefMealsResponse> => {
  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 10));

  const { records, total } = await findChefMealsWithPaginationInDb({
    ...queryParams,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1 && totalPages > 0;

  return {
    success: true,
    message: 'Chef meals retrieved successfully',
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrevious,
    },
  };
};

/**
 * Service to update a single chef_meals record.
 */
export const updateChefMealService = async (
  id: string,
  rawUpdates: any
): Promise<ChefMealRecord> => {
  const existing = await findChefMealByIdInDb(id);
  if (!existing) {
    throw new AppError(404, `Chef meal record with ID "${id}" not found`);
  }

  const updates: any = {};
  if (rawUpdates.foodName !== undefined) {
    if (!rawUpdates.foodName || typeof rawUpdates.foodName !== 'string' || !rawUpdates.foodName.trim()) {
      throw new AppError(400, 'Valid foodName string is required');
    }
    updates.foodName = rawUpdates.foodName.trim();
  }
  if (rawUpdates.quantity !== undefined) {
    const qty = Number(rawUpdates.quantity);
    if (isNaN(qty) || qty < 1) {
      throw new AppError(400, 'Quantity must be a positive integer');
    }
    updates.quantity = qty;
  }
  if (rawUpdates.unit !== undefined) {
    const u = (rawUpdates.unit || '').toString().toLowerCase().trim();
    if (!['kg', 'pieces', 'liters', 'liter'].includes(u)) {
      throw new AppError(400, 'Unit must be "kg", "pieces", or "liters"');
    }
    updates.unit = u === 'liter' ? 'liters' : u;
  }
  if (rawUpdates.imageUrl !== undefined) {
    updates.imageUrl = String(rawUpdates.imageUrl).trim();
  }
  if (rawUpdates.status !== undefined) {
    const s = String(rawUpdates.status).trim();
    if (!['draft', 'submitted', 'approved', 'rejected'].includes(s)) {
      throw new AppError(400, 'Status must be "draft", "submitted", "approved", or "rejected"');
    }
    updates.status = s;
  }

  const updatedRecord = await updateChefMealInDb(id, updates);
  if (!updatedRecord) {
    throw new AppError(500, 'Failed to update chef meal record');
  }
  return updatedRecord;
};

/**
 * Service to delete a single chef_meals record.
 */
export const deleteChefMealService = async (id: string): Promise<void> => {
  const existing = await findChefMealByIdInDb(id);
  if (!existing) {
    throw new AppError(404, `Chef meal record with ID "${id}" not found`);
  }
  const deleted = await deleteChefMealInDb(id);
  if (!deleted) {
    throw new AppError(500, 'Failed to delete chef meal record');
  }
};
