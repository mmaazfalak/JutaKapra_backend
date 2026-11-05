import express from 'express';
import {
  createOrder,
  updateOrderStatus,
  listOrders,
  cancelOrder,
  sendReviewRequestForOrder,
  cronReviewRequests,
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/cron/review-requests', cronReviewRequests);
router.post('/cron/review-requests', cronReviewRequests);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/send-review-request', sendReviewRequestForOrder);
router.put('/:id/status', updateOrderStatus);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id', updateOrderStatus);

export default router;
