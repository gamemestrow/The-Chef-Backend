import { Request, Response, NextFunction } from 'express';
import {
  getAllMenuItemsFromDb,
  getMenuItemByIdFromDb,
  createMenuItemInDb,
} from '../models/menuItem.model';
import { AppError } from '../middlewares/error.middleware';
import { AuthenticatedRequest } from '../types';

/**
 * Fetch all menu items from MenuItem table
 * Endpoint: GET /api/menu-items
 * Query Params: ?category=Pizza&categoryId=cat123&isAvailable=true&isFeatured=true&search=burger
 */
export const getMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, categoryId, isAvailable, available, isFeatured, featured, search } = req.query;

    const availableFilter =
      isAvailable !== undefined
        ? isAvailable === 'true' || isAvailable === '1'
        : available !== undefined
        ? available === 'true' || available === '1'
        : undefined;

    const featuredFilter =
      isFeatured !== undefined
        ? isFeatured === 'true' || isFeatured === '1'
        : featured !== undefined
        ? featured === 'true' || featured === '1'
        : undefined;

    const items = await getAllMenuItemsFromDb({
      category: category ? String(category) : undefined,
      categoryId: categoryId ? String(categoryId) : undefined,
      isAvailable: availableFilter,
      isFeatured: featuredFilter,
      search: search ? String(search) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a single menu item by ID from MenuItem table
 * Endpoint: GET /api/menu-items/:id
 */
export const getMenuItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Menu item ID is required');
    }

    const item = await getMenuItemByIdFromDb(id);

    if (!item) {
      throw new AppError(404, `Menu item with ID '${id}' not found`);
    }

    res.status(200).json({
      success: true,
      message: 'Menu item retrieved successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new menu item
 * Endpoint: POST /api/menu-items
 * Body: { title, description, price, imageUrl, isAvailable, isFeatured, discountPrice, specialOffer, categoryId, category }
 */
export const createMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      name,
      description,
      price,
      imageUrl,
      image,
      isAvailable,
      isFeatured,
      discountPrice,
      specialOffer,
      categoryId,
      category,
    } = req.body;

    const finalTitle = title || name;
    if (!finalTitle || typeof finalTitle !== 'string' || !finalTitle.trim()) {
      throw new AppError(400, 'Menu item title is required');
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new AppError(400, 'Price must be a valid non-negative number');
    }

    const newItem = await createMenuItemInDb({
      title: finalTitle.trim(),
      description: description ? String(description).trim() : undefined,
      price: parsedPrice,
      imageUrl: imageUrl ? String(imageUrl).trim() : image ? String(image).trim() : undefined,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      discountPrice: discountPrice !== undefined && discountPrice !== null ? Number(discountPrice) : undefined,
      specialOffer: specialOffer ? String(specialOffer).trim() : undefined,
      categoryId: categoryId ? String(categoryId).trim() : undefined,
      category: category ? String(category).trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};
