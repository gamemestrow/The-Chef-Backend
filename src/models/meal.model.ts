import { getDbPool } from '../config/db';
import { MealOfTheDay } from '../types';

export interface MealRecord {
  id: string;
  name: string;
  image: string;
  quantity: number;
  date: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMealInput {
  name: string;
  image: string;
  quantity: number;
  date?: string;
  createdBy?: string;
}

/**
 * Initializes the meals table in Neon PostgreSQL if it doesn't already exist.
 */
export const initMealTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS meals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      image TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB meals table initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize meals table:', error instanceof Error ? error.message : error);
  }
};

/**
 * Inserts a new meal record into Neon PostgreSQL.
 */
export const createMealInDb = async (meal: CreateMealInput): Promise<MealRecord> => {
  const pool = getDbPool();
  const query = `
    INSERT INTO meals (name, image, quantity, date, created_by)
    VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5)
    RETURNING id, name, image, quantity, date, created_by, created_at, updated_at
  `;

  const result = await pool.query(query, [
    meal.name.trim(),
    meal.image.trim(),
    meal.quantity,
    meal.date || null,
    meal.createdBy || null,
  ]);

  return result.rows[0];
};

/**
 * Queries meals by date from Neon PostgreSQL.
 */
export const findMealsByDateInDb = async (date: string): Promise<MealOfTheDay[]> => {
  const pool = getDbPool();
  const query = `
    SELECT 
      name,
      image,
      quantity
    FROM meals
    WHERE date::date = $1::date
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [date]);
  return result.rows.map((row) => ({
    name: String(row.name || ''),
    image: String(row.image || ''),
    quantity: Number(row.quantity || 0),
  }));
};

/**
 * Queries a single meal by ID.
 */
export const findMealByIdInDb = async (id: string): Promise<MealRecord | null> => {
  const pool = getDbPool();
  const query = `
    SELECT id, name, image, quantity, date, created_by, created_at, updated_at
    FROM meals
    WHERE id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
