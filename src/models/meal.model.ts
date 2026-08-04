import { getDbPool } from '../config/db';
import { MealRecord, CreateBulkMealsInput, MealQueryParams } from '../types';

/**
 * Initializes the meals table and indexes in Neon PostgreSQL if it doesn't already exist,
 * and migrates existing tables to include new standardized columns.
 */
export const initMealTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS meals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hostel_id VARCHAR(255),
      meal_time VARCHAR(100),
      meal_name VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE meals ADD COLUMN IF NOT EXISTS hostel_id VARCHAR(255);
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_time VARCHAR(100);
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_name VARCHAR(255);
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS image TEXT;
    ALTER TABLE meals ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

    CREATE INDEX IF NOT EXISTS idx_meals_meal_date ON meals(meal_date);
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_meals_meal_time ON meals(meal_time);
    CREATE INDEX IF NOT EXISTS idx_meals_hostel_id ON meals(hostel_id);
    CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at DESC);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB meals table and indexes initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize meals table:', error instanceof Error ? error.message : error);
  }
};

/**
 * Formats database row into a standardized MealRecord object.
 */

const formatMealRow = (row: any): MealRecord => {
  const mealName = String(row.meal_name || row.name || '');
  const imageUrl = String(row.image_url || row.image || '');
  const rawDate = row.meal_date || row.date;
  let mealDate: string;
  if (typeof rawDate === 'string') {
    mealDate = rawDate.split('T')[0];
  } else if (rawDate && typeof rawDate === 'object' && rawDate instanceof Date) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    mealDate = `${year}-${month}-${day}`;
  } else {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    mealDate = `${year}-${month}-${day}`;
  }

  return {
    id: String(row.id),
    hostelId: row.hostel_id ? String(row.hostel_id) : null,
    mealTime: row.meal_time ? String(row.meal_time) : null,
    mealName,
    name: mealName,
    imageUrl,
    image: imageUrl,
    quantity: Number(row.quantity || 1),
    mealDate,
    date: mealDate,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
  };
};

/**
 * Inserts multiple food records in a single database transaction / query.
 */
export const createBulkMealsInDb = async (input: CreateBulkMealsInput): Promise<MealRecord[]> => {
  const pool = getDbPool();
  const { date, mealTime, hostelId, foods, createdBy } = input;

  if (!foods || foods.length === 0) {
    return [];
  }

  const isUuid = (str?: string | null) =>
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let validCreatedBy: string | null = null;
  if (createdBy && isUuid(createdBy)) {
    try {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [createdBy]);
      if (userCheck.rows.length > 0) {
        validCreatedBy = createdBy;
      }
    } catch {
      validCreatedBy = null;
    }
  }

  // Build parameterized values string for multi-row INSERT
  const valueRows: string[] = [];
  const queryParams: any[] = [];
  let paramIdx = 1;

  foods.forEach((food) => {
    const foodName = food.name.trim();
    const foodImage = food.image.trim();
    const foodQty = Math.max(1, Math.floor(food.quantity));

    valueRows.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9})`
    );

    queryParams.push(
      hostelId.trim(),
      mealTime.trim(),
      foodName,
      foodName,
      foodImage,
      foodImage,
      foodQty,
      date.trim(),
      date.trim(),
      validCreatedBy
    );

    paramIdx += 10;
  });

  const query = `
    INSERT INTO meals (
      hostel_id,
      meal_time,
      meal_name,
      name,
      image_url,
      image,
      quantity,
      meal_date,
      date,
      created_by
    )
    VALUES ${valueRows.join(', ')}
    RETURNING id, hostel_id, meal_time, meal_name, name, image_url, image, quantity, meal_date, date, created_by, created_at, updated_at
  `;

  const result = await pool.query(query, queryParams);
  return result.rows.map(formatMealRow);
};

/**
 * Queries meals from Neon PostgreSQL with server-side filtering, searching, sorting, and pagination.
 */
export const findMealsWithPaginationInDb = async (
  queryParams: MealQueryParams
): Promise<{ records: MealRecord[]; total: number }> => {
  const pool = getDbPool();

  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 10));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  // Search filter (searches meal_name or name)
  if (queryParams.search && queryParams.search.trim()) {
    whereClauses.push(`(COALESCE(meal_name, name) ILIKE $${paramIdx})`);
    values.push(`%${queryParams.search.trim()}%`);
    paramIdx++;
  }

  // Meal time filter
  if (queryParams.mealTime && queryParams.mealTime.trim()) {
    whereClauses.push(`(meal_time ILIKE $${paramIdx})`);
    values.push(queryParams.mealTime.trim());
    paramIdx++;
  }

  // Hostel filter
  if (queryParams.hostelId && queryParams.hostelId.trim()) {
    whereClauses.push(`(hostel_id = $${paramIdx})`);
    values.push(queryParams.hostelId.trim());
    paramIdx++;
  }

  // Date filter
  if (queryParams.date && queryParams.date.trim()) {
    whereClauses.push(`(COALESCE(meal_date, date)::date = $${paramIdx}::date)`);
    values.push(queryParams.date.trim());
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching records in PostgreSQL
  const countQuery = `SELECT COUNT(*)::integer AS total FROM meals ${whereSql}`;
  const countResult = await pool.query(countQuery, values);
  const total = Number(countResult.rows[0]?.total || 0);

  if (total === 0) {
    return { records: [], total: 0 };
  }

  // Determine sort column and direction safely
  const allowedSortColumns: Record<string, string> = {
    created_at: 'created_at',
    meal_date: 'COALESCE(meal_date, date)',
    date: 'COALESCE(meal_date, date)',
    meal_name: 'COALESCE(meal_name, name)',
    name: 'COALESCE(meal_name, name)',
    meal_time: 'meal_time',
    hostel_id: 'hostel_id',
    quantity: 'quantity',
  };

  const requestedSortBy = (queryParams.sortBy || 'created_at').toLowerCase();
  const sortColumn = allowedSortColumns[requestedSortBy] || 'created_at';
  const sortOrder = (queryParams.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Perform paginated query in PostgreSQL
  const dataQuery = `
    SELECT 
      id,
      hostel_id,
      meal_time,
      COALESCE(meal_name, name) AS meal_name,
      name,
      COALESCE(image_url, image) AS image_url,
      image,
      quantity,
      COALESCE(meal_date, date) AS meal_date,
      date,
      created_by,
      created_at,
      updated_at
    FROM meals
    ${whereSql}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataValues = [...values, limit, offset];
  const dataResult = await pool.query(dataQuery, dataValues);

  return {
    records: dataResult.rows.map(formatMealRow),
    total,
  };
};

/**
 * Legacy support for getting meals of the day by date.
 */
export const findMealsByDateInDb = async (targetDate: string): Promise<MealRecord[]> => {
  const result = await findMealsWithPaginationInDb({
    date: targetDate,
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });
  return result.records;
};
