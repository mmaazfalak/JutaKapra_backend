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

const STORE_URL = process.env.FRONTEND_URL || 'https://www.jutakapra.store';
export const PRIMARY_ADMIN_EMAIL = 'mmaazfalak@icloud.com';

const GOOGLE_SHEETS_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  process.env.APPS_SCRIPT_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyKB2IQJaf8v3eU6rVgqz_Bp5S0iEemFa6ld-ereWcF7D_KOm1GRPgzWJrJLLx6QWSxoA/exec';

const WEBHOOK_SECRET =
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ||
  process.env.APPS_SCRIPT_SHARED_SECRET ||
  'jk_sec_8f9a2c4e1b7d5a3f0e8c6b4a2d1f9e7c5b3a1d0f';

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
    | 'welcome'
    | 'password_reset'
    | 'login_alert'
    | 'order_confirmation'
    | 'order_shipped'
    | 'order_cancelled'
    | 'abandoned_cart'
    | 'review_request'
    | string;
  metadata?: Record<string, any>;
  sendAdminCopy?: boolean;
}

/**
 * Generate branded responsive HTML email wrapper for Juta Kapra (jutakapra.store)
 * Strict Rule Enforced: No discount codes, coupons, or promo vouchers.
 */
export function buildBrandedHtmlEmail(options: {
  title: string;
  subtitle?: string;
  contentHtml: string;
  actionButton?: { text: string; url: string; style?: 'primary' | 'danger' | 'accent' };
  badgeText?: string;
  footerNotice?: string;
}): string {
  const { title, subtitle, contentHtml, actionButton, badgeText = '100% Verified Authentic', footerNotice } = options;

  let btnBg = '#2563eb';
  let btnShadow = 'rgba(37, 99, 235, 0.35)';
  if (actionButton?.style === 'danger') {
    btnBg = '#dc2626';
    btnShadow = 'rgba(220, 38, 38, 0.35)';
  } else if (actionButton?.style === 'accent') {
    btnBg = '#059669';
    btnShadow = 'rgba(5, 150, 105, 0.35)';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #60a5fa; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content-cell { padding: 24px 20px !important; }
      .header-cell { padding: 24px 20px 20px !important; }
      .category-cell { font-size: 10px !important; letter-spacing: 1px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0e14; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #12151c; border: 1px solid #232833; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.5);">
          
          <!-- Top Brand Header -->
          <tr>
            <td class="header-cell" style="padding: 28px 32px 20px; border-bottom: 1px solid #1f242e; background-color: #0e1118; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: 2.5px; color: #ffffff; text-transform: uppercase;">
                      JUTA<span style="color: #e5341f;">.</span>KAPRA
                    </span>
                    <span style="display: block; font-size: 11px; letter-spacing: 1.2px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-family: monospace;">
                      Archival Footwear & Thrift Apparel
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 5px 12px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 9999px; color: #60a5fa; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- Product Range Ribbon -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #1a1e28;">
                <tr>
                  <td class="category-cell" style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-family: monospace;">
                    <span style="color: #e2e8f0;">SHOES</span> <span style="color: #475569;">•</span> 
                    <span style="color: #e2e8f0;">JACKETS</span> <span style="color: #475569;">•</span> 
                    <span style="color: #e2e8f0;">SHIRTS</span> <span style="color: #475569;">•</span> 
                    <span style="color: #e2e8f0;">WATCHES</span>
                  </td>
                  <td align="right">
                    <a href="${STORE_URL}/shop" target="_blank" style="font-size: 11px; color: #60a5fa; font-weight: 600; text-decoration: none; letter-spacing: 0.5px;">
                      View Archive →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td class="content-cell" style="padding: 36px 32px; background-color: #12151c;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                ${title}
              </h1>
              ${
                subtitle
                  ? `<p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">${subtitle}</p>`
                  : ''
              }

              <div style="font-size: 14px; line-height: 1.65; color: #cbd5e1;">
                ${contentHtml}
              </div>

              ${
                actionButton
                  ? `
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                  <tr>
                    <td align="center">
                      <a href="${actionButton.url}" target="_blank" style="display: inline-block; padding: 14px 34px; background-color: ${btnBg}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 18px ${btnShadow}; text-align: center;">
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
            <td style="padding: 24px 32px; background-color: #0b0e14; border-top: 1px solid #1f242e; text-align: left;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                ${
                  footerNotice ||
                  'You received this official notification from Juta Kapra regarding your account or shopping activity. For questions or assistance, reply directly to this email or reach us at <a href="mailto:support@jutakapra.store" style="color: #60a5fa;">support@jutakapra.store</a>.'
                }
              </p>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #161922;">
                <tr>
                  <td style="font-size: 10px; color: #475569; font-family: monospace;">
                    © ${new Date().getFullYear()} Juta Kapra • <a href="${STORE_URL}" style="color: #64748b;">jutakapra.store</a>
                  </td>
                  <td align="right" style="font-size: 10px; color: #475569; font-family: monospace;">
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

// ==============================================================================
// 1. ACCOUNT & SECURITY EMAILS (TRIGGERED BY USER ACTIONS)
// ==============================================================================

/**
 * EMAIL 1: Welcome Email
 * When to Send: Instantly after a user successfully creates a new account or signs up on the website.
 * Content Focus: Welcome them to Juta Kapra, highlight the product range (shoes, jackets, shirts, and watches),
 * and invite them to explore new arrivals. Strict: No discount codes.
 */
export async function sendWelcomeEmail(options: { to: string; name?: string }): Promise<boolean> {
  const { to, name } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const customerName = name || recipientEmail.split('@')[0] || 'Collector';
  const subject = `Welcome to Juta Kapra, ${customerName} | Your Archive Account is Active`;

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Welcome to Juta Kapra, <strong>${customerName}</strong>!
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Your collector account has been created. Juta Kapra is Pakistan's premier destination for authenticated, hand-curated vintage footwear, archival outerwear, heritage shirts, and classic timepieces.
    </p>

    <!-- Product Range Showcase -->
    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 22px 20px; margin: 26px 0;">
      <p style="margin: 0 0 14px 0; font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
        Curated Archive Collections:
      </p>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 50%;">
            <strong style="color: #60a5fa; font-size: 13px;">👟 Shoes & Footwear</strong><br>
            <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Rare vintage sneakers, retro trainers, and archival leather boots verified for condition.</span>
          </td>
          <td style="padding: 8px 0 8px 16px; vertical-align: top; width: 50%;">
            <strong style="color: #f59e0b; font-size: 13px;">🧥 Jackets & Outerwear</strong><br>
            <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Bomber jackets, distressed leather racers, denim truckers, and rare utility workwear.</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0 0; vertical-align: top; width: 50%;">
            <strong style="color: #34d399; font-size: 13px;">👕 Vintage Shirts & Tops</strong><br>
            <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Single-stitch tees, heavyweight flannel shirts, oxford button-downs, and knitwear.</span>
          </td>
          <td style="padding: 12px 0 0 16px; vertical-align: top; width: 50%;">
            <strong style="color: #a78bfa; font-size: 13px;">⌚ Classic Watches</strong><br>
            <span style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Hand-selected retro timepieces and heritage mechanical watches inspected for authenticity.</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Collector Commitments (No Discounts) -->
    <div style="background-color: #171b24; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #ffffff; font-weight: 700;">
        Our Authenticity Promise
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        Every piece on Juta Kapra is an authentic, single-edition piece inspected by our curation specialists. No replicas, no mass reproductions.
      </p>
    </div>

    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
      New drops are cataloged every week. Browse the latest arrivals and save your delivery preferences for instant checkout.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Welcome to Juta Kapra',
    subtitle: 'Your personal portal for vintage footwear, jackets, shirts, and watches.',
    contentHtml,
    actionButton: {
      text: 'Explore New Arrivals',
      url: `${STORE_URL}/shop`,
    },
    badgeText: 'Account Activated',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Welcome to Juta Kapra, ${customerName}! Explore curated shoes, jackets, shirts, and watches at ${STORE_URL}/shop`,
    type: 'welcome',
    metadata: { name: customerName },
  });
}

/**
 * EMAIL 2: Password Reset Email
 * When to Send: Instantly when a user clicks "Forgot Password" on the login page.
 * Content Focus: Provide a secure reset link (valid for 24 hours), instant OTP code, and security notice if they didn't request it.
 */
export async function sendPasswordResetEmail(options: {
  to: string;
  name?: string;
  token?: string;
  otp?: string;
}): Promise<boolean> {
  const { to, name, token, otp } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const customerName = name || recipientEmail.split('@')[0] || 'User';
  const subject = `Reset Your Juta Kapra Password | Security Notice`;

  const resetUrl = token
    ? `${STORE_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(recipientEmail)}`
    : `${STORE_URL}/reset-password?email=${encodeURIComponent(recipientEmail)}`;

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 15px;">
      Hello <strong>${customerName}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We received a request to reset the password for your Juta Kapra account (<code>${recipientEmail}</code>). Click the button below to set a new, secure password. This link is valid for <strong>24 hours</strong>.
    </p>

    ${
      otp
        ? `
      <!-- 6-Digit Verification Code -->
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 20px;">
        <tr>
          <td align="center">
            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; font-family: monospace;">
              One-Time Verification Passcode
            </span>
            <div style="display: inline-block; padding: 14px 32px; background-color: #0b0e14; border: 2px solid #3b82f6; border-radius: 12px; letter-spacing: 8px; font-size: 30px; font-weight: 900; font-family: 'Courier New', monospace; color: #60a5fa; box-shadow: 0 0 25px rgba(59, 130, 246, 0.2);">
              ${otp}
            </div>
            <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 8px;">
              You can also enter this 6-digit code on the reset page.
            </span>
          </td>
        </tr>
      </table>
    `
        : ''
    }

    <!-- Security Alert Box -->
    <div style="background-color: #171b24; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 22px 0;">
      <p style="margin: 0; font-size: 13px; color: #fcd34d; font-weight: 700;">
        ⚠️ Security Notice
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        If you did not request this password reset, no action is needed — your account remains completely safe and your current password has not been altered. Do not forward or share this email with anyone.
      </p>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
      Link expires in 24 hours. For questions, contact support directly at <a href="mailto:support@jutakapra.store" style="color: #60a5fa;">support@jutakapra.store</a>.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Password Reset Request',
    subtitle: 'Follow the secure link below to reset your Juta Kapra account password.',
    contentHtml,
    actionButton: {
      text: 'Reset My Password',
      url: resetUrl,
      style: 'primary',
    },
    badgeText: 'Security Notice',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Reset your Juta Kapra password by clicking: ${resetUrl} (Code: ${otp || 'N/A'}, valid 24 hours).`,
    type: 'password_reset',
    metadata: { otp, token },
  });
}

/**
 * Backward compatibility alias for sendOTPEmail
 */
export async function sendOTPEmail(options: { to: string; name: string; otp: string }): Promise<boolean> {
  return sendPasswordResetEmail({
    to: options.to,
    name: options.name,
    otp: options.otp,
  });
}

/**
 * EMAIL 3: Account Login Notification
 * When to Send: Automatically when a login is detected from a new device, browser, or unrecognized location.
 * Content Focus: Alert the user with device/time details and give instructions to secure the account if it wasn't them.
 */
export async function sendAccountLoginNotificationEmail(options: {
  to: string;
  name?: string;
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  timestamp?: string;
}): Promise<boolean> {
  const { to, name, device, browser, os, ip, location, timestamp } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const customerName = name || recipientEmail.split('@')[0] || 'User';
  const subject = `Security Alert: New Sign-in to Your Juta Kapra Account`;

  const formattedDate = timestamp
    ? new Date(timestamp).toUTCString()
    : new Date().toUTCString();

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 15px;">
      Hello <strong>${customerName}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We detected a sign-in to your <strong>Juta Kapra</strong> account from an unrecognized device or browser. Review the activity details below:
    </p>

    <!-- Activity Details Card -->
    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 20px; margin: 22px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; width: 35%; text-transform: uppercase; font-family: monospace;">Time (UTC)</td>
          <td style="padding: 6px 0; font-size: 13px; color: #ffffff; font-weight: 600;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">Device / OS</td>
          <td style="padding: 6px 0; font-size: 13px; color: #60a5fa; font-weight: 600;">${device || 'Desktop / Mobile'} (${os || 'Unknown OS'})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">Browser</td>
          <td style="padding: 6px 0; font-size: 13px; color: #ffffff;">${browser || 'Web Browser'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">IP Address</td>
          <td style="padding: 6px 0; font-size: 13px; color: #94a3b8; font-family: monospace;">${ip || 'Unknown IP'} ${location ? `• ${location}` : ''}</td>
        </tr>
      </table>
    </div>

    <!-- Security Action Notice -->
    <div style="background-color: #171b24; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #f87171; font-weight: 700;">
        Was this you?
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        If you recognize this sign-in, you can safely ignore this alert. If you did NOT sign in at this time, someone else may have gained access to your credentials. Secure your account immediately by resetting your password.
      </p>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
      For urgent security support, reach our team directly at <a href="mailto:support@jutakapra.store" style="color: #60a5fa;">support@jutakapra.store</a>.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'New Account Sign-in',
    subtitle: 'Sign-in detected from a new device, browser, or network location.',
    contentHtml,
    actionButton: {
      text: 'Secure My Account',
      url: `${STORE_URL}/forgot-password`,
      style: 'danger',
    },
    badgeText: 'Security Alert',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Security Alert: New sign-in to your Juta Kapra account from ${device || 'device'} (${ip || 'IP'}). If not you, reset your password immediately at ${STORE_URL}/forgot-password`,
    type: 'login_alert',
    metadata: { device, browser, os, ip, timestamp },
  });
}

