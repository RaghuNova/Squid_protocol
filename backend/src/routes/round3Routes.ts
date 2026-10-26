import { Router } from 'express';
import { getRound3, redeemPhysicalQRCode, authorizeRound3Access, submitFinalKey } from '../controllers/round3Controller.js';
import { authenticate } from '../middleware/auth.js';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/data', authenticate, getRound3);
router.post('/qr/mobile-redeem', authenticate, submissionRateLimiter, redeemPhysicalQRCode);
router.post('/debug/authorize', authenticate, submissionRateLimiter, authorizeRound3Access);
router.post('/debug/submit', authenticate, submissionRateLimiter, submitFinalKey);

export default router;
