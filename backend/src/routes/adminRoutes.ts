import { Router } from 'express';
import {
  getDashboard,
  getTeams,
  updateTeam,
  setSignal,
  updateRound,
  getQuestions,
  updateQuestion,
  getSubmissions,
  applyScoreAdjustment,
  toggleLeaderboardPublish,
  getAuditLogs,
  generateQRCodes,
  exportCSV
} from '../controllers/adminController.js';
import { resetGame } from '../controllers/adminTestController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Strictly enforce authentication & ADMIN role across all admin sub-routes
router.use(authenticate, requireRole(UserRole.ADMIN));

router.get('/dashboard', getDashboard);
router.get('/teams', getTeams);
router.patch('/teams/:id', updateTeam);
router.post('/signal', setSignal);
router.patch('/rounds/:roundId', updateRound);
router.put('/rounds/:roundId', updateRound);
router.get('/questions', getQuestions);
router.patch('/questions/:id', updateQuestion);
router.get('/submissions', getSubmissions);
router.post('/score-adjustments', applyScoreAdjustment);
router.post('/leaderboard/publish', toggleLeaderboardPublish);
router.get('/audit-logs', getAuditLogs);
router.get('/qr-codes', generateQRCodes);
router.get('/qrcodes', generateQRCodes);
router.get('/export/csv', exportCSV);
router.post('/reset-game', resetGame);

export default router;
