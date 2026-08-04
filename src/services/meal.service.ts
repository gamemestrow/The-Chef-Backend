import {
  createBulkMealsInDb,
  findMealsWithPaginationInDb,
  findMealsByDateInDb,
} from '../models/meal.model';
import {
  CreateBulkMealsInput,
  SingleFoodInput,
  MealRecord,
  MealQueryParams,
  PaginatedMealsResponse,
  MealOfTheDay,
} from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export const getFormattedDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Service to process bulk food upload.
 * Parses input data, processes uploaded files, validates structure, and saves records to PostgreSQL.
 */
export const createBulkMealsService = async (
  rawBody: any,
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] },
  userId?: string
): Promise<MealRecord[]> => {
  const { date, mealTime, hostelId } = rawBody;

  // 1. Validate common metadata
  if (!date || typeof date !== 'string' || !date.trim()) {
    throw new AppError(400, 'Meal date is required (YYYY-MM-DD)');
  }
  if (!mealTime || typeof mealTime !== 'string' || !mealTime.trim()) {
    throw new AppError(400, 'Meal time is required (e.g., Breakfast, Lunch, Dinner)');
  }
  if (!hostelId || typeof hostelId !== 'string' || !hostelId.trim()) {
    throw new AppError(400, 'Hostel ID is required');
  }

  // 2. Parse foods array
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
    // Process form-encoded array notation (foods[0][name], foods[0][quantity], etc.)
    const foodMap: { [index: number]: Partial<SingleFoodInput> } = {};
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

  // 3. Process files map if uploaded via multipart/form-data
  const uploadedFilesList: Express.Multer.File[] = Array.isArray(files)
    ? files
    : files
    ? Object.values(files).flat()
    : [];

  const parsedFoods: SingleFoodInput[] = foodsArray.map((item, idx) => {
    let name = item?.name;
    let image = item?.image;
    let quantity = Number(item?.quantity || 1);

    // If an image file was uploaded for this food item index
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

    return {
      name: name.trim(),
      image: image.trim(),
      quantity,
    };
  });

  // 4. Construct input object for DB call
  const bulkInput: CreateBulkMealsInput = {
    date: date.trim(),
    mealTime: mealTime.trim(),
    hostelId: hostelId.trim(),
    foods: parsedFoods,
    createdBy: userId,
  };

  // 5. Execute DB bulk insertion
  return await createBulkMealsInDb(bulkInput);
};

/**
 * Service to fetch paginated, filtered, searched, and sorted meal history.
 */
export const getHistoryMealsService = async (
  queryParams: MealQueryParams
): Promise<PaginatedMealsResponse> => {
  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 10));

  const { records, total } = await findMealsWithPaginationInDb({
    ...queryParams,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1 && totalPages > 0;

  return {
    success: true,
    message: 'Meals retrieved successfully',
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
 * Service to get meals for a specific date (legacy / simplified view).
 */
export const getMealOfTheDayService = async (targetDate?: string): Promise<MealOfTheDay[]> => {
  const dateStr = targetDate || getFormattedDate();
  const records = await findMealsByDateInDb(dateStr);
  return records.map((record) => ({
    name: record.mealName || record.name,
    image: record.imageUrl || record.image,
    quantity: record.quantity,
  }));
};
