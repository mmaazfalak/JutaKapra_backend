import dotenv from 'dotenv';
dotenv.config();

const APPS_SCRIPT_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.APPS_SCRIPT_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyKB2IQJaf8v3eU6rVgqz_Bp5S0iEemFa6ld-ereWcF7D_KOm1GRPgzWJrJLLx6QWSxoA/exec';

const APPS_SCRIPT_SHARED_SECRET =
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ||
  process.env.APPS_SCRIPT_SHARED_SECRET ||
  'jk_sec_8f9a2c4e1b7d5a3f0e8c6b4a2d1f9e7c5b3a1d0f';

export async function sendToGoogleAppsScript(payload: Record<string, any>): Promise<boolean> {
  if (!APPS_SCRIPT_WEBHOOK_URL) {
    console.warn('[Webhook] APPS_SCRIPT_WEBHOOK_URL is not configured.');
    return false;
  }

  const sanitizedBody = {
    ...payload,
    secret: APPS_SCRIPT_SHARED_SECRET,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    const response = await fetch(APPS_SCRIPT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Apps-Script-Secret': APPS_SCRIPT_SHARED_SECRET,
      },
      body: JSON.stringify(sanitizedBody),
      redirect: 'follow', // Follow Google Apps Script 302 redirects
    });

    if (!response.ok) {
      console.error(`[Webhook] Google Apps Script returned HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const data = await response.json().catch(() => ({ status: 'unknown' }));
    console.log(`[Webhook] Dispatched to Google Apps Script successfully:`, data);
    return true;
  } catch (error: any) {
    console.error('[Webhook] Failed to send payload to Google Apps Script:', error.message);
    return false;
  }
}
