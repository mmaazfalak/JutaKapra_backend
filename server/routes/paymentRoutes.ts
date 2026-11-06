import express from 'express';
import {
  getPaymentGateways,
  createTomPaySession,
  handleTomPayWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/gateways', getPaymentGateways);
router.post('/tompay/create-session', createTomPaySession);
router.post('/tompay/webhook', handleTomPayWebhook);

export default router;
