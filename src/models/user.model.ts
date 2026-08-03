import { getDbPool } from '../config/db';
import { UserRole } from '../types';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<UserRecord, 'password_hash'>;

/**
 * Initializes the users table in Neon PostgreSQL if it doesn't already exist.
 */
export const initUserTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'chef', 'student')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB users table initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize users table:', error instanceof Error ? error.message : error);
  }
};

/**
 * Inserts a new user into Neon PostgreSQL.
 */
export const createUserInDb = async (user: {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}): Promise<SafeUser> => {
  const pool = getDbPool();
  const query = `
    INSERT INTO users (email, password_hash, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, role, created_at, updated_at
  `;

  const result = await pool.query(query, [
    user.email.toLowerCase().trim(),
    user.passwordHash,
    user.name.trim(),
    user.role,
  ]);

  return result.rows[0];
};

/**
 * Finds a user by email, including the password hash for login verification.
 */
export const findUserByEmailInDb = async (email: string): Promise<UserRecord | null> => {
  const pool = getDbPool();
  const query = `
    SELECT id, email, password_hash, name, role, created_at, updated_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;

  const result = await pool.query(query, [email.trim()]);
  return result.rows[0] || null;
};

/**
 * Finds a user by ID (excluding password hash).
 */
export const findUserByIdInDb = async (id: string): Promise<SafeUser | null> => {
  const pool = getDbPool();
  const query = `
    SELECT id, email, name, role, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Retrieves all users (for Admin authorization).
 */
export const getAllUsersFromDb = async (role?: UserRole): Promise<SafeUser[]> => {
  const pool = getDbPool();
  let query = `
    SELECT id, email, name, role, created_at, updated_at
    FROM users
  `;
  const params: unknown[] = [];

  if (role) {
    query += ` WHERE role = $1`;
    params.push(role);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};