// ==============================================================================
// 2. TRANSACTIONAL & ORDER EMAILS (TRIGGERED BY CHECKOUT & FULFILLMENT)
// ==============================================================================

/**
 * EMAIL 4: Order Confirmation
 * When to Send: Immediately after a customer successfully places an order and completes checkout.
 * Content Focus: Order number, date, itemized list (product name, size, quantity, price), shipping address,
 * and confirmation that the team is prepping the package. Strict: No discount codes.
 */
export async function sendOrderConfirmationEmail(order: any): Promise<boolean> {
  const recipientEmail = (order.customer?.email || order.user?.email || order.guestEmail || '').toLowerCase().trim();
  if (!recipientEmail) {
    console.warn('[EmailService] Order missing recipient email.');
    return false;
  }

  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || 'Valued Customer';
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const subject = `Order Confirmation #${orderNumber} | Juta Kapra`;

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : new Date().toLocaleDateString();

  const itemsListHtml = (order.items || [])
    .map((item: any) => {
      const title = item.product?.title || item.name || 'Archival Vintage Piece';
      const size = item.selectedSize || item.size || 'One Size';
      const price = Number(item.product?.price || item.price || 0).toLocaleString();
      const qty = item.quantity || 1;
      const category = item.product?.category || 'Archive Item';

      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f242e; color: #ffffff; font-size: 13px;">
          <strong style="color: #f1f5f9; font-size: 14px;">${title}</strong><br>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">Category: ${category} • Size: ${size} • Qty: ${qty}</span>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #1f242e; color: #60a5fa; font-weight: 700; font-size: 14px; font-family: monospace;">
          Rs. ${price}
        </td>
      </tr>
    `;
    })
    .join('');

  const subtotalFormatted = Number(order.subtotal || order.total || 0).toLocaleString();
  const shippingFormatted = Number(order.shipping || 0) === 0 ? 'FREE (Express Courier)' : `Rs. ${Number(order.shipping).toLocaleString()}`;
  const totalFormatted = Number(order.total || 0).toLocaleString();
  const paymentMethodLabel = (order.paymentMethod || 'cod').toUpperCase() === 'COD' ? 'Cash on Delivery (COD)' : (order.paymentMethod || 'Online').toUpperCase();

  const shippingAddr = order.customer?.address || order.shippingAddress?.street || order.shippingAddress?.address || 'On file';
  const shippingCity = order.customer?.city || order.shippingAddress?.city || 'Pakistan';
  const shippingPhone = order.customer?.phone || order.shippingAddress?.phone || 'On file';

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Thank you for your order, <strong>${customerName}</strong>!
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We have received your order <strong>#${orderNumber}</strong> placed on <strong>${orderDate}</strong>. Our curation and packing specialists are hand-inspecting each item, verifying authenticity and condition, and carefully packaging your parcel for courier dispatch.
    </p>

    <!-- Itemized List -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 16px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; font-family: monospace;">Item Details</th>
          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; font-family: monospace;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsListHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 14px; font-size: 13px; color: #94a3b8;">Subtotal</td>
          <td align="right" style="padding-top: 14px; font-size: 13px; color: #cbd5e1; font-family: monospace;">Rs. ${subtotalFormatted}</td>
        </tr>
        <tr>
          <td style="padding-top: 6px; font-size: 13px; color: #94a3b8;">Shipping & Courier</td>
          <td align="right" style="padding-top: 6px; font-size: 13px; color: #34d399; font-weight: 600;">${shippingFormatted}</td>
        </tr>
        <tr>
          <td style="padding-top: 12px; font-size: 15px; font-weight: 800; color: #ffffff; border-top: 1px solid #1f242e;">Total (${paymentMethodLabel})</td>
          <td align="right" style="padding-top: 12px; font-size: 18px; font-weight: 900; color: #60a5fa; font-family: monospace; border-top: 1px solid #1f242e;">
            Rs. ${totalFormatted}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Shipping Address & Delivery Prep Box -->
    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
      <p style="margin: 0 0 10px; font-size: 11px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
        Delivery Destination:
      </p>
      <p style="margin: 0; font-size: 13px; color: #f1f5f9;">
        <strong>${customerName}</strong><br>
        ${shippingAddr}, ${shippingCity}, Pakistan<br>
        <span style="color: #94a3b8; font-size: 12px;">Contact Phone: ${shippingPhone}</span>
      </p>
    </div>

    <!-- Fulfillment Status Notice -->
    <div style="background-color: #171b24; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #34d399; font-weight: 700;">
        What happens next?
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        As soon as the courier scans your package, you will receive an automated dispatch notification with your direct tracking link and courier details.
      </p>
    </div>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Order Confirmed',
    subtitle: `Order #${orderNumber} has been received and is being prepped by our team.`,
    contentHtml,
    actionButton: {
      text: 'View Order Status',
      url: `${STORE_URL}/orders`,
      style: 'primary',
    },
    badgeText: 'Order Prepping',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Thank you for your Juta Kapra order #${orderNumber} (Rs. ${totalFormatted}). Track order status at ${STORE_URL}/orders`,
    type: 'order_confirmation',
    metadata: { orderNumber, total: order.total },
    sendAdminCopy: true,
  });
}

