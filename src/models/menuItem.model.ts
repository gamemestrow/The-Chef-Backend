import { getDbPool } from '../config/db';

export interface MenuItemRecord {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  discountPrice?: number | null;
  specialOffer?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: string | null;
  category?: string | null;
}

export interface MenuItemFilter {
  category?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export interface CreateMenuItemInput {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  discountPrice?: number;
  specialOffer?: string;
  categoryId?: string;
  category?: string;
}

/**
 * Initializes the MenuItem table in Neon PostgreSQL if it doesn't already exist.
 */
export const initMenuItemTable = async (): Promise<void> => {
  const pool = getDbPool();
  const query = `
    CREATE TABLE IF NOT EXISTS "MenuItem" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      "imageUrl" TEXT,
      "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
      "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
      "discountPrice" NUMERIC(10, 2),
      "specialOffer" TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "categoryId" VARCHAR(100),
      category VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS idx_menuitem_category ON "MenuItem"(category);
    CREATE INDEX IF NOT EXISTS idx_menuitem_category_id ON "MenuItem"("categoryId");
    CREATE INDEX IF NOT EXISTS idx_menuitem_is_available ON "MenuItem"("isAvailable");
    CREATE INDEX IF NOT EXISTS idx_menuitem_is_featured ON "MenuItem"("isFeatured");
  `;
  try {
    await pool.query(query);
    console.log('✅ Neon DB MenuItem table initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize MenuItem table:', error instanceof Error ? error.message : error);
  }
};

/**
 * Maps database row (handling both quoted camelCase and snake_case column names)
 * to a consistent MenuItemRecord.
 */
const mapMenuItemRow = (row: any): MenuItemRecord => ({
  id: row.id,
  title: String(row.title || row.name || ''),
  description: row.description ?? null,
  price: Number(row.price || 0),
  imageUrl: row.imageUrl ?? row.image_url ?? row.image ?? null,
  isAvailable: Boolean(row.isAvailable ?? row.is_available ?? true),
  isFeatured: Boolean(row.isFeatured ?? row.is_featured ?? false),
  discountPrice:
    row.discountPrice !== null && row.discountPrice !== undefined
      ? Number(row.discountPrice)
      : row.discount_price !== null && row.discount_price !== undefined
      ? Number(row.discount_price)
      : null,
  specialOffer: row.specialOffer ?? row.special_offer ?? null,
  createdAt: row.createdAt ?? row.created_at ?? row.CreatedAt ?? null,
  updatedAt: row.updatedAt ?? row.updated_at ?? null,
  categoryId: row.categoryId ?? row.category_id ?? null,
  category: row.category ?? null,
});

/**
 * Fetches all menu items from Neon PostgreSQL with optional filters.
 *
 * @param filters - Optional filters: category, categoryId, isAvailable, isFeatured, search
 * @returns Promise<MenuItemRecord[]>
 */
export const getAllMenuItemsFromDb = async (
  filters?: MenuItemFilter
): Promise<MenuItemRecord[]> => {
  const pool = getDbPool();

  let query = `
    SELECT 
      id,
      title,
      description,
      price::float AS price,
      COALESCE("imageUrl", image_url, image) AS "imageUrl",
      COALESCE("isAvailable", is_available, TRUE) AS "isAvailable",
      COALESCE("isFeatured", is_featured, FALSE) AS "isFeatured",
      COALESCE("discountPrice", discount_price)::float AS "discountPrice",
      COALESCE("specialOffer", special_offer) AS "specialOffer",
      COALESCE("createdAt", created_at, CURRENT_TIMESTAMP) AS "createdAt",
      COALESCE("updatedAt", updated_at, CURRENT_TIMESTAMP) AS "updatedAt",
      COALESCE("categoryId", category_id) AS "categoryId",
      category
    FROM "MenuItem"
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.category) {
    params.push(filters.category.trim());
    query += ` AND LOWER(category) = LOWER($${params.length})`;
  }

  if (filters?.categoryId) {
    params.push(filters.categoryId.trim());
    query += ` AND ("categoryId" = $${params.length} OR category_id = $${params.length})`;
  }

  if (filters?.isAvailable !== undefined) {
    params.push(filters.isAvailable);
    query += ` AND (COALESCE("isAvailable", is_available) = $${params.length})`;
  }

  if (filters?.isFeatured !== undefined) {
    params.push(filters.isFeatured);
    query += ` AND (COALESCE("isFeatured", is_featured) = $${params.length})`;
  }

  if (filters?.search) {
    params.push(`%${filters.search.trim()}%`);
    query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  query += ` ORDER BY "isFeatured" DESC, category ASC, title ASC`;

  try {
    const result = await pool.query(query, params);
    return result.rows.map(mapMenuItemRow);
  } catch (error) {
    // Fallback if table name is lowercase menu_items
    try {
      const fallbackQuery = query.replace('FROM "MenuItem"', 'FROM menu_items');
      const fallbackResult = await pool.query(fallbackQuery, params);
      return fallbackResult.rows.map(mapMenuItemRow);
    } catch {
      throw error;
    }
  }
};

/**
 * Fetches a single menu item by ID from MenuItem table.
 *
 * @param id - UUID of the menu item
 * @returns Promise<MenuItemRecord | null>
 */
export const getMenuItemByIdFromDb = async (
  id: string
): Promise<MenuItemRecord | null> => {
  const pool = getDbPool();
  const query = `
    SELECT 
      id,
      title,
      description,
      price::float AS price,
      COALESCE("imageUrl", image_url, image) AS "imageUrl",
      COALESCE("isAvailable", is_available, TRUE) AS "isAvailable",
      COALESCE("isFeatured", is_featured, FALSE) AS "isFeatured",
      COALESCE("discountPrice", discount_price)::float AS "discountPrice",
      COALESCE("specialOffer", special_offer) AS "specialOffer",
      COALESCE("createdAt", created_at, CURRENT_TIMESTAMP) AS "createdAt",
      COALESCE("updatedAt", updated_at, CURRENT_TIMESTAMP) AS "updatedAt",
      COALESCE("categoryId", category_id) AS "categoryId",
      category
    FROM "MenuItem"
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows[0] ? mapMenuItemRow(result.rows[0]) : null;
  } catch (error) {
    // Fallback if table name is lowercase menu_items
    try {
      const fallbackQuery = query.replace('FROM "MenuItem"', 'FROM menu_items');
      const fallbackResult = await pool.query(fallbackQuery, [id]);
      return fallbackResult.rows[0] ? mapMenuItemRow(fallbackResult.rows[0]) : null;
    } catch {
      throw error;
    }
  }
};

/**
 * Creates a new menu item in Neon PostgreSQL.
 */
export const createMenuItemInDb = async (
  item: CreateMenuItemInput
): Promise<MenuItemRecord> => {
  const pool = getDbPool();
  const query = `
    INSERT INTO "MenuItem" (
      title,
      description,
      price,
      "imageUrl",
      "isAvailable",
      "isFeatured",
      "discountPrice",
      "specialOffer",
      "categoryId",
      category
    )
    VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), COALESCE($6, FALSE), $7, $8, $9, $10)
    RETURNING 
      id,
      title,
      description,
      price::float AS price,
      "imageUrl",
      "isAvailable",
      "isFeatured",
      "discountPrice"::float AS "discountPrice",
      "specialOffer",
      "createdAt",
      "updatedAt",
      "categoryId",
      category
  `;

  const result = await pool.query(query, [
    item.title.trim(),
    item.description?.trim() || null,
    item.price,
    item.imageUrl?.trim() || null,
    item.isAvailable ?? true,
    item.isFeatured ?? false,
    item.discountPrice ?? null,
    item.specialOffer?.trim() || null,
    item.categoryId?.trim() || null,
    item.category?.trim() || null,
  ]);

  return mapMenuItemRow(result.rows[0]);
};
