import express from 'express';
import { syncCart, clearCart, cronAbandonedCarts, sendTestAbandonedCart } from '../controllers/cartController.js';

const router = express.Router();

router.post('/sync', syncCart);
router.post('/clear', clearCart);
router.get('/cron/abandoned-carts', cronAbandonedCarts);
router.post('/cron/abandoned-carts', cronAbandonedCarts);
router.post('/test-abandoned', sendTestAbandonedCart);

export default router;