/**
 * EMAIL 5: Shipping & Fulfillment Notice
 * When to Send: As soon as the package is packed, labeled, and handed over to the delivery courier.
 * Content Focus: Courier name, tracking number, a direct tracking link button, and estimated delivery timeframe.
 */
export async function sendShippingFulfillmentEmail(options: {
  order: any;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryTimeframe?: string;
}): Promise<boolean> {
  const { order, courierName, trackingNumber, trackingUrl, deliveryTimeframe } = options;
  const recipientEmail = (order.customer?.email || order.user?.email || order.guestEmail || '').toLowerCase().trim();
  if (!recipientEmail) return false;

  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || 'Valued Customer';
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const courier = courierName || order.courier || order.courierTracking?.courierName || 'Express Courier';
  const tracking = trackingNumber || order.trackingNumber || order.courierTracking?.trackingNumber || 'Pending Courier Scan';
  const timeframe = deliveryTimeframe || '2 to 4 business days nationwide';

  let directTrackUrl = trackingUrl || order.courierTracking?.trackingUrl;
  if (!directTrackUrl && tracking && tracking !== 'Pending Courier Scan') {
    const cLower = courier.toLowerCase();
    if (cLower.includes('tcs')) {
      directTrackUrl = `https://www.tcsexpress.com/tracking?track=${tracking}`;
    } else if (cLower.includes('leopard')) {
      directTrackUrl = `https://www.leopardscourier.com/tracking?track=${tracking}`;
    } else if (cLower.includes('trax')) {
      directTrackUrl = `https://sonic.pk/tracking?tracking_number=${tracking}`;
    } else if (cLower.includes('dhl')) {
      directTrackUrl = `https://www.dhl.com/pk-en/home/tracking.html?tracking-id=${tracking}`;
    } else {
      directTrackUrl = `${STORE_URL}/orders`;
    }
  } else if (!directTrackUrl) {
    directTrackUrl = `${STORE_URL}/orders`;
  }

  const subject = `Your Order #${orderNumber} Has Shipped | Juta Kapra Dispatch`;

  const itemsSummary = (order.items || [])
    .map((item: any) => `${item.product?.title || item.name || 'Archival Piece'} (${item.selectedSize || item.size || 'Size'})`)
    .join(', ');

  const totalFormatted = Number(order.total || 0).toLocaleString();
  const isCOD = (order.paymentMethod || 'cod').toLowerCase() === 'cod';

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Great news, <strong>${customerName}</strong>!
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Your package for order <strong>#${orderNumber}</strong> has been securely packed, labeled, and handed over to our courier partner. It is now on its way to your delivery address.
    </p>

    <!-- Tracking Info Card -->
    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 22px 20px; margin: 24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; width: 40%; text-transform: uppercase; font-family: monospace;">Courier Partner</td>
          <td style="padding: 6px 0; font-size: 14px; color: #ffffff; font-weight: 700;">${courier}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">Tracking Number</td>
          <td style="padding: 6px 0; font-size: 14px; color: #60a5fa; font-weight: 800; font-family: monospace;">${tracking}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">Estimated Delivery</td>
          <td style="padding: 6px 0; font-size: 13px; color: #34d399; font-weight: 600;">${timeframe}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-family: monospace;">Shipped Items</td>
          <td style="padding: 6px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">${itemsSummary || 'Archival Vintage Pieces'}</td>
        </tr>
      </table>
    </div>

    ${
      isCOD
        ? `
      <div style="background-color: #171b24; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #fcd34d; font-weight: 700;">
          💵 Cash on Delivery Reminder
        </p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
          Please ensure the exact cash amount of <strong>Rs. ${totalFormatted}</strong> is available at the delivery location when the courier arrives.
        </p>
      </div>
    `
        : ''
    }

    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
      Please inspect the tamper-evident packaging seal upon delivery. If you have any delivery schedule updates, reply to this email or contact support.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Your Order Has Shipped',
    subtitle: `Package #${orderNumber} is in transit via ${courier}.`,
    contentHtml,
    actionButton: {
      text: 'Track Your Package',
      url: directTrackUrl,
      style: 'primary',
    },
    badgeText: 'Dispatched & In Transit',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Your Juta Kapra order #${orderNumber} has shipped via ${courier} (Tracking: ${tracking}). Track package at ${directTrackUrl}`,
    type: 'order_shipped',
    metadata: { orderNumber, courier, tracking },
    sendAdminCopy: true,
  });
}

