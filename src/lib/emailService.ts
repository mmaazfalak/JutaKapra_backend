import { getApiUrl } from '../utils/api';

/**
 * Centralized Email & Notification Dispatcher for Juta.Kapra
 * Exclusively powered by Google Apps Script Webhook
 */

const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
  (import.meta as any).env?.GOOGLE_SHEETS_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyKB2IQJaf8v3eU6rVgqz_Bp5S0iEemFa6ld-ereWcF7D_KOm1GRPgzWJrJLLx6QWSxoA/exec';

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
    | 'order_confirmed'
    | 'order_dispatched'
    | 'order_delivered'
    | 'order_confirmation'
    | 'password_reset'
    | string;
  metadata?: Record<string, any>;
  sendAdminCopy?: boolean;
}

/**
 * Send an email notification via Google Apps Script Webhook (non-blocking, follows redirects)
 */
export async function sendNotificationEmail(options: NotificationEmailOptions): Promise<boolean> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn('[EmailService] Webhook URL not configured. Notification skipped.');
    return false;
  }

  const { to, subject, htmlBody, body, plainText, type, metadata = {}, sendAdminCopy = false } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const plainTextContent = body || plainText || subject;

  // Guarantee htmlBody is NEVER empty or undefined
  const formattedHtmlContent =
    htmlBody && htmlBody.trim().length > 0
      ? htmlBody
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 12px;">
          <h2 style="font-size: 18px; margin-bottom: 8px;">JUTA.KAPRA ARCHIVE</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">${plainTextContent}</p>
        </div>
      `.trim();

  // Exact JSON payload format requested
  const payload = {
    to: recipientEmail,
    subject: subject || 'Juta.Kapra Notification',
    htmlBody: formattedHtmlContent,
    body: plainTextContent,
    type: type || 'generic',
    email: recipientEmail,
    eventType: (type || 'generic').toUpperCase(),
    secret: WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  // 1. Try serverless proxy route first
  try {
    const proxyRes = await fetch(getApiUrl('/api/auth/send-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (proxyRes.ok) {
      console.log(`[EmailService] Dispatched ${type} via backend proxy to ${recipientEmail}`);
      return true;
    }
  } catch (proxyErr: any) {
    console.warn('[EmailService Proxy Skip]:', proxyErr.message);
  }

  // 2. Direct browser-to-Google Apps Script Webhook dispatch (using text/plain and no-cors to prevent browser CORS/redirect blocks)
  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    console.log(`[EmailService] Dispatched ${type} directly to Apps Script for ${recipientEmail}`);

    // Send admin alert copy to mmaazfalak@icloud.com if requested
    if (sendAdminCopy && recipientEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          ...payload,
          to: PRIMARY_ADMIN_EMAIL,
          email: PRIMARY_ADMIN_EMAIL,
          subject: `[ADMIN ALERT] ${subject} (Customer: ${recipientEmail})`,
        }),
      }).catch((err) => console.warn('[EmailService Admin Copy Notice]:', err.message));
    }

    return true;
  } catch (err: any) {
    console.warn('[EmailService Direct Notice]:', err.message);
    return true; // Non-blocking UX
  }
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
    type: 'order_placed',
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
    type: 'order_confirmed',
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
  trackingUrl?: string
): Promise<boolean> {
  const orderNum = order.orderNumber || order.id || 'FS-ORDER';
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerEmail = order.customer?.email || order.email || '';
  const courier = courierName || order.courier || 'TCS Express';
  const tracking = trackingNumber || order.trackingNumber || 'Pending';

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
        <p style="margin: 2px 0 0 0; font-size: 18px; font-family: monospace; font-weight: 900; color: #3b82f6;">${tracking}</p>
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
    body: `Your order #${orderNum} has been dispatched via ${courier}. Tracking #: ${tracking}`,
    type: 'order_dispatched',
    sendAdminCopy: true,
    metadata: {
      orderId: order.id || orderNum,
      orderNumber: orderNum,
      customerName,
      courier,
      trackingNumber: tracking,
      trackingUrl: trackingUrl || '',
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

// Backward compatibility alias
export const sendOrderConfirmationEmail = sendOrderPlacedEmail;
