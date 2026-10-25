import { Router } from 'express';
import {
  getLeaderboard,
  getWinnerAnnouncement,
  finalizeWinners,
  reopenWinners
} from '../controllers/leaderboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Strictly ADMIN-ONLY: participants and public cannot view leaderboard or winners API
router.get('/', authenticate, requireRole(UserRole.ADMIN), getLeaderboard);
router.get('/winners', authenticate, requireRole(UserRole.ADMIN), getWinnerAnnouncement);
router.post('/winners/finalize', authenticate, requireRole(UserRole.ADMIN), finalizeWinners);
router.post('/winners/reopen', authenticate, requireRole(UserRole.ADMIN), reopenWinners);

export default router;
