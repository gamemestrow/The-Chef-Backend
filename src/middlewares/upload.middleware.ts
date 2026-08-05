import multer from 'multer';
import { AppError } from './error.middleware';

// Use memoryStorage so file buffers are kept in RAM for streaming to Cloudinary or disk fallback
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(400, `Only image files are allowed. Invalid type: ${file.mimetype}`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
    files: 20, // Max 20 files per upload
  },
});
