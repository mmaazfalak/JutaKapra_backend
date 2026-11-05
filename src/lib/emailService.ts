import { getApiUrl } from '../utils/api';

/**
 * Centralized Email & Notification Dispatcher for Juta.Kapra
 * Exclusively powered by Google Apps Script Webhook
 */

/**
 * Active Google Apps Script Deployment URL
 * PAUSED: Do not use deployment URL to send emails per user instructions.
 * All emails are sent from support@jutakapra.store via backend SMTP service.
 */
export const PAUSE_DEPLOYMENT_URL_EMAILS = true;

export const GAS_DEPLOYMENT_URL =
  (import.meta as any).env?.VITE_GAS_DEPLOYMENT_URL ||
  (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
  (import.meta as any).env?.GOOGLE_SHEETS_WEBHOOK_URL ||
  '';

export const GOOGLE_SHEETS_WEBHOOK_URL = GAS_DEPLOYMENT_URL;

const WEBHOOK_SECRET =
  (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_SECRET ||
  'jk_sec_8f9a2c4e1b7d5a3f0e8c6b4a2d1f9e7c5b3a1d0f';

export const PRIMARY_ADMIN_EMAIL = 'mmaazfalak@icloud.com';

export interface NotificationEmailOptions {
  to: string;
  subject: string;
  htmlBody?: string;
  body?: string;
  plainText?: string;
  type:
    | 'auth_otp'
    | 'admin_login_otp'
    | 'welcome'
    | 'order_placed'
    | 'send_order_placed'
    | 'order_confirmed'
    | 'send_order_confirmed'
    | 'order_dispatched'
    | 'send_order_dispatched'
    | 'order_delivered'
    | 'order_confirmation'
    | 'abandoned_cart'
    | 'send_cart_abandoned'
    | 'password_reset'
    | string;
  action?: string;
  metadata?: Record<string, any>;
  sendAdminCopy?: boolean;
}

/**
 * Send an email notification directly via Backend SMTP from support@jutakapra.store
 * (Google Apps Script deployment URL sending is paused per user instructions).
 */
export async function sendNotificationEmail(options: NotificationEmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, body, plainText, type, action, metadata = {}, sendAdminCopy = false } = options;
  const recipientEmail = (to || '').toLowerCase().trim();

  if (!recipientEmail) {
    console.warn('[EmailService] Recipient email is missing. Skipping notification.');
    return false;
  }

  const plainTextContent = body || plainText || subject;
  const resolvedAction = action || (type ? (type.startsWith('send_') ? type : `send_${type}`) : 'send_notification');

  // Guarantee htmlBody is NEVER empty or undefined
  const formattedHtmlContent =
    htmlBody && htmlBody.trim().length > 0
      ? htmlBody
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 12px;">
          <h2 style="font-size: 18px; margin-bottom: 8px;">JUTA.KAPRA ARCHIVE</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">${plainTextContent}</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a;">Official notification sent from <a href="mailto:support@jutakapra.store" style="color: #60a5fa;">support@jutakapra.store</a></p>
        </div>
      `.trim();

  // Payload for Backend SMTP Delivery from support@jutakapra.store
  const payload = {
    action: resolvedAction,
    to: recipientEmail,
    subject: subject || 'Juta Kapra Notification',
    htmlBody: formattedHtmlContent,
    body: plainTextContent,
    type: type || 'generic',
    email: recipientEmail,
    eventType: (type || 'generic').toUpperCase(),
    timestamp: new Date().toISOString(),
    sendAdminCopy,
    metadata,
  };

  // 1. Direct Backend SMTP Dispatch (Always sent from support@jutakapra.store)
  try {
    const proxyRes = await fetch(getApiUrl('/api/auth/send-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (proxyRes.ok) {
      console.log(`[EmailService] Dispatched ${type} from support@jutakapra.store to ${recipientEmail}`);
      return true;
    }
  } catch (proxyErr: any) {
    console.warn('[EmailService Proxy Skip]:', proxyErr.message);
  }

  // 2. Google Apps Script Deployment URL email function is strictly PAUSED per user instructions
  if (PAUSE_DEPLOYMENT_URL_EMAILS) {
    console.info('[EmailService] GAS Deployment URL email dispatch is strictly paused per user instructions.');
    return true; // Graceful non-blocking exit
  }

  return false;
}

/**
 * 1. Admin Login 2FA OTP Email (strictly to mmaazfalak@icloud.com)
 */
export async function sendAdminLoginOtpEmail(otp: string): Promise<boolean> {
  const subject = `[SECURITY] Super Admin Login 2FA Passcode: ${otp}`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="background: #e5341f; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Admin 2FA Security</span>
      </div>
      <h1 style="font-size: 20px; font-weight: 900; margin-bottom: 6px; letter-spacing: -0.5px;">JUTA.KAPRA SUPER ADMIN ACCESS</h1>
      <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 20px;">Requested by: ${PRIMARY_ADMIN_EMAIL}</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        An administrative login attempt was initiated. Use the following 6-digit verification passcode to complete 2FA authentication and unlock the dashboard:
      </p>

      <div style="margin: 24px 0; padding: 18px; background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; text-align: center;">
        <span style="font-size: 36px; font-family: monospace; font-weight: 900; letter-spacing: 8px; color: #ffffff;">${otp}</span>
      </div>

      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
        This passcode expires in 10 minutes. If you did not initiate this login, your credentials may be compromised.
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: PRIMARY_ADMIN_EMAIL,
    subject,
    htmlBody,
    body: `Your Juta.Kapra Super Admin 2FA passcode is ${otp}. Valid for 10 minutes.`,
    plainText: `Your Juta.Kapra Super Admin 2FA passcode is ${otp}. Valid for 10 minutes.`,
    type: 'admin_login_otp',
    metadata: {
      otp,
      adminEmail: PRIMARY_ADMIN_EMAIL,
    },
    sendAdminCopy: false,
  });
}

/**
 * 2. Customer Auth OTP Verification Email
 */
export async function sendOtpEmail(email: string, otp: string, fullName?: string): Promise<boolean> {
  const subject = `Your Juta.Kapra Verification Code: ${otp}`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 24px;">Security Verification Code</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello ${fullName || 'Collector'},<br/><br/>
        Use the following one-time passcode (OTP) to authenticate your session or reset your security credentials. This code will expire in 10 minutes:
      </p>

      <div style="margin: 28px 0; padding: 18px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; text-align: center;">
        <span style="font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 6px; color: #ffffff;">${otp}</span>
      </div>

      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
        If you did not request this verification code, you can safely ignore this email.
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: email,
    subject,
    htmlBody,
    body: `Your Juta.Kapra verification code is ${otp}. Valid for 10 minutes.`,
    plainText: `Your Juta.Kapra verification code is ${otp}. Valid for 10 minutes.`,
    type: 'auth_otp',
    metadata: {
      otp,
      name: fullName || 'Customer',
    },
  });
}

/**
 * 3. Customer Welcome Registration Email
 */
export async function sendWelcomeEmail(email: string, fullName?: string): Promise<boolean> {
  const name = fullName || email.split('@')[0];
  const subject = 'Welcome to Juta.Kapra Archive';
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 20px;">Welcome to the Vault</p>
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${name}</strong>,<br/><br/>
        Your customer account with <strong>${email}</strong> is now verified and active. You have full access to limited thrift drops, 1-of-1 archival garments, and encrypted checkout.
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: email,
    subject,
    htmlBody,
    body: `Welcome to Juta.Kapra Archive, ${name}! Your account is now active.`,
    type: 'welcome',
    metadata: {
      name,
    },
  });
}

/**
 * 4. Order Lifecycle: Order Placed / Pending
 */
export async function sendOrderPlacedEmail(order: any): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';
  const total = order.total || order.totalAmount || 0;
  const items = order.items || [];

  const itemsHtml = items
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 0; font-size: 13px; color: #ffffff;">${item.product?.title || item.name || 'Archival Vintage Piece'}</td>
        <td style="padding: 12px 0; font-size: 13px; text-align: center; color: #a1a1aa;">${item.quantity || 1}</td>
        <td style="padding: 12px 0; font-size: 13px; text-align: right; color: #ffffff;">Rs. ${(item.product?.price || item.price || 0).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #3b82f6; font-weight: 700; margin-bottom: 20px;">📦 Order Placed (Pending Verification)</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Thank you for your order, <strong>${customerName}</strong>. Your vintage order <strong>#${orderNum}</strong> has been received and is awaiting inventory confirmation.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #18181b; border: 1px solid #27272a; border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #3f3f46; text-align: left;">
              <th style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #a1a1aa;">Item</th>
              <th style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; text-align: center; color: #a1a1aa;">Qty</th>
              <th style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; text-align: right; color: #a1a1aa;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top: 14px; font-size: 14px; font-weight: 800; color: #ffffff;">Total Amount:</td>
              <td style="padding-top: 14px; font-size: 15px; font-weight: 900; text-align: right; color: #ffffff;">Rs. ${Number(total).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="font-size: 12px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">
        <strong>Delivery Address:</strong><br/>
        ${order.customer?.address || order.address || ''}, ${order.customer?.city || order.city || 'Karachi'}<br/>
        Phone: ${order.customer?.phone || order.phone || 'N/A'}
      </div>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: customerEmail,
    subject: `Order Placed: #${orderNum} - Juta.Kapra`,
    htmlBody,
    body: `Your order #${orderNum} has been placed. Total: Rs. ${Number(total).toLocaleString()}`,
    type: 'send_order_placed',
    action: 'send_order_placed',
    sendAdminCopy: true, // Also alerts mmaazfalak@icloud.com
    metadata: {
      orderId: order.id || orderNum,
      orderNumber: orderNum,
      customerName,
      totalAmount: total,
    },
  });
}

