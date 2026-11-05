import dotenv from 'dotenv';
dotenv.config();

export const GAS_DEPLOYMENT_URL =
  process.env.GAS_DEPLOYMENT_URL ||
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.APPS_SCRIPT_WEBHOOK_URL ||
  '';

export const GOOGLE_SHEETS_WEBHOOK_URL = GAS_DEPLOYMENT_URL;

export const GOOGLE_SHEETS_WEBHOOK_SECRET =
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ||
  process.env.APPS_SCRIPT_SHARED_SECRET ||
  'jk_sec_8f9a2c4e1b7d5a3f0e8c6b4a2d1f9e7c5b3a1d0f';

export interface RegistrationSheetPayload {
  eventType: 'REGISTRATION';
  name: string;
  email: string;
  phone?: string;
  provider: 'google' | 'local';
  userId: string;
  timestamp?: string;
}

export interface SendOtpPayload {
  eventType: 'SEND_OTP';
  email: string;
  otp: string;
  name?: string;
  timestamp?: string;
}

export interface PasswordResetSheetPayload {
  eventType: 'PASSWORD_RESET';
  email: string;
  ipAddress?: string;
  status: string;
  timestamp?: string;
}

export interface OrderItemSheetPayload {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface OrderStatusSheetPayload {
  eventType: 'ORDER_STATUS';
  orderId: string;
  orderNumber?: string;
  customerName: string;
  email: string;
  phone?: string;
  totalAmount: number;
  status: 'Placed' | 'Dispatched' | 'Delivered' | 'Processing' | string;
  trackingNumber?: string;
  courier?: string;
  items: OrderItemSheetPayload[];
  timestamp?: string;
}

export type SheetWebhookPayload =
  | RegistrationSheetPayload
  | SendOtpPayload
  | PasswordResetSheetPayload
  | OrderStatusSheetPayload;

/**
 * Builds formatted HTML content for any payload ensuring htmlBody is NEVER empty
 */
function buildHtmlBody(payload: any, type: string, recipientEmail: string): string {
  if (type === 'auth_otp' || payload.eventType === 'SEND_OTP') {
    const otp = payload.otp || '';
    const name = payload.name || 'Collector';
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
        <h1 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
        <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 24px;">Security Verification Code</p>
        <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
          Hello ${name},<br/><br/>
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
  }

  if (type === 'order_confirmation' || (payload.eventType === 'ORDER_STATUS' && payload.status === 'Placed')) {
    const orderNumber = payload.orderNumber || payload.orderId || 'FS-ORDER';
    const customerName = payload.customerName || 'Customer';
    const totalAmount = payload.totalAmount || 0;
    const items = payload.items || [];
    const itemsHtml = items
      .map(
        (i: any) => `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 10px 0; font-size: 13px; color: #ffffff;">${i.name || 'Archival Piece'}</td>
          <td style="padding: 10px 0; font-size: 13px; text-align: center; color: #a1a1aa;">${i.quantity || 1}</td>
          <td style="padding: 10px 0; font-size: 13px; text-align: right; color: #ffffff;">Rs. ${(i.price || 0).toLocaleString()}</td>
        </tr>`
      )
      .join('');

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
        <h1 style="font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
        <p style="font-size: 14px; color: #10b981; font-weight: 700; margin-bottom: 20px;">✓ Order Placed & Confirmed</p>
        <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
          Thank you for your order, <strong>${customerName}</strong>. Your vintage order <strong>#${orderNumber}</strong> has been received and is being prepared.
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
                <td style="padding-top: 14px; font-size: 15px; font-weight: 900; text-align: right; color: #ffffff;">Rs. ${Number(totalAmount).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `.trim();
  }

  if (type === 'welcome' || payload.eventType === 'REGISTRATION') {
    const name = payload.name || recipientEmail.split('@')[0];
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
        <h1 style="font-size: 20px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">JUTA.KAPRA ARCHIVE</h1>
        <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 20px;">Welcome to the Vault</p>
        <p style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
          Hello <strong>${name}</strong>,<br/><br/>
          Your account with <strong>${recipientEmail}</strong> is now verified and active. You have full access to limited thrift drops, 1-of-1 archival garments, and encrypted checkout.
        </p>
      </div>
    `.trim();
  }

  // Generic fallback HTML
  return `
    <div style="font-family: sans-serif; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 12px;">
      <h2>Juta.Kapra Archive</h2>
      <p>${payload.body || payload.plainText || payload.message || 'Notification from Juta.Kapra Archive.'}</p>
    </div>
  `.trim();
}

/**
 * Dispatches a POST request to the Google Apps Script Webhook.
 * Handles 302 redirects automatically with redirect: 'follow'.
 */
export async function sendWebhookToGoogleAppsScript(payload: SheetWebhookPayload & Record<string, any>): Promise<boolean> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn('[Webhook] GOOGLE_SHEETS_WEBHOOK_URL not configured. Skipped dispatch.');
    return false;
  }

