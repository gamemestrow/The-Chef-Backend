import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import mealRoutes from './meal.routes';
import { checkDbConnection } from '../config/db';

const router = Router();

// Health check endpoint with Neon DB status
router.get('/health', async (_req: Request, res: Response) => {
  const isDbConnected = await checkDbConnection();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Neon PostgreSQL (Serverless)',
      connected: isDbConnected,
    },
  });
});

// Mount Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meals', mealRoutes);

export default router;