/**
 * EMAIL 6: Order Cancellation / Refund Notice
 * When to Send: Immediately if an order is canceled by the customer or if an item runs out of stock.
 * Content Focus: Clear reason for cancellation, order number, and details regarding the full refund processing back to their original payment method. Strict: No discount codes.
 */
export async function sendOrderCancellationEmail(options: {
  order: any;
  reason?: string;
}): Promise<boolean> {
  const { order, reason } = options;
  const recipientEmail = (order.customer?.email || order.user?.email || order.guestEmail || '').toLowerCase().trim();
  if (!recipientEmail) return false;

  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || 'Valued Customer';
  const orderNumber = order.orderNumber || order.id || 'N/A';
  const cancellationReason = reason || order.cancellationReason || 'Customer cancellation / stock verification discrepancy';
  const totalFormatted = Number(order.total || 0).toLocaleString();
  const isCOD = (order.paymentMethod || 'cod').toLowerCase() === 'cod';

  const subject = `Order #${orderNumber} Cancellation & Refund Notice | Juta Kapra`;

  const refundDetailsHtml = isCOD
    ? `
      <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #34d399; font-weight: 700;">
          Payment Status: No Charges Incurred
        </p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Because this order was placed with <strong>Cash on Delivery (COD)</strong>, no funds were captured and you have not been charged.
        </p>
      </div>
    `
    : `
      <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #34d399; font-weight: 700;">
          Refund Status: Full Refund Processed
        </p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
          A full refund of <strong>Rs. ${totalFormatted}</strong> has been initiated back to your original payment method. Depending on your bank or payment provider's processing schedule, the funds will reflect in your account within <strong>3 to 7 business days</strong>.
        </p>
      </div>
    `;

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Hello <strong>${customerName}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      This email confirms that order <strong>#${orderNumber}</strong> has been canceled.
    </p>

    <!-- Cancellation Details -->
    <div style="background-color: #171b24; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #f87171; font-weight: 700; text-transform: uppercase; font-family: monospace;">
        Reason for Cancellation:
      </p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #ffffff; line-height: 1.5;">
        ${cancellationReason}
      </p>
    </div>

    ${refundDetailsHtml}

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
      We sincerely apologize for any inconvenience caused. If you would like help locating an alternative pair of shoes, jacket, shirt, or watch in your preferred size and condition, our curation desk is ready to assist you.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Order Canceled & Refund Processed',
    subtitle: `Order #${orderNumber} has been canceled. Review your refund confirmation below.`,
    contentHtml,
    actionButton: {
      text: 'Return to Storefront',
      url: `${STORE_URL}/shop`,
      style: 'primary',
    },
    badgeText: 'Order Canceled',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `Order #${orderNumber} has been canceled. Reason: ${cancellationReason}. ${isCOD ? 'No payment collected.' : `Full refund of Rs. ${totalFormatted} processed to original payment method.`}`,
    type: 'order_cancelled',
    metadata: { orderNumber, reason: cancellationReason, total: order.total },
    sendAdminCopy: true,
  });
}

