import dotenv from 'dotenv';
import nodemailer, { Transporter } from 'nodemailer';

dotenv.config();

// Namecheap Private Email SMTP Configuration for jutakapra.store
const SMTP_HOST = process.env.SMTP_HOST || 'mail.privateemail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // true for port 465 SSL
const SMTP_USER = process.env.SMTP_USER || 'support@jutakapra.store';
const SMTP_PASS = process.env.SMTP_PASS || 'XAKd-kCNq-MbsN-hc5b-xVSF-es7m';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Juta Kapra';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'support@jutakapra.store';

const GOOGLE_SHEETS_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.APPS_SCRIPT_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyKB2IQJaf8v3eU6rVgqz_Bp5S0iEemFa6ld-ereWcF7D_KOm1GRPgzWJrJLLx6QWSxoA/exec';

const WEBHOOK_SECRET =
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ||
  process.env.APPS_SCRIPT_SHARED_SECRET ||
  'jk_sec_8f9a2c4e1b7d5a3f0e8c6b4a2d1f9e7c5b3a1d0f';

export const PRIMARY_ADMIN_EMAIL = 'mmaazfalak@icloud.com';

let cachedTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return cachedTransporter;
}

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
 * Generate branded responsive HTML email template for Juta.Kapra
 */
export function buildBrandedHtmlEmail(options: {
  title: string;
  subtitle?: string;
  contentHtml: string;
  actionButton?: { text: string; url: string };
  footerNotice?: string;
}): string {
  const { title, subtitle, contentHtml, actionButton, footerNotice } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0e14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #12151c; border: 1px solid #232833; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #1f242e; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                      JUTA<span style="color: #3b82f6;">.</span>KAPRA
                    </span>
                    <span style="display: block; font-size: 11px; letter-spacing: 1px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-family: monospace;">
                      Archival Footwear & Thrift Apparel
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 9999px; color: #60a5fa; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      100% Verified Authentic
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${title}
              </h1>
              ${
                subtitle
                  ? `<p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">${subtitle}</p>`
                  : ''
              }

              <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                ${contentHtml}
              </div>

              ${
                actionButton
                  ? `
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                  <tr>
                    <td align="center">
                      <a href="${actionButton.url}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                        ${actionButton.text}
                      </a>
                    </td>
                  </tr>
                </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0d1017; border-top: 1px solid #1f242e; text-align: left;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                ${
                  footerNotice ||
                  'You received this official notification from Juta Kapra because of your account activity. For support, reply directly to this email.'
                }
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px;">
                <tr>
                  <td style="font-size: 10px; color: #475569; font-family: monospace;">
                    © ${new Date().getFullYear()} Juta.Kapra Inc. • support@jutakapra.store • https://jutakapra.store
                  </td>
                  <td align="right" style="font-size: 10px; color: #475569;">
                    Islamabad • Karachi • Lahore
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch an OTP Password Reset or Authentication Email
 */
export async function sendOTPEmail(options: {
  to: string;
  name: string;
  otp: string;
}): Promise<boolean> {
  const { to, name, otp } = options;
  const subject = `Your Verification Code: ${otp} | Juta Kapra`;

  const contentHtml = `
    <p style="margin-top: 0; color: #e2e8f0; font-size: 15px;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We received a request to verify your account or reset your password on <strong>Juta Kapra</strong>. Use the 6-digit authentication code below to proceed:
    </p>

    <!-- OTP Code Display -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <div style="display: inline-block; padding: 18px 36px; background-color: #0b0e14; border: 2px solid #3b82f6; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: 900; font-family: 'Courier New', monospace; color: #60a5fa; box-shadow: 0 0 25px rgba(59, 130, 246, 0.2);">
            ${otp}
          </div>
        </td>
      </tr>
    </table>

    <div style="background-color: #171b24; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #fcd34d; font-weight: 600;">
        ⏱ Code expires in 10 minutes
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        Do not share this one-time passcode with anyone. Juta Kapra staff will never ask for your code.
      </p>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      If you did not make this request, you can safely ignore this email; your account remains secure.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Account Verification Code',
    subtitle: 'Enter this one-time verification code to securely access your account.',
    contentHtml,
    actionButton: {
      text: 'Return to Juta Kapra',
      url: 'https://www.jutakapra.store/login',
    },
  });

  return sendNotificationEmail({
    to,
    subject,
    htmlBody: html,
    body: `Your Juta Kapra verification code is: ${otp}. It expires in 10 minutes.`,
    type: 'password_reset',
    metadata: { otp, name },
  });
}

/**
 * Dispatch Welcome Email to new customer
 */
export async function sendWelcomeEmail(options: { to: string; name: string }): Promise<boolean> {
  const { to, name } = options;
  const subject = `Welcome to the Archive, ${name} | Juta Kapra`;

  const contentHtml = `
    <p style="margin-top: 0; color: #e2e8f0; font-size: 15px;">
      Welcome to the circle, <strong>${name}</strong>!
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Your collector account on <strong>Juta Kapra</strong> has been successfully created. You now have privileged access to our authenticated 1-of-1 vintage footwear drops, archival outerwear, workwear denim, and Japanese streetwear vaults.
    </p>

    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
        Collector Privileges Active:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 1.8;">
        <li>Priority access to limited 1-of-1 archival drops</li>
        <li>Real-time order tracking with nationwide express courier delivery</li>
        <li>100% single-stitch verification & authenticity guarantee</li>
        <li>Saved shipping addresses & instant checkout gate</li>
      </ul>
    </div>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Welcome to Juta.Kapra',
    subtitle: 'Your personal access portal to curated vintage footwear and thrift apparel.',
    contentHtml,
    actionButton: {
      text: 'Explore New Arrivals',
      url: 'https://www.jutakapra.store/shop',
    },
  });

  return sendNotificationEmail({
    to,
    subject,
    htmlBody: html,
    body: `Welcome to Juta Kapra, ${name}! Your collector account is active. Explore new drops at https://www.jutakapra.store`,
    type: 'welcome',
  });
}

