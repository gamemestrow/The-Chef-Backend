import { Router } from 'express';
import {
  submitFeedback,
  getFeedbacks,
  getFeedbackStats,
  getMyFeedbacks,
  deleteFeedback,
} from '../controllers/feedback.controller';
import {
  authenticate,
  optionalAuthenticate,
} from '../middlewares/auth.middleware';

const router = Router();

// GET /api/feedback/stats - Feedback summary & rating distribution
router.get('/stats', getFeedbackStats);

// GET /api/feedback/my - Get current logged-in user's submitted feedbacks (Protected)
router.get('/my', authenticate, getMyFeedbacks);

// GET /api/feedback - List all feedbacks (supports ?rating=5&category=meal&limit=20)
router.get('/', getFeedbacks);

// POST /api/feedback - Submit new feedback (Attaches user if logged in)
router.post('/', optionalAuthenticate, submitFeedback);

// DELETE /api/feedback/:id - Delete feedback (Owner or Admin)
router.delete('/:id', authenticate, deleteFeedback);

export default router;