  const recipientEmail = (payload.to || payload.email || '').toLowerCase().trim();
  
  // Determine standard event type
  let type = payload.type || 'generic';
  if (!payload.type) {
    if (payload.eventType === 'SEND_OTP') type = 'auth_otp';
    else if (payload.eventType === 'REGISTRATION') type = 'welcome';
    else if (payload.eventType === 'ORDER_STATUS' && payload.status === 'Placed') type = 'order_confirmation';
    else if (payload.eventType === 'ORDER_STATUS') type = 'ORDER_STATUS';
    else type = payload.eventType ? String(payload.eventType).toLowerCase() : 'generic';
  }

  const emailSubject =
    payload.subject ||
    (type === 'auth_otp'
      ? `Your Juta.Kapra Verification Code: ${payload.otp || ''}`
      : type === 'order_confirmation'
      ? `Order Confirmed: #${payload.orderNumber || payload.orderId || ''}`
      : type === 'welcome'
      ? 'Welcome to Juta.Kapra Archive'
      : `Juta.Kapra Notification: ${payload.status || type}`);

  const plainTextContent =
    payload.body ||
    payload.plainText ||
    (type === 'auth_otp'
      ? `Your Juta.Kapra verification code is ${payload.otp}. Valid for 10 minutes.`
      : type === 'order_confirmation'
      ? `Order #${payload.orderNumber || payload.orderId} confirmed. Total: Rs. ${payload.totalAmount || 0}`
      : `Juta.Kapra update for ${recipientEmail}`);

  const formattedHtmlContent =
    payload.htmlBody && payload.htmlBody.trim().length > 0
      ? payload.htmlBody
      : buildHtmlBody(payload, type, recipientEmail);

  // Exact payload format expected by Google Apps Script
  const standardizedPayload = {
    to: recipientEmail,
    subject: emailSubject,
    htmlBody: formattedHtmlContent,
    body: plainTextContent,
    type,
    // Extra metadata for sheet CRM logging
    eventType: payload.eventType || type.toUpperCase(),
    email: recipientEmail,
    secret: GOOGLE_SHEETS_WEBHOOK_SECRET,
    timestamp: payload.timestamp || new Date().toISOString(),
    ...payload,
  };

  // Guarantee htmlBody is never empty or undefined
  if (!standardizedPayload.htmlBody) {
    standardizedPayload.htmlBody = `<p>${plainTextContent}</p>`;
  }

  // Safety check: if GAS_DEPLOYMENT_URL is empty, skip network call cleanly without crashing
  if (!GOOGLE_SHEETS_WEBHOOK_URL || !GOOGLE_SHEETS_WEBHOOK_URL.trim()) {
    console.warn('[SheetsService] GAS_DEPLOYMENT_URL is empty or not configured. Skipping webhook call.');
    return true;
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Apps-Script-Secret': GOOGLE_SHEETS_WEBHOOK_SECRET,
      },
      body: JSON.stringify(standardizedPayload),
      redirect: 'follow', // Follow Google Apps Script 302 redirects
    });

    if (!response.ok) {
      console.error(`[Webhook] Apps Script returned HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const data = await response.json().catch(() => ({ status: 'success' }));
    console.log(`[Webhook] Successfully dispatched ${type} to ${recipientEmail}:`, data);
    return true;
  } catch (error: any) {
    console.error('[Webhook] Google Apps Script dispatch error:', error.message);
    return false;
  }
}

/**
 * Non-blocking, fire-and-forget synchronization utility to Google Sheets.
 */
export function syncToGoogleSheets(payload: SheetWebhookPayload & Record<string, any>): void {
  setImmediate(async () => {
    try {
      await sendWebhookToGoogleAppsScript(payload);
    } catch (err: any) {
      console.error('[Webhook Fire-and-Forget Error]', err.message);
    }
  });
}