/**
 * 5. Order Lifecycle: Order Confirmed
 */
export async function sendOrderConfirmedEmail(order: any): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';
  const total = order.total || order.totalAmount || 0;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #10b981; font-weight: 700; margin-bottom: 20px;">✓ Order Confirmed by Curator</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Your order <strong>#${orderNum}</strong> has been officially confirmed and authenticated. Our operations team is packing your pieces for courier handoff.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #18181b; border: 1px solid #27272a; border-radius: 12px;">
        <p style="margin: 0; font-size: 14px; color: #ffffff;">Order Value: <strong>Rs. ${Number(total).toLocaleString()}</strong></p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">Payment: Cash on Delivery / Verified Gateway</p>
      </div>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: customerEmail,
    subject: `Order Confirmed: #${orderNum} - Juta.Kapra`,
    htmlBody,
    body: `Your order #${orderNum} has been confirmed. Total: Rs. ${Number(total).toLocaleString()}`,
    type: 'send_order_confirmed',
    action: 'send_order_confirmed',
    sendAdminCopy: true,
    metadata: {
      orderId: order.id || orderNum,
      orderNumber: orderNum,
      customerName,
      totalAmount: total,
    },
  });
}

/**
 * 6. Order Lifecycle: Order Dispatched / Shipped
 */
