import { Request, Response } from 'express';
import {
  EMAIL_TRIGGER_MATRIX,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAccountLoginNotificationEmail,
  sendOrderConfirmationEmail,
  sendShippingFulfillmentEmail,
  sendOrderCancellationEmail,
  sendAbandonedCartEmail,
  sendReviewRequestEmail,
  PRIMARY_ADMIN_EMAIL,
} from '../services/emailService.js';

// Sample mock data with Juta Kapra's 4 core product categories: shoes, jackets, shirts, watches
const SAMPLE_ORDER = {
  id: 'ord-vintage-789',
  orderNumber: 'JK-89421',
  createdAt: new Date().toISOString(),
  customer: {
    fullName: 'Muzammil Javed',
    email: 'support@jutakapra.store',
    phone: '+92 300 1234567',
    address: 'House 42, Street 8, Sector F-7/2',
    city: 'Islamabad',
    country: 'Pakistan',
  },
  items: [
    {
      product: {
        title: 'Archival 1996 Air Max Retro Runner',
        category: 'Shoes & Footwear',
        price: 16500,
      },
      selectedSize: 'US 10.5 / EU 44.5',
      quantity: 1,
    },
    {
      product: {
        title: 'Distressed Heavyweight Leather Bomber Jacket',
        category: 'Jackets & Outerwear',
        price: 28000,
      },
      selectedSize: 'Size Large',
      quantity: 1,
    },
    {
      product: {
        title: 'Single-Stitch Vintage Graphic Archive Shirt',
        category: 'Vintage Shirts & Tops',
        price: 5200,
      },
      selectedSize: 'Size XL',
      quantity: 1,
    },
    {
      product: {
        title: 'Heritage Automatic Diver Classic Watch',
        category: 'Classic Watches',
        price: 22000,
      },
      selectedSize: 'Steel Bracelet 40mm',
      quantity: 1,
    },
  ],
  subtotal: 71700,
  shipping: 0,
  total: 71700,
  paymentMethod: 'cod',
  status: 'Processing',
  courier: 'TCS Express Nationwide',
  trackingNumber: 'TCS-99201488PK',
  courierTracking: {
    courierName: 'TCS Express Nationwide',
    trackingNumber: 'TCS-99201488PK',
    trackingUrl: 'https://www.tcsexpress.com/tracking?track=TCS-99201488PK',
    dispatchedAt: new Date().toISOString(),
  },
};

/**
 * 1. GET /api/email/matrix (Returns Trigger & Template Specification)
 */
export async function getEmailMatrix(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    store: 'Juta Kapra (www.jutakapra.store)',
    sender: 'support@jutakapra.store',
    strictRule: 'Do NOT include any discount codes, promo codes, coupons, or sales incentives in any email.',
    categories: ['Shoes & Footwear', 'Jackets & Outerwear', 'Vintage Shirts', 'Classic Watches'],
    totalEmails: EMAIL_TRIGGER_MATRIX.length,
    matrix: EMAIL_TRIGGER_MATRIX,
  });
}

/**
 * 2. POST /api/email/send-test (Dispatches a live test of any of the 8 email types)
 */
export async function sendTestEmailController(req: Request, res: Response): Promise<void> {
  try {
    const { type, to, name } = req.body || {};
    const recipient = (to || PRIMARY_ADMIN_EMAIL || 'support@jutakapra.store').toLowerCase().trim();
    const recipientName = name || recipient.split('@')[0] || 'Collector';

    let success = false;
    let message = '';

    switch (type) {
      case 'welcome':
        success = await sendWelcomeEmail({ to: recipient, name: recipientName });
        message = 'Welcome Email dispatched successfully!';
        break;

      case 'password_reset':
        success = await sendPasswordResetEmail({
          to: recipient,
          name: recipientName,
          token: 'sample-jwt-token-valid-24h',
          otp: '894217',
        });
        message = 'Password Reset Email dispatched successfully!';
        break;

      case 'login_alert':
        success = await sendAccountLoginNotificationEmail({
          to: recipient,
          name: recipientName,
          device: 'Apple iPhone 15 Pro',
          browser: 'Mobile Safari',
          os: 'iOS 18.1',
          ip: '39.40.18.92',
          location: 'Islamabad, Pakistan',
          timestamp: new Date().toISOString(),
        });
        message = 'Account Login Notification Email dispatched successfully!';
        break;

      case 'order_confirmation':
        success = await sendOrderConfirmationEmail({
          ...SAMPLE_ORDER,
          customer: { ...SAMPLE_ORDER.customer, email: recipient, fullName: recipientName },
        });
        message = 'Order Confirmation Email dispatched successfully!';
        break;

      case 'order_shipped':
        success = await sendShippingFulfillmentEmail({
          order: {
            ...SAMPLE_ORDER,
            customer: { ...SAMPLE_ORDER.customer, email: recipient, fullName: recipientName },
          },
          courierName: 'TCS Express Nationwide',
          trackingNumber: 'TCS-99201488PK',
          trackingUrl: 'https://www.tcsexpress.com/tracking?track=TCS-99201488PK',
          deliveryTimeframe: '2 to 3 business days nationwide',
        });
        message = 'Shipping & Fulfillment Notice Email dispatched successfully!';
        break;

      case 'order_cancelled':
        success = await sendOrderCancellationEmail({
          order: {
            ...SAMPLE_ORDER,
            customer: { ...SAMPLE_ORDER.customer, email: recipient, fullName: recipientName },
          },
          reason: 'Customer requested order cancellation before courier dispatch',
        });
        message = 'Order Cancellation & Refund Notice Email dispatched successfully!';
        break;

      case 'abandoned_cart':
        success = await sendAbandonedCartEmail({
          to: recipient,
          name: recipientName,
          cartItems: SAMPLE_ORDER.items,
          cartTotal: SAMPLE_ORDER.total,
        });
        message = 'Abandoned Cart Recovery Email dispatched successfully!';
        break;

      case 'review_request':
        success = await sendReviewRequestEmail({
          to: recipient,
          name: recipientName,
          orderNumber: SAMPLE_ORDER.orderNumber,
          items: SAMPLE_ORDER.items,
        });
        message = 'Review Request / Feedback Email dispatched successfully!';
        break;

      default:
        res.status(400).json({
          success: false,
          message: `Unknown email type "${type}". Allowed types: welcome, password_reset, login_alert, order_confirmation, order_shipped, order_cancelled, abandoned_cart, review_request`,
        });
        return;
    }

    res.status(200).json({
      success,
      type,
      recipient,
      message,
    });
  } catch (error: any) {
    console.error('Send test email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email.', error: error.message });
  }
}
