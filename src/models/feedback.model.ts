import { randomUUID } from 'crypto';
import { getDbPool } from '../config/db';

export interface FeedbackRecord {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  comment: string;
  category?: string | null;
  mealId?: string | null;
  menuItemId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackInput {
  id?: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  comment: string;
  category?: string | null;
  mealId?: string | null;
  menuItemId?: string | null;
}

export interface FeedbackFilter {
  category?: string;
  userId?: string;
  mealId?: string;
  menuItemId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Initializes the feedback table in Neon PostgreSQL.
 */
export const initFeedbackTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      comment TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      meal_id UUID,
      menu_item_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB feedback table initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize feedback table:', error instanceof Error ? error.message : error);
  }
};

const mapFeedbackRow = (row: any): FeedbackRecord => ({
  id: row.id,
  userId: row.user_id ?? row.userId ?? null,
  userName: row.user_name ?? row.userName ?? null,
  userEmail: row.user_email ?? row.userEmail ?? null,
  comment: row.comment ?? row.message ?? '',
  category: row.category ?? null,
  mealId: row.meal_id ?? row.mealId ?? null,
  menuItemId: row.menu_item_id ?? row.menuItemId ?? null,
  createdAt: row.created_at ?? row.createdAt ?? null,
  updatedAt: row.updated_at ?? row.updatedAt ?? null,
});

/**
 * Creates a new feedback entry in Neon PostgreSQL.
 */
export const createFeedbackInDb = async (
  input: CreateFeedbackInput
): Promise<FeedbackRecord> => {
  const pool = getDbPool();
  const id = input.id || randomUUID();

  const query = `
    INSERT INTO feedback (
      id,
      user_id,
      user_name,
      user_email,
      comment,
      category,
      meal_id,
      menu_item_id
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'general'), $7, $8)
    RETURNING id, user_id, user_name, user_email, comment, category, meal_id, menu_item_id, created_at, updated_at
  `;

  const result = await pool.query(query, [
    id,
    input.userId || null,
    input.userName?.trim() || null,
    input.userEmail?.toLowerCase().trim() || null,
    input.comment.trim(),
    input.category?.trim() || 'general',
    input.mealId || null,
    input.menuItemId || null,
  ]);

  return mapFeedbackRow(result.rows[0]);
};

/**
 * Fetches all feedback records with optional filters.
 */
export const getAllFeedbacksFromDb = async (
  filters?: FeedbackFilter
): Promise<FeedbackRecord[]> => {
  const pool = getDbPool();
  let query = `
    SELECT 
      f.id,
      f.user_id,
      COALESCE(f.user_name, u.name) AS user_name,
      COALESCE(f.user_email, u.email) AS user_email,
      f.comment,
      f.category,
      f.meal_id,
      f.menu_item_id,
      f.created_at,
      f.updated_at
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.category) {
    params.push(filters.category.trim());
    query += ` AND LOWER(f.category) = LOWER($${params.length})`;
  }

  if (filters?.userId) {
    params.push(filters.userId);
    query += ` AND f.user_id = $${params.length}`;
  }

  if (filters?.mealId) {
    params.push(filters.mealId);
    query += ` AND f.meal_id = $${params.length}`;
  }

  if (filters?.menuItemId) {
    params.push(filters.menuItemId);
    query += ` AND f.menu_item_id = $${params.length}`;
  }

  query += ` ORDER BY f.created_at DESC`;

  if (filters?.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  if (filters?.offset) {
    params.push(filters.offset);
    query += ` OFFSET $${params.length}`;
  }

  const result = await pool.query(query, params);
  return result.rows.map(mapFeedbackRow);
};

/**
 * Fetches feedback statistics (total feedbacks).
 */
export const getFeedbackStatsFromDb = async (): Promise<{ totalFeedbacks: number }> => {
  const pool = getDbPool();
  const query = `SELECT COUNT(*)::int AS total FROM feedback`;
  const result = await pool.query(query);
  return {
    totalFeedbacks: Number(result.rows[0]?.total || 0),
  };
};

/**
 * Deletes a feedback entry by ID.
 */
export const deleteFeedbackFromDb = async (
  id: string,
  userId?: string,
  isAdmin: boolean = false
): Promise<boolean> => {
  const pool = getDbPool();
  let query = `DELETE FROM feedback WHERE id = $1`;
  const params: unknown[] = [id];

  if (!isAdmin && userId) {
    params.push(userId);
    query += ` AND user_id = $2`;
  }

  const result = await pool.query(query, params);
  return (result.rowCount ?? 0) > 0;
};