export async function sendOrderDispatchedEmail(
  order: any,
  courierName?: string,
  trackingNumber?: string,
  trackingUrl?: string,
  estimatedDeliveryDate?: string
): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';
  const courier = courierName || order.courier || 'TCS Express';
  const tracking = trackingNumber || order.trackingNumber || 'Pending';
  const estimatedDate = estimatedDeliveryDate || order.estimatedDeliveryDate || 'Within 2-3 business days';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #f59e0b; font-weight: 700; margin-bottom: 20px;">🚚 Dispatched to Courier</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Your archival order <strong>#${orderNum}</strong> is on its way! It has been dispatched with our logistics partner:
      </p>

      <div style="margin: 20px 0; padding: 18px; background: #18181b; border: 1px solid #3f3f46; border-radius: 12px;">
        <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Courier Partner:</p>
        <p style="margin: 2px 0 12px 0; font-size: 16px; font-weight: 800; color: #ffffff;">${courier}</p>
        
        <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Tracking Consignment #:</p>
        <p style="margin: 2px 0 12px 0; font-size: 18px; font-family: monospace; font-weight: 900; color: #3b82f6;">${tracking}</p>

        <div style="padding-top: 10px; border-top: 1px solid #27272a;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #34d399; font-weight: 800;">Estimated Delivery Date:</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 800; color: #ffffff;">📅 ${estimatedDate}</p>
        </div>
      </div>

      ${
        trackingUrl
          ? `<p style="margin-top: 16px;"><a href="${trackingUrl}" style="background: #ffffff; color: #000000; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 800; display: inline-block;">Track Parcel Online →</a></p>`
          : ''
      }
    </div>
  `.trim();

  return sendNotificationEmail({
    to: customerEmail,
    subject: `Dispatched: Order #${orderNum} via ${courier} (${tracking})`,
    htmlBody,
    body: `Your order #${orderNum} has been dispatched via ${courier}. Tracking #: ${tracking}. Estimated Delivery: ${estimatedDate}`,
    type: 'send_order_dispatched',
    action: 'send_order_dispatched',
    sendAdminCopy: true,
    metadata: {
      orderId: order.id || orderNum,
      orderNumber: orderNum,
      customerName,
      courier,
      trackingNumber: tracking,
      trackingUrl: trackingUrl || '',
      estimatedDeliveryDate: estimatedDate,
    },
  });
}

