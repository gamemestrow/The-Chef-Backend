import { getDbPool } from '../config/db';
import {
  ChefMealRecord,
  CreateBulkChefMealsInput,
  SingleChefFoodInput,
  ChefMealQueryParams,
} from '../types';

/**
 * Initializes the chef_meals table and indexes in Neon PostgreSQL if it doesn't already exist.
 */
export const initChefMealTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS chef_meals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chef_id UUID REFERENCES users(id) ON DELETE SET NULL,
      hostel_id VARCHAR(100) NOT NULL,
      meal_time VARCHAR(50) NOT NULL,
      meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
      food_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit VARCHAR(20) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'pieces', 'liters')),
      image_url TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
      rejection_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chef_meals_date_hostel ON chef_meals(meal_date DESC, hostel_id);
    CREATE INDEX IF NOT EXISTS idx_chef_meals_chef_id ON chef_meals(chef_id);
    CREATE INDEX IF NOT EXISTS idx_chef_meals_status ON chef_meals(status);
    CREATE INDEX IF NOT EXISTS idx_chef_meals_created_at ON chef_meals(created_at DESC);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB chef_meals table and indexes initialized.');
  } catch (error) {
    console.error(
      '❌ Failed to initialize chef_meals table:',
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * Formats database row into a standardized ChefMealRecord object.
 */
const formatChefMealRow = (row: any): ChefMealRecord => {
  const rawDate = row.meal_date;
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
    chefId: row.chef_id ? String(row.chef_id) : null,
    hostelId: String(row.hostel_id),
    mealTime: String(row.meal_time),
    mealDate,
    foodName: String(row.food_name),
    quantity: Number(row.quantity || 1),
    unit: String(row.unit || 'kg').toLowerCase(),
    imageUrl: String(row.image_url),
    status: row.status || 'submitted',
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
  };
};

/**
 * Inserts multiple chef meal records in a single database query.
 */
export const createBulkChefMealsInDb = async (
  input: CreateBulkChefMealsInput
): Promise<ChefMealRecord[]> => {
  const pool = getDbPool();
  const { date, mealTime, hostelId, foods, createdBy, status } = input;

  if (!foods || foods.length === 0) {
    return [];
  }

  const isUuid = (str?: string | null) =>
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let validChefId: string | null = null;
  if (createdBy && isUuid(createdBy)) {
    try {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [createdBy]);
      if (userCheck.rows.length > 0) {
        validChefId = createdBy;
      }
    } catch {
      validChefId = null;
    }
  }

  const mealStatus = status || 'submitted';
  const valueRows: string[] = [];
  const queryParams: any[] = [];
  let paramIdx = 1;

  foods.forEach((food: SingleChefFoodInput) => {
    const foodName = food.name.trim();
    const imageUrl = food.image.trim();
    const quantity = Math.max(1, Math.floor(food.quantity));
    const rawUnit = (food.unit || 'kg').toLowerCase().trim();
    const unit = ['kg', 'pieces', 'liters'].includes(rawUnit) ? rawUnit : 'kg';

    valueRows.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8})`
    );

    queryParams.push(
      validChefId,
      hostelId.trim(),
      mealTime.trim(),
      date.trim(),
      foodName,
      quantity,
      unit,
      imageUrl,
      mealStatus
    );

    paramIdx += 9;
  });

  const query = `
    INSERT INTO chef_meals (
      chef_id,
      hostel_id,
      meal_time,
      meal_date,
      food_name,
      quantity,
      unit,
      image_url,
      status
    )
    VALUES ${valueRows.join(', ')}
    RETURNING id, chef_id, hostel_id, meal_time, meal_date, food_name, quantity, unit, image_url, status, rejection_reason, created_at, updated_at
  `;

  const result = await pool.query(query, queryParams);
  return result.rows.map(formatChefMealRow);
};

/**
 * Queries chef_meals from Neon PostgreSQL with server-side filtering, searching, sorting, and pagination.
 */
export const findChefMealsWithPaginationInDb = async (
  queryParams: ChefMealQueryParams
): Promise<{ records: ChefMealRecord[]; total: number }> => {
  const pool = getDbPool();

  const page = Math.max(1, Number(queryParams.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryParams.limit) || 10));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (queryParams.search && queryParams.search.trim()) {
    whereClauses.push(`(food_name ILIKE $${paramIdx})`);
    values.push(`%${queryParams.search.trim()}%`);
    paramIdx++;
  }

  if (queryParams.mealTime && queryParams.mealTime.trim()) {
    whereClauses.push(`(meal_time ILIKE $${paramIdx})`);
    values.push(queryParams.mealTime.trim());
    paramIdx++;
  }

  if (queryParams.hostelId && queryParams.hostelId.trim()) {
    whereClauses.push(`(hostel_id = $${paramIdx})`);
    values.push(queryParams.hostelId.trim());
    paramIdx++;
  }

  if (queryParams.date && queryParams.date.trim()) {
    whereClauses.push(`(meal_date::date = $${paramIdx}::date)`);
    values.push(queryParams.date.trim());
    paramIdx++;
  }

  if (queryParams.status && queryParams.status.trim()) {
    whereClauses.push(`(status = $${paramIdx})`);
    values.push(queryParams.status.trim());
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*)::integer AS total FROM chef_meals ${whereSql}`;
  const countResult = await pool.query(countQuery, values);
  const total = Number(countResult.rows[0]?.total || 0);

  if (total === 0) {
    return { records: [], total: 0 };
  }

  const allowedSortColumns: Record<string, string> = {
    created_at: 'created_at',
    meal_date: 'meal_date',
    food_name: 'food_name',
    meal_time: 'meal_time',
    hostel_id: 'hostel_id',
    quantity: 'quantity',
    status: 'status',
  };

  const requestedSortBy = (queryParams.sortBy || 'created_at').toLowerCase();
  const sortColumn = allowedSortColumns[requestedSortBy] || 'created_at';
  const sortOrder = (queryParams.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const dataQuery = `
    SELECT 
      id,
      chef_id,
      hostel_id,
      meal_time,
      meal_date,
      food_name,
      quantity,
      unit,
      image_url,
      status,
      rejection_reason,
      created_at,
      updated_at
    FROM chef_meals
    ${whereSql}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataValues = [...values, limit, offset];
  const dataResult = await pool.query(dataQuery, dataValues);

  return {
    records: dataResult.rows.map(formatChefMealRow),
    total,
  };
};

/**
 * Finds a single chef_meals record by ID.
 */
export const findChefMealByIdInDb = async (id: string): Promise<ChefMealRecord | null> => {
  const pool = getDbPool();
  const query = `
    SELECT id, chef_id, hostel_id, meal_time, meal_date, food_name, quantity, unit, image_url, status, rejection_reason, created_at, updated_at
    FROM chef_meals
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;
  return formatChefMealRow(result.rows[0]);
};

/**
 * Updates a chef_meals record by ID.
 */
export const updateChefMealInDb = async (
  id: string,
  updates: Partial<{
    foodName: string;
    quantity: number;
    unit: string;
    imageUrl: string;
    status: string;
    rejectionReason: string;
  }>
): Promise<ChefMealRecord | null> => {
  const pool = getDbPool();
  const fields: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (updates.foodName !== undefined) {
    fields.push(`food_name = $${paramIdx}`);
    values.push(updates.foodName.trim());
    paramIdx++;
  }
  if (updates.quantity !== undefined) {
    fields.push(`quantity = $${paramIdx}`);
    values.push(Math.max(1, Math.floor(updates.quantity)));
    paramIdx++;
  }
  if (updates.unit !== undefined) {
    fields.push(`unit = $${paramIdx}`);
    values.push(updates.unit.trim().toLowerCase());
    paramIdx++;
  }
  if (updates.imageUrl !== undefined) {
    fields.push(`image_url = $${paramIdx}`);
    values.push(updates.imageUrl.trim());
    paramIdx++;
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIdx}`);
    values.push(updates.status.trim());
    paramIdx++;
  }
  if (updates.rejectionReason !== undefined) {
    fields.push(`rejection_reason = $${paramIdx}`);
    values.push(updates.rejectionReason);
    paramIdx++;
  }

  if (fields.length === 0) {
    return await findChefMealByIdInDb(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE chef_meals
    SET ${fields.join(', ')}
    WHERE id = $${paramIdx}
    RETURNING id, chef_id, hostel_id, meal_time, meal_date, food_name, quantity, unit, image_url, status, rejection_reason, created_at, updated_at
  `;

  const result = await pool.query(query, values);
  if (result.rows.length === 0) return null;
  return formatChefMealRow(result.rows[0]);
};

/**
 * Deletes a chef_meals record by ID.
 */
export const deleteChefMealInDb = async (id: string): Promise<boolean> => {
  const pool = getDbPool();
  const query = `DELETE FROM chef_meals WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
