import { getDbPool } from '../config/db';
import { MealOfTheDay } from '../types';

/**
 * Utility helper to format a Date into 'YYYY-MM-DD' string.
 *
 * @param date - Optional date instance (defaults to current date)
 * @returns Date string in 'YYYY-MM-DD' format (e.g. '2026-08-03')
 */
export const getFormattedDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetches the Meal(s) of the Day from the database by date.
 *
 * - Automatically defaults to today's date ('YYYY-MM-DD') if not specified.
 * - Queries the database for meals scheduled for that specific calendar date.
 * - Returns only { name, image, quantity }.
 * - Returns an empty array if no meals are found.
 * - Handles database errors gracefully.
 *
 * @param targetDate - Optional date string ('YYYY-MM-DD') or Date object (defaults to today)
 * @returns Promise<MealOfTheDay[]>
 */
export const getMealOfTheDay = async (
  targetDate?: string | Date
): Promise<MealOfTheDay[]> => {
  const formattedDate =
    typeof targetDate === 'string'
      ? targetDate
      : targetDate instanceof Date
      ? getFormattedDate(targetDate)
      : getFormattedDate();

  try {
    const pool = getDbPool();

    // Query meals scheduled for the specified date
    const query = `
      SELECT 
        COALESCE(name, meal_name) AS name,
        COALESCE(image, image_url, meal_image) AS image,
        COALESCE(quantity, 0)::integer AS quantity
      FROM meals
      WHERE date::date = $1::date
         OR meal_date::date = $1::date
         OR scheduled_date::date = $1::date
    `;

    const result = await pool.query(query, [formattedDate]);

    // If no meals found for the date, return an empty array
    if (!result.rows || result.rows.length === 0) {
      return [];
    }

    // Return only the specified fields
    return result.rows.map((row) => ({
      name: String(row.name || ''),
      image: String(row.image || ''),
      quantity: Number(row.quantity || 0),
    }));
  } catch (error) {
    console.error(
      `[MealService] Error fetching meal of the day for date "${formattedDate}":`,
      error instanceof Error ? error.message : error
    );
    throw new Error(
      `Failed to fetch meal of the day: ${
        error instanceof Error ? error.message : 'Database query error'
      }`
    );
  }
};
