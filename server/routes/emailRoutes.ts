import express from 'express';
import { getEmailMatrix, sendTestEmailController } from '../controllers/emailMatrixController.js';
import { cronAbandonedCarts, sendTestAbandonedCart } from '../controllers/cartController.js';
import { cronReviewRequests } from '../controllers/orderController.js';

const router = express.Router();

// Matrix & Direct Trigger Routes
router.get('/matrix', getEmailMatrix);
router.post('/send-test', sendTestEmailController);
router.post('/test-abandoned', sendTestAbandonedCart);

// Timeline / Cron Checker Routes
router.get('/cron/abandoned-carts', cronAbandonedCarts);
router.post('/cron/abandoned-carts', cronAbandonedCarts);
router.get('/cron/review-requests', cronReviewRequests);
router.post('/cron/review-requests', cronReviewRequests);

// Direct mount aliases when mounted at /api/cron
router.get('/abandoned-carts', cronAbandonedCarts);
router.post('/abandoned-carts', cronAbandonedCarts);
router.get('/review-requests', cronReviewRequests);
router.post('/review-requests', cronReviewRequests);

export default router;
