import { randomUUID } from 'crypto';
import { getDbPool } from '../config/db';

export interface StudentNotificationRecord {
  id: string;
  studentId?: string | null;
  title: string;
  message: string;
  type: string;
  datetime: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationInput {
  id?: string;
  studentId?: string | null;
  title: string;
  message: string;
  type?: string;
  datetime?: string | Date;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Initializes the student_notifications table in Neon PostgreSQL.
 */
export const initNotificationTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS student_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(100) NOT NULL DEFAULT 'general',
      datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id ON student_notifications(student_id);
    CREATE INDEX IF NOT EXISTS idx_student_notifications_datetime ON student_notifications(datetime);
    CREATE INDEX IF NOT EXISTS idx_student_notifications_is_read ON student_notifications(is_read);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB student_notifications table initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize student_notifications table:', error instanceof Error ? error.message : error);
  }
};

const mapNotificationRow = (row: any): StudentNotificationRecord => ({
  id: row.id,
  studentId: row.student_id ?? row.studentId ?? null,
  title: String(row.title || ''),
  message: String(row.message || ''),
  type: String(row.type || 'general'),
  datetime: row.datetime ? new Date(row.datetime).toISOString() : new Date().toISOString(),
  isRead: Boolean(row.is_read ?? row.isRead ?? false),
  createdAt: row.created_at ?? row.createdAt ?? null,
  updatedAt: row.updated_at ?? row.updatedAt ?? null,
});

/**
 * Creates a new student notification in Neon PostgreSQL.
 */
export const createNotificationInDb = async (
  input: CreateNotificationInput
): Promise<StudentNotificationRecord> => {
  const pool = getDbPool();
  const id = input.id || randomUUID();
  const finalDatetime = input.datetime ? new Date(input.datetime).toISOString() : new Date().toISOString();

  const query = `
    INSERT INTO student_notifications (
      id,
      student_id,
      title,
      message,
      type,
      datetime,
      is_read
    )
    VALUES ($1, $2, $3, $4, COALESCE($5, 'general'), $6::timestamptz, FALSE)
    RETURNING id, student_id, title, message, type, datetime, is_read, created_at, updated_at
  `;

  const result = await pool.query(query, [
    id,
    input.studentId || null,
    input.title.trim(),
    input.message.trim(),
    input.type?.trim() || 'general',
    finalDatetime,
  ]);

  return mapNotificationRow(result.rows[0]);
};

/**
 * Fetches notifications for a student (direct notifications + broadcast notifications).
 */
export const getStudentNotificationsFromDb = async (
  studentId?: string,
  filters?: NotificationFilter
): Promise<StudentNotificationRecord[]> => {
  const pool = getDbPool();
  let query = `
    SELECT id, student_id, title, message, type, datetime, is_read, created_at, updated_at
    FROM student_notifications
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (studentId) {
    params.push(studentId);
    query += ` AND (student_id = $${params.length} OR student_id IS NULL)`;
  }

  if (filters?.isRead !== undefined) {
    params.push(filters.isRead);
    query += ` AND is_read = $${params.length}`;
  }

  if (filters?.type) {
    params.push(filters.type.trim());
    query += ` AND LOWER(type) = LOWER($${params.length})`;
  }

  query += ` ORDER BY datetime DESC`;

  if (filters?.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  if (filters?.offset) {
    params.push(filters.offset);
    query += ` OFFSET $${params.length}`;
  }

  const result = await pool.query(query, params);
  return result.rows.map(mapNotificationRow);
};

/**
 * Fetches a single notification by ID.
 */
export const getNotificationByIdFromDb = async (
  id: string
): Promise<StudentNotificationRecord | null> => {
  const pool = getDbPool();
  const query = `
    SELECT id, student_id, title, message, type, datetime, is_read, created_at, updated_at
    FROM student_notifications
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] ? mapNotificationRow(result.rows[0]) : null;
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsReadInDb = async (
  id: string,
  studentId?: string
): Promise<boolean> => {
  const pool = getDbPool();
  let query = `
    UPDATE student_notifications
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;
  const params: unknown[] = [id];

  if (studentId) {
    params.push(studentId);
    query += ` AND (student_id = $2 OR student_id IS NULL)`;
  }

  const result = await pool.query(query, params);
  return (result.rowCount ?? 0) > 0;
};

/**
 * Marks all notifications for a student as read.
 */
export const markAllNotificationsAsReadInDb = async (
  studentId: string
): Promise<number> => {
  const pool = getDbPool();
  const query = `
    UPDATE student_notifications
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE (student_id = $1 OR student_id IS NULL) AND is_read = FALSE
  `;
  const result = await pool.query(query, [studentId]);
  return result.rowCount ?? 0;
};

/**
 * Deletes a notification by ID.
 */
export const deleteNotificationFromDb = async (
  id: string,
  studentId?: string,
  isAdminOrChef: boolean = false
): Promise<boolean> => {
  const pool = getDbPool();
  let query = `DELETE FROM student_notifications WHERE id = $1`;
  const params: unknown[] = [id];

  if (!isAdminOrChef && studentId) {
    params.push(studentId);
    query += ` AND student_id = $2`;
  }

  const result = await pool.query(query, params);
  return (result.rowCount ?? 0) > 0;
};