// ==============================================================================
// 3. POST-PURCHASE & RETENTION EMAILS (TRIGGERED BY TIMELINE / BEHAVIOR)
// ==============================================================================

/**
 * EMAIL 7: Abandoned Cart Recovery
 * When to Send: 1 to 24 hours after a customer adds items (shoes, jackets, etc.) to their cart but leaves without checking out.
 * Content Focus: A friendly reminder showing the exact items left behind with a direct link back to checkout.
 * Strict Rule: No discount incentives, no promo codes.
 */
export async function sendAbandonedCartEmail(options: {
  to: string;
  name?: string;
  cartItems: any[];
  cartTotal?: number;
  recoveryUrl?: string;
}): Promise<boolean> {
  const { to, name, cartItems, cartTotal, recoveryUrl } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const customerName = name || recipientEmail.split('@')[0] || 'Collector';
  const subject = `You Left Something in Your Bag | Juta Kapra`;

  const checkoutUrl = recoveryUrl || `${STORE_URL}/cart`;

  const itemsHtml = (cartItems || [])
    .map((item: any) => {
      const title = item.product?.title || item.title || item.name || 'Archival Item';
      const size = item.selectedSize || item.size || 'Standard';
      const category = item.product?.category || item.category || 'Footwear & Apparel';
      const price = Number(item.product?.price || item.price || 0).toLocaleString();

      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f242e;">
          <strong style="color: #ffffff; font-size: 14px;">${title}</strong><br>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">Category: ${category} • Size: ${size}</span>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #1f242e; color: #60a5fa; font-weight: 700; font-size: 14px; font-family: monospace;">
          Rs. ${price}
        </td>
      </tr>
    `;
    })
    .join('');

  const totalFormatted = cartTotal ? Number(cartTotal).toLocaleString() : undefined;

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Hello <strong>${customerName}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      We noticed you curated some pieces in your shopping bag on <strong>Juta Kapra</strong>, but left before completing your order.
    </p>

    <!-- Cart Table -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 22px 0 16px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; font-family: monospace;">Item in Bag</th>
          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #232833; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; font-family: monospace;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      ${
        totalFormatted
          ? `
        <tfoot>
          <tr>
            <td style="padding-top: 14px; font-size: 14px; font-weight: 700; color: #ffffff;">Estimated Subtotal</td>
            <td align="right" style="padding-top: 14px; font-size: 16px; font-weight: 800; color: #60a5fa; font-family: monospace;">
              Rs. ${totalFormatted}
            </td>
          </tr>
        </tfoot>
      `
          : ''
      }
    </table>

    <!-- Authenticity & Scarcity Reminder (No Discounts) -->
    <div style="background-color: #171b24; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 22px 0;">
      <p style="margin: 0; font-size: 13px; color: #fcd34d; font-weight: 700;">
        ⚠️ 1-of-1 Archival Availability Notice
      </p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
        Because our vintage footwear, archival jackets, shirts, and watches are rare single-edition pieces, items in your cart are not reserved until checkout is completed and remain open to other collectors.
      </p>
    </div>

    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
      If you need assistance with specific measurements, condition notes, or delivery options, simply reply to this email and our team will assist you.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Your Curated Bag Awaits',
    subtitle: 'Your selected pieces are ready for checkout.',
    contentHtml,
    actionButton: {
      text: 'Return to Cart & Complete Order',
      url: checkoutUrl,
      style: 'primary',
    },
    badgeText: 'Items In Bag',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `You left items in your Juta Kapra cart. Complete your order at ${checkoutUrl}`,
    type: 'abandoned_cart',
    metadata: { itemCount: cartItems?.length || 0, cartTotal },
  });
}

/**
 * EMAIL 8: Review Request / Feedback
 * When to Send: 7 to 10 days after the package has been marked as delivered by the courier.
 * Content Focus: Check in on how they are liking their new shoes, jacket, shirt, or watch, and invite them to leave feedback on the store.
 * Strict Rule: No discount rewards, coupons, or incentives.
 */
export async function sendReviewRequestEmail(options: {
  to: string;
  name?: string;
  orderNumber: string;
  items: any[];
  reviewUrl?: string;
}): Promise<boolean> {
  const { to, name, orderNumber, items, reviewUrl } = options;
  const recipientEmail = (to || '').toLowerCase().trim();
  const customerName = name || recipientEmail.split('@')[0] || 'Collector';
  const subject = `How is your new piece? | Juta Kapra Feedback`;

  const destinationReviewUrl = reviewUrl || `${STORE_URL}/orders?review=${encodeURIComponent(orderNumber)}`;

  const itemsSummary = (items || [])
    .map((item: any) => `${item.product?.title || item.name || 'Archival Piece'}`)
    .join(', ');

  const contentHtml = `
    <p style="margin-top: 0; color: #f1f5f9; font-size: 16px;">
      Hello <strong>${customerName}</strong>,
    </p>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      It has been about a week since your Juta Kapra parcel for order <strong>#${orderNumber}</strong> was delivered. We hope your piece has arrived safely and fits seamlessly into your rotation!
    </p>

    <!-- Order Items Spotlight -->
    <div style="background-color: #0b0e14; border: 1px solid #232833; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
      <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace;">
        Delivered Items:
      </p>
      <p style="margin: 0; font-size: 13px; color: #ffffff; font-weight: 600;">
        ${itemsSummary || 'Archival Vintage Footwear / Apparel'}
      </p>
    </div>

    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Whether you picked up a pair of vintage shoes, an archival jacket, a single-stitch shirt, or a heritage watch, your honest feedback helps us maintain high standards of condition grading and authentication.
    </p>

    <!-- Feedback Topics -->
    <div style="background-color: #171b24; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #ffffff; font-weight: 700;">
        We'd love to know:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
        <li>Did the piece match the photos and condition description?</li>
        <li>How does the sizing and fit feel?</li>
        <li>How was the courier packaging and delivery experience?</li>
      </ul>
    </div>

    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
      Taking 60 seconds to share your review helps our small community of collectors across Pakistan.
    </p>
  `;

  const html = buildBrandedHtmlEmail({
    title: 'Collector Review & Feedback',
    subtitle: `Share your experience with order #${orderNumber}.`,
    contentHtml,
    actionButton: {
      text: 'Leave Your Review & Feedback',
      url: destinationReviewUrl,
      style: 'primary',
    },
    badgeText: 'Verified Customer Review',
  });

  return sendNotificationEmail({
    to: recipientEmail,
    subject,
    htmlBody: html,
    body: `How is your piece from order #${orderNumber}? Leave your honest review on Juta Kapra: ${destinationReviewUrl}`,
    type: 'review_request',
    metadata: { orderNumber },
  });
}