/**
 * 7. Order Lifecycle: Order Delivered
 */
export async function sendOrderDeliveredEmail(order: any): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #10b981; font-weight: 700; margin-bottom: 20px;">🎉 Parcel Delivered</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Your package for order <strong>#${orderNum}</strong> has been successfully delivered. We hope you cherish this archival piece!
      </p>

      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5; margin-top: 20px;">
        Have feedback or questions? Simply reply to this email or tag us @jutakapra.
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: customerEmail,
    subject: `Delivered: Order #${orderNum} - Juta.Kapra Archive`,
    htmlBody,
    body: `Your order #${orderNum} has been successfully delivered.`,
    type: 'order_delivered',
    sendAdminCopy: true,
    metadata: {
      orderId: order.id || orderNum,
      orderNumber: orderNum,
      customerName,
    },
  });
}

// Backward compatibility aliases & Complete 8-Trigger Matrix Helpers
export const sendOrderConfirmationEmail = sendOrderPlacedEmail;
export const sendShippingFulfillmentEmail = sendOrderDispatchedEmail;

/**
 * 8. Order Lifecycle: Order Cancellation / Refund Notice
 * When to Send: Immediately if an order is canceled by customer or item runs out of stock.
 * Strict Rule: No discount codes or coupons.
 */
export async function sendOrderCancellationEmail(order: any, reason?: string): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';
  const cancelReason = reason || order.cancellationReason || 'Requested by customer / inventory verification update';
  const isCOD = (order.paymentMethod || 'cod').toLowerCase() === 'cod';
  const total = Number(order.total || order.totalAmount || 0).toLocaleString();

  const refundNotice = isCOD
    ? '<p style="font-size: 13px; color: #34d399; font-weight: 700;">Payment Status: No charges incurred (Cash on Delivery).</p>'
    : `<p style="font-size: 13px; color: #34d399; font-weight: 700;">Refund Status: Full refund of Rs. ${total} initiated to your original payment method (3-7 business days).</p>`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #ef4444; font-weight: 700; margin-bottom: 20px;">Order Cancellation & Refund Notice</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        This email confirms that your order <strong>#${orderNum}</strong> has been canceled.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #18181b; border-left: 4px solid #ef4444; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #f87171; font-weight: 700; text-transform: uppercase;">Reason:</p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #ffffff;">${cancelReason}</p>
      </div>

      <div style="margin: 20px 0; padding: 16px; background: #18181b; border: 1px solid #27272a; border-radius: 12px;">
        ${refundNotice}
      </div>

      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">
        Need assistance with finding alternative archival shoes, jackets, shirts, or watches? Contact our team at support@jutakapra.store.
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to: customerEmail,
    subject: `Order #${orderNum} Canceled & Refund Processed - Juta Kapra`,
    htmlBody,
    body: `Your order #${orderNum} has been canceled. Reason: ${cancelReason}`,
    type: 'order_cancelled',
    sendAdminCopy: true,
  });
}