/**
 * Dispatch Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order: any): Promise<boolean> {
  const recipientEmail = order.customer?.email || order.user?.email || order.guestEmail;
  if (!recipientEmail) return false;

  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || 'Valued Collector';
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const subject = `Order Confirmed #${orderNumber} | Juta Kapra`;

  const itemsListHtml = (order.items || [])
    .map((item: any) => {
      const title = item.product?.title || item.name || 'Archival Vintage Piece';
      const size = item.selectedSize || item.size || 'One Size';
      const price = Number(item.product?.price || item.price || 0).toLocaleString();
      const qty = item.quantity || 1;
      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f242e; color: #ffffff; font-size: 13px;">
          <strong>${title}</strong><br>
          <span style="font-size: 11px; color: #64748b;">Size: ${size} • Qty: ${qty}</span>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #1f242e; color: #60a5fa; font-weight: 700; font-size: 13px; font-family: monospace;">
          Rs. ${price}
        </td>
      </tr>
    `;
    })
    .join('');

  const totalFormatted = Number(order.total || order.totalAmount || 0).toLocaleString();

  const contentHtml = `
    <p style="margin-top: 0; color: #e2e8f0; font-size: 15px;">
      Thank you for your order, <strong>${customerName}</strong>!
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We have received your order <strong>#${orderNumber}</strong>. Your archival pieces are being hand-inspected, safely packaged, and prepped for courier dispatch.
    </p>

    <!-- Itemized Table -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 16px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Item</th>
          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsListHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 16px; font-size: 14px; font-weight: 700; color: #ffffff;">Total (Cash on Delivery)</td>
          <td align="right" style="padding-top: 16px; font-size: 16px; font-weight: 900; color: #34d399; font-family: monospace;">
            Rs. ${totalFormatted}
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        <strong>Delivery Address:</strong> ${order.customer?.address || order.shippingAddress?.address || 'Pakistan'} (${order.customer?.city || order.shippingAddress?.city || 'Pakistan'})
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">
        <strong>Contact:</strong> ${order.customer?.phone || order.shippingAddress?.phone || 'On file'}
      </p>
    </div>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Order Confirmed',
    subtitle: `Order #${orderNumber} has been received and is being prepared.`,
    contentHtml,
    actionButton: {
      text: 'Track Order Status',
      url: 'https://www.jutakapra.store/orders',
    },
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Thank you for your order #${orderNumber} of Rs. ${totalFormatted}. View details on Juta Kapra.`,
    type: 'order_placed',
    metadata: { orderNumber, total: order.total },
    sendAdminCopy: true,
  });
}

/**
 * Main Central Email Sender Function
 * Uses SMTP (support@jutakapra.store via Namecheap Private Email)
 * and falls back/mirrors to Google Apps Script Webhook.
 */
export async function sendNotificationEmail(options: NotificationEmailOptions): Promise<boolean> {
  const { to, subject, htmlBody, body, plainText, type, metadata = {}, sendAdminCopy = false } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const plainTextContent = body || plainText || subject;

  if (!recipientEmail) {
    console.warn('[EmailService] Missing recipient email address.');
    return false;
  }

  const formattedHtmlContent =
    htmlBody && htmlBody.trim().length > 0
      ? htmlBody
      : buildBrandedHtmlEmail({
          title: subject || 'Juta Kapra Notification',
          contentHtml: `<p>${plainTextContent}</p>`,
        });

  let smtpDelivered = false;

  // 1. Direct SMTP Delivery using support@jutakapra.store
  try {
    const transporter = getEmailTransporter();
    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: subject || 'Juta.Kapra Notification',
      text: plainTextContent,
      html: formattedHtmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService SMTP SUCCESS] Sent ${type} to ${recipientEmail}. Message ID: ${info.messageId}`);
    smtpDelivered = true;

    // Send admin copy if requested
    if (sendAdminCopy && recipientEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      transporter
        .sendMail({
          from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
          to: PRIMARY_ADMIN_EMAIL,
          subject: `[ADMIN ALERT] ${subject} (To: ${recipientEmail})`,
          text: plainTextContent,
          html: formattedHtmlContent,
        })
        .catch((err: any) => console.error('[EmailService SMTP Admin Copy Error]:', err.message));
    }
  } catch (smtpErr: any) {
    console.error(`[EmailService SMTP Failed for ${recipientEmail}]:`, smtpErr.message);
  }

  // 2. Non-blocking Google Apps Script Webhook / Google Sheets CRM log
  if (GOOGLE_SHEETS_WEBHOOK_URL) {
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

    fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    }).catch((err) => console.warn('[EmailService Webhook Mirror Log]:', err.message));
  }

  return smtpDelivered;
}
