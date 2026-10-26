import { Router } from 'express';
import { getRound3, redeemPhysicalQRCode, authorizeRound3Access, submitFinalKey } from '../controllers/round3Controller.js';
import { authenticate } from '../middleware/auth.js';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/data', authenticate, getRound3);
// The high-entropy team QR is the bearer proof for the phone scan; requiring
// a team login on the phone prevented the QR flow from working for participants.
router.post('/qr/mobile-redeem', submissionRateLimiter, redeemPhysicalQRCode);
router.post('/debug/authorize', authenticate, submissionRateLimiter, authorizeRound3Access);
router.post('/debug/submit', authenticate, submissionRateLimiter, submitFinalKey);

export default router;