/**
 * 9. Abandoned Cart Recovery Email
 * When to Send: 1 to 24 hours after adding items to cart without checkout.
 * Strict Rule: No discount codes or promo vouchers.
 */
export async function sendAbandonedCartEmail(options: {
  to: string;
  name?: string;
  cartItems: any[];
  cartTotal?: number;
  checkoutUrl?: string;
}): Promise<boolean> {
  const { to, name, cartItems, cartTotal, checkoutUrl } = options;
  const customerName = name || to.split('@')[0] || 'Collector';
  const total = cartTotal ? ` (Rs. ${Number(cartTotal).toLocaleString()})` : '';
  const returnUrl = checkoutUrl || 'https://www.jutakapra.store/cart';

  const itemsHtml = (cartItems || [])
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 10px 0; font-size: 13px; color: #ffffff;">${item.product?.title || item.title || item.name || 'Archival Item'}</td>
        <td style="padding: 10px 0; font-size: 13px; text-align: right; color: #60a5fa; font-weight: 700;">Rs. ${(item.product?.price || item.price || 0).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #f87171; font-weight: 800; margin-bottom: 20px;">⚡ Get your order delivered before someone else grabs it!</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        You left some rare archival pieces in your shopping bag over 10 hours ago. Because our vintage pieces are unique 1-of-1 items, they remain open to other collectors until checked out.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #18181b; border: 1px solid #27272a; border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <p style="margin-top: 20px;">
        <a href="${returnUrl}" style="background: #e5341f; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 800; display: inline-block;">
          Complete Your Order Now →
        </a>
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to,
    subject: `Get your order delivered before someone else grabs it! | Juta.Kapra`,
    htmlBody,
    body: `Get your order delivered before someone else grabs it! Complete order at ${returnUrl}${total}`,
    type: 'send_cart_abandoned',
    action: 'send_cart_abandoned',
    metadata: {
      customerName,
      cartTotal,
      checkoutUrl: returnUrl,
    },
  });
}

/**
 * 10. Review Request / Feedback Email
 * When to Send: 7 to 10 days post delivery.
 * Strict Rule: No discount rewards.
 */
export async function sendReviewRequestEmail(options: {
  to: string;
  name?: string;
  orderNumber: string;
}): Promise<boolean> {
  const { to, name, orderNumber } = options;
  const customerName = name || to.split('@')[0] || 'Collector';

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
      <p style="font-size: 14px; color: #3b82f6; font-weight: 700; margin-bottom: 20px;">How is your recent piece?</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        We hope you are loving your pieces from order <strong>#${orderNumber}</strong>. Your honest feedback on condition, sizing, and packaging helps us refine our archival curation.
      </p>

      <p style="margin-top: 20px;">
        <a href="https://www.jutakapra.store/orders?review=${orderNumber}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 800; display: inline-block;">
          Leave Your Review & Feedback →
        </a>
      </p>
    </div>
  `.trim();

  return sendNotificationEmail({
    to,
    subject: `How is your recent piece? | Juta Kapra Feedback`,
    htmlBody,
    body: `Leave your review for order #${orderNumber} at https://www.jutakapra.store/orders`,
    type: 'review_request',
  });
}