// ==============================================================================
// DEVICE DETECTION & PARSING UTILITY
// ==============================================================================

export function parseDeviceDetails(userAgentRaw?: string, ipRaw?: string) {
  const ua = userAgentRaw || '';
  const ip = (ipRaw || '').split(',')[0].trim() || 'Unknown IP';

  let os = 'Unknown OS';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';

  let device = 'Desktop Computer';
  if (/mobile/i.test(ua)) device = 'Mobile Phone';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet Device';

  const deviceKey = `${browser}_${os}_${device}`.replace(/\s+/g, '-').toLowerCase();

  return { device, browser, os, ip, deviceKey, rawUserAgent: ua };
}

// ==============================================================================
// MAIN NOTIFICATION DISPATCHER (SMTP with Webhook Mirroring)
// ==============================================================================

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
      subject: subject || 'Juta Kapra Notification',
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
      subject: subject || 'Juta Kapra Notification',
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

// ==============================================================================
// EMAIL TRIGGER & TEMPLATE MATRIX SPECIFICATION
// ==============================================================================

export const EMAIL_TRIGGER_MATRIX = [
  {
    id: 'welcome',
    category: 'Account & Security',
    name: 'Welcome Email',
    trigger: 'Instantly after a user successfully creates a new account or signs up on the website.',
    contentFocus: 'Welcome them to Juta Kapra, highlight the product range (shoes, jackets, shirts, and watches), and invite them to explore new arrivals. (No discount codes).',
    fnName: 'sendWelcomeEmail',
    strictRule: 'No discounts or coupons',
  },
  {
    id: 'password_reset',
    category: 'Account & Security',
    name: 'Password Reset',
    trigger: 'Instantly when a user clicks "Forgot Password" on the login page.',
    contentFocus: 'Provide a secure reset link (valid for 24 hours), instant 6-digit OTP code, and a security notice if they didn\'t request it.',
    fnName: 'sendPasswordResetEmail',
    strictRule: '24-hour expiration notice & security warning',
  },
  {
    id: 'login_alert',
    category: 'Account & Security',
    name: 'Account Login Notification',
    trigger: 'Automatically when a login is detected from a new device, browser, or unrecognized location.',
    contentFocus: 'Alert the user with device/time details and give instructions to secure the account if it wasn\'t them.',
    fnName: 'sendAccountLoginNotificationEmail',
    strictRule: 'Device, browser, IP & timestamp details included',
  },
  {
    id: 'order_confirmation',
    category: 'Transactional & Order',
    name: 'Order Confirmation',
    trigger: 'Immediately after a customer successfully places an order and completes checkout.',
    contentFocus: 'Order number, date, itemized list (product name, size, quantity, price), shipping address, and confirmation that the team is prepping the package.',
    fnName: 'sendOrderConfirmationEmail',
    strictRule: 'No discount codes',
  },
  {
    id: 'order_shipped',
    category: 'Transactional & Order',
    name: 'Shipping & Fulfillment Notice',
    trigger: 'As soon as the package is packed, labeled, and handed over to the delivery courier.',
    contentFocus: 'Courier name, tracking number, a direct tracking link button, and estimated delivery timeframe (2 to 4 business days).',
    fnName: 'sendShippingFulfillmentEmail',
    strictRule: 'Direct courier tracking button',
  },
  {
    id: 'order_cancelled',
    category: 'Transactional & Order',
    name: 'Order Cancellation / Refund Notice',
    trigger: 'Immediately if an order is canceled by the customer or if an item runs out of stock.',
    contentFocus: 'Clear reason for cancellation, order number, and details regarding the full refund processing back to their original payment method (or COD confirmation).',
    fnName: 'sendOrderCancellationEmail',
    strictRule: 'Clear refund timeline & zero charges for COD',
  },
  {
    id: 'abandoned_cart',
    category: 'Post-Purchase & Retention',
    name: 'Abandoned Cart Recovery',
    trigger: '1 to 24 hours after a customer adds items (shoes, jackets, shirts, watches) to their cart but leaves without checking out.',
    contentFocus: 'A friendly reminder showing the exact items left behind with a direct link back to checkout. (No discount incentives).',
    fnName: 'sendAbandonedCartEmail',
    strictRule: 'Strictly NO discount codes or promo incentives',
  },
  {
    id: 'review_request',
    category: 'Post-Purchase & Retention',
    name: 'Review Request / Feedback',
    trigger: '7 to 10 days after the package has been marked as delivered by the courier.',
    contentFocus: 'Check in on how they are liking their new shoes, jacket, shirt, or watch, and invite them to leave feedback on the store. (No discount rewards).',
    fnName: 'sendReviewRequestEmail',
    strictRule: 'Strictly NO discount rewards or coupon incentives',
  },
];
