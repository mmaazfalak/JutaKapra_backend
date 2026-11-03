import express from 'express';
import { createOrder, updateOrderStatus, listOrders } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.put('/:id/status', updateOrderStatus);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id', updateOrderStatus);

export default router;
