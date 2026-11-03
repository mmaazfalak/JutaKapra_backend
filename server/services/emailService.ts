import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_SHEETS_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.APPS_SCRIPT_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyKB2IQJaf8v3eU6rVgqz_Bp5S0iEemFa6ld-ereWcF7D_KOm1GRPgzWJrJLLx6QWSxoA/exec';

const WEBHOOK_SECRET =
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ||
  process.env.APPS_SCRIPT_SHARED_SECRET ||
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
 * Server-side asynchronous email dispatcher via Google Apps Script Webhook
 */
export async function sendNotificationEmail(options: NotificationEmailOptions): Promise<boolean> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn('[ServerEmailService] GOOGLE_SHEETS_WEBHOOK_URL not configured. Skipped.');
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

  try {
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow', // Handles Google Apps Script 302 redirects
    });

    if (!response.ok) {
      console.warn(`[ServerEmailService] Webhook HTTP ${response.status}: ${response.statusText}`);
    } else {
      const data = await response.json().catch(() => ({ status: 'success' }));
      console.log(`[ServerEmailService] Dispatched ${type} to ${recipientEmail}:`, data);
    }

    // Send admin alert copy to mmaazfalak@icloud.com if requested
    if (sendAdminCopy && recipientEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          to: PRIMARY_ADMIN_EMAIL,
          email: PRIMARY_ADMIN_EMAIL,
          subject: `[ADMIN ALERT] ${subject} (Customer: ${recipientEmail})`,
        }),
        redirect: 'follow',
      }).catch((err) => console.error('[ServerEmailService Admin Copy Error]:', err.message));
    }

    return true;
  } catch (err: any) {
    console.error('[ServerEmailService Error]:', err.message);
    return false;
  }
}
