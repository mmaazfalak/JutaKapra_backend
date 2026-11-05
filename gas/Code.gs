/**
 * ============================================================================
 * JUTA.KAPRA ARCHIVE - Google Apps Script (GAS) Backend
 * File: Code.gs
 * Description: Production-ready email dispatcher & Google Sheets sync engine.
 * Supports:
 *   1. send_order_placed     - Exactly one confirmation email on order placement
 *   2. send_order_confirmed  - Notification when admin confirms order
 *   3. send_order_dispatched - Notification with courier details & Estimated Delivery Date
 *   4. send_cart_abandoned   - 10-Hour Urgency reminder ("Get your order delivered before someone else grabs it!")
 *   5. send_otp              - 2FA & Auth OTP verification code
 *   6. sync_sheet            - Logging orders and customer registrations
 *
 * Includes: CacheService-powered deduplication lock to guarantee zero duplicate emails.
 * ============================================================================
 */

// Configuration Defaults
var SENDER_NAME = "Juta.Kapra Archive";
var ADMIN_EMAIL = "mmaazfalak@icloud.com";
var STORE_URL = "https://www.jutakapra.store";
var DEDUPE_CACHE_TTL_SEC = 120; // 2 minutes deduplication window

/**
 * HTTP GET - Health Check Endpoint
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "active",
      service: "Juta.Kapra Notification & Sheets Engine",
      version: "2.1.0",
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST - Central Webhook Dispatcher
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock to prevent race conditions during high-concurrency bursts
    lock.waitLock(10000);

    var rawData = e && e.postData ? e.postData.contents : "";
    if (!rawData) {
      return createJsonResponse({ success: false, message: "Empty request payload" }, 400);
    }

    var data;
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      return createJsonResponse({ success: false, message: "Invalid JSON format", error: parseErr.toString() }, 400);
    }

    // Normalize Action / Type
    var action = (data.action || data.type || data.eventType || "").toLowerCase().trim();
    if (!action) {
      return createJsonResponse({ success: false, message: "Missing required 'action' or 'type' in payload" }, 400);
    }

    // ------------------------------------------------------------------------
    // Deduplication Lock via CacheService
    // ------------------------------------------------------------------------
    var dedupeKey = generateDedupeKey(action, data);
    var cache = CacheService.getScriptCache();
    if (dedupeKey && cache.get(dedupeKey)) {
      Logger.log("[GAS Deduplication] Suppressed duplicate trigger for key: " + dedupeKey);
      return createJsonResponse({
        success: true,
        duplicate: true,
        message: "Duplicate trigger suppressed by deduplication lock",
        dedupeKey: dedupeKey
      });
    }

    var result = { success: false, message: "Unknown action" };

    // ------------------------------------------------------------------------
    // Action Dispatch Matrix
    // ------------------------------------------------------------------------
    switch (action) {
      case "send_order_placed":
      case "order_placed":
      case "order_confirmation":
        result = handleSendOrderPlaced(data);
        break;

      case "send_order_confirmed":
      case "order_confirmed":
        result = handleSendOrderConfirmed(data);
        break;

      case "send_order_dispatched":
      case "order_dispatched":
      case "order_shipped":
        result = handleSendOrderDispatched(data);
        break;

      case "send_cart_abandoned":
      case "abandoned_cart":
      case "cart_abandoned":
        result = handleSendCartAbandoned(data);
        break;

      case "send_otp":
      case "auth_otp":
      case "admin_login_otp":
        result = handleSendOtp(data);
        break;

      case "order_status":
      case "sync_sheet":
      case "registration":
        result = handleSheetSync(data);
        break;

      default:
        // Generic fallback for custom notification templates
        if (data.to && (data.htmlBody || data.body || data.subject)) {
          result = handleGenericEmail(data);
        } else {
          result = { success: false, message: "Unrecognized action: " + action };
        }
        break;
    }

    // Cache dedupe key only if email/action was successfully processed
    if (result.success && dedupeKey) {
      cache.put(dedupeKey, "processed", DEDUPE_CACHE_TTL_SEC);
    }

    return createJsonResponse(result);

  } catch (err) {
    Logger.log("[GAS Webhook Error] " + err.toString());
    return createJsonResponse({ success: false, message: "Internal GAS Exception", error: err.toString() }, 500);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

// ============================================================================
// 1. ACTION: send_order_placed (Exactly One Confirmation Email)
// ============================================================================
function handleSendOrderPlaced(data) {
  var to = (data.to || (data.customer && data.customer.email) || data.email || "").trim();
  if (!to) {
    return { success: false, message: "Missing recipient email for order confirmation" };
  }

  var orderNumber = data.orderNumber || data.id || "FS-ORDER";
  var customerName = (data.customer && data.customer.fullName) || data.customerName || to.split("@")[0];
  var total = data.total || data.totalAmount || 0;
  var items = data.items || [];
  var paymentMethod = (data.paymentMethod || "Cash on Delivery").toUpperCase();

  var itemsHtml = buildItemsTable(items);

  var subject = "Order Placed: #" + orderNumber + " - Juta.Kapra";
  var htmlBody = "" +
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;\">" +
      "<div style=\"border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;\">" +
        "<span style=\"font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;\">JUTA<span style=\"color:#e5341f;\">.</span>KAPRA</span>" +
        "<span style=\"display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 2px;\">Archival Vault</span>" +
      "</div>" +
      "<div style=\"display: inline-block; padding: 4px 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; font-size: 11px; font-weight: 800; color: #60a5fa; text-transform: uppercase; margin-bottom: 12px;\">" +
        "📦 Order Received" +
      "</div>" +
      "<h2 style=\"font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff;\">Grail Acquired, " + customerName + "!</h2>" +
      "<p style=\"font-size: 13px; line-height: 1.6; color: #d4d4d8; margin: 0 0 20px 0;\">" +
        "Your order <strong style=\"color:#ffffff;\">#" + orderNumber + "</strong> has been received and logged into our inventory system. Our curation team is verifying the pieces for packaging." +
      "</p>" +
      itemsHtml +
      "<div style=\"margin: 20px 0; padding: 14px; background: #141416; border: 1px solid #27272a; border-radius: 10px; font-size: 12px;\">" +
        "<div style=\"display: flex; justify-content: space-between; margin-bottom: 6px;\">" +
          "<span style=\"color: #a1a1aa;\">Payment Method:</span>" +
          "<span style=\"font-weight: 700; color: #ffffff;\">" + paymentMethod + "</span>" +
        "</div>" +
        "<div style=\"display: flex; justify-content: space-between;\">" +
          "<span style=\"color: #a1a1aa;\">Total Amount:</span>" +
          "<span style=\"font-weight: 900; color: #ffffff; font-size: 14px;\">Rs. " + formatMoney(total) + "</span>" +
        "</div>" +
      "</div>" +
      "<p style=\"font-size: 12px; color: #71717a; line-height: 1.5; margin: 20px 0 0 0;\">" +
        "Our pieces are strictly 1-of-1 archival garments. You will receive an email the moment your order is confirmed by our operations team." +
      "</p>" +
    "</div>";

  sendMailInternal(to, subject, htmlBody);

  // Send admin notification copy
  if (to.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    sendMailInternal(ADMIN_EMAIL, "[ADMIN ALERT] New Order #" + orderNumber + " by " + customerName, htmlBody);
  }

  // Also record to Google Sheet if active sheet bound
  logOrderToSheet(data);

  return { success: true, message: "Order placed confirmation sent", orderNumber: orderNumber };
}

// ============================================================================
// 2. ACTION: send_order_confirmed (Admin Confirmed Order Notification)
// ============================================================================
function handleSendOrderConfirmed(data) {
  var to = (data.to || (data.customer && data.customer.email) || data.email || "").trim();
  if (!to) {
    return { success: false, message: "Missing recipient email" };
  }

  var orderNumber = data.orderNumber || data.id || "FS-ORDER";
  var customerName = (data.customer && data.customer.fullName) || data.customerName || to.split("@")[0];
  var total = data.total || data.totalAmount || 0;

  var subject = "Order Confirmed: #" + orderNumber + " - Juta.Kapra";
  var htmlBody = "" +
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;\">" +
      "<div style=\"border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;\">" +
        "<span style=\"font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;\">JUTA<span style=\"color:#e5341f;\">.</span>KAPRA</span>" +
        "<span style=\"display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 2px;\">Archival Vault</span>" +
      "</div>" +
      "<div style=\"display: inline-block; padding: 4px 10px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase; margin-bottom: 12px;\">" +
        "✓ Order Confirmed" +
      "</div>" +
      "<h2 style=\"font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff;\">Great news, " + customerName + "!</h2>" +
      "<p style=\"font-size: 13px; line-height: 1.6; color: #d4d4d8; margin: 0 0 16px 0;\">" +
        "Your order <strong style=\"color:#ffffff;\">#" + orderNumber + "</strong> has been officially confirmed by our curators. Your pieces have been inspected, tagged, and transferred to the packaging station for courier pickup." +
      "</p>" +
      "<div style=\"margin: 18px 0; padding: 14px; background: #141416; border: 1px solid #27272a; border-radius: 10px; font-size: 12px;\">" +
        "<p style=\"margin: 0; color: #ffffff; font-weight: 700;\">Order Value: Rs. " + formatMoney(total) + "</p>" +
        "<p style=\"margin: 4px 0 0 0; color: #a1a1aa;\">Status: Confirmed • Preparing for Courier Handoff</p>" +
      "</div>" +
      "<p style=\"font-size: 12px; color: #71717a; line-height: 1.5; margin: 16px 0 0 0;\">" +
        "You will receive your tracking number and estimated arrival date as soon as the rider collects the consignment." +
      "</p>" +
    "</div>";

  sendMailInternal(to, subject, htmlBody);
  return { success: true, message: "Order confirmed notification sent", orderNumber: orderNumber };
}

// ============================================================================
// 3. ACTION: send_order_dispatched (Courier + Estimated Delivery Date)
// ============================================================================
function handleSendOrderDispatched(data) {
  var to = (data.to || (data.customer && data.customer.email) || data.email || "").trim();
  if (!to) {
    return { success: false, message: "Missing recipient email" };
  }

  var orderNumber = data.orderNumber || data.id || "FS-ORDER";
  var customerName = (data.customer && data.customer.fullName) || data.customerName || to.split("@")[0];
  var courier = data.courierName || data.courier || "TCS Express";
  var tracking = data.trackingNumber || "Pending";
  var trackingUrl = data.trackingUrl || "";
  var estimatedDate = data.estimatedDeliveryDate || data.estimatedDate || "Within 2-3 business days";

  var subject = "Dispatched: Order #" + orderNumber + " via " + courier + " (" + tracking + ")";
  var htmlBody = "" +
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;\">" +
      "<div style=\"border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;\">" +
        "<span style=\"font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;\">JUTA<span style=\"color:#e5341f;\">.</span>KAPRA</span>" +
        "<span style=\"display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 2px;\">Archival Vault</span>" +
      "</div>" +
      "<div style=\"display: inline-block; padding: 4px 10px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin-bottom: 12px;\">" +
        "🚚 Dispatched to Courier" +
      "</div>" +
      "<h2 style=\"font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff;\">Your Pieces Are On The Road!</h2>" +
      "<p style=\"font-size: 13px; line-height: 1.6; color: #d4d4d8; margin: 0 0 20px 0;\">" +
        "Hello <strong style=\"color:#ffffff;\">" + customerName + "</strong>, your order <strong style=\"color:#ffffff;\">#" + orderNumber + "</strong> has been handed over to the courier partner." +
      "</p>" +
      "<div style=\"margin: 18px 0; padding: 18px; background: #141416; border: 1px solid #27272a; border-radius: 12px;\">" +
        "<div style=\"margin-bottom: 12px;\">" +
          "<span style=\"font-size: 11px; text-transform: uppercase; color: #a1a1aa; font-weight: 700; display: block;\">Courier Partner</span>" +
          "<span style=\"font-size: 15px; font-weight: 800; color: #ffffff;\">" + courier + "</span>" +
        "</div>" +
        "<div style=\"margin-bottom: 12px;\">" +
          "<span style=\"font-size: 11px; text-transform: uppercase; color: #a1a1aa; font-weight: 700; display: block;\">Tracking Number / Waybill</span>" +
          "<span style=\"font-size: 16px; font-family: monospace; font-weight: 900; color: #60a5fa;\">" + tracking + "</span>" +
        "</div>" +
        "<div style=\"padding-top: 10px; border-top: 1px solid #27272a;\">" +
          "<span style=\"font-size: 11px; text-transform: uppercase; color: #34d399; font-weight: 800; display: block;\">Estimated Delivery Date</span>" +
          "<span style=\"font-size: 14px; font-weight: 800; color: #ffffff;\">📅 " + estimatedDate + "</span>" +
        "</div>" +
      "</div>" +
      (trackingUrl ? "<div style=\"margin: 20px 0;\"><a href=\"" + trackingUrl + "\" style=\"display: inline-block; padding: 10px 22px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 12px;\">Track Consignment Online →</a></div>" : "") +
    "</div>";

  sendMailInternal(to, subject, htmlBody);
  return { success: true, message: "Order dispatched notification sent", orderNumber: orderNumber, estimatedDeliveryDate: estimatedDate };
}

// ============================================================================
// 4. ACTION: send_cart_abandoned (10-Hour Urgency Reminder)
// ============================================================================
function handleSendCartAbandoned(data) {
  var to = (data.to || data.email || "").trim();
  if (!to) {
    return { success: false, message: "Missing recipient email" };
  }

  var name = data.name || data.customerName || to.split("@")[0];
  var cartItems = data.cartItems || data.items || [];
  var total = data.cartTotal || data.total || 0;
  var checkoutUrl = data.checkoutUrl || (STORE_URL + "/cart");

  var itemsHtml = buildItemsTable(cartItems);

  var subject = "Get your order delivered before someone else grabs it! | Juta.Kapra";
  var htmlBody = "" +
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;\">" +
      "<div style=\"border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;\">" +
        "<span style=\"font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;\">JUTA<span style=\"color:#e5341f;\">.</span>KAPRA</span>" +
        "<span style=\"display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 2px;\">Archival Vault</span>" +
      "</div>" +
      "<div style=\"display: inline-block; padding: 4px 10px; background: rgba(229,52,31,0.15); border: 1px solid rgba(229,52,31,0.3); border-radius: 6px; font-size: 11px; font-weight: 800; color: #f87171; text-transform: uppercase; margin-bottom: 12px;\">" +
        "⚡ Rare 1-of-1 Vault Alert" +
      "</div>" +
      "<h2 style=\"font-size: 18px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff;\">Get your order delivered before someone else grabs it!</h2>" +
      "<p style=\"font-size: 13px; line-height: 1.6; color: #d4d4d8; margin: 0 0 18px 0;\">" +
        "Hello <strong style=\"color:#ffffff;\">" + name + "</strong>,<br/>" +
        "You left items in your shopping bag over 10 hours ago. Because every thrift piece in our archive is unique and strictly 1-of-1, inventory is not reserved until checkout is completed." +
      "</p>" +
      itemsHtml +
      (total > 0 ? "<p style=\"font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 12px;\">Cart Total: Rs. " + formatMoney(total) + "</p>" : "") +
      "<div style=\"margin: 24px 0;\">" +
        "<a href=\"" + checkoutUrl + "\" style=\"display: inline-block; padding: 12px 28px; background: #e5341f; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;\">" +
          "Claim Your Piece & Checkout Now →" +
        "</a>" +
      "</div>" +
      "<p style=\"font-size: 11px; color: #71717a; line-height: 1.4;\">" +
        "Once claimed by another collector, these vintage pieces cannot be restocked." +
      "</p>" +
    "</div>";

  sendMailInternal(to, subject, htmlBody);
  return { success: true, message: "Cart abandonment urgency reminder sent to " + to };
}

// ============================================================================
// 5. ACTION: send_otp (Auth & Security Verification Codes)
// ============================================================================
function handleSendOtp(data) {
  var to = (data.to || data.email || "").trim();
  var otp = data.otp || "";
  if (!to || !otp) {
    return { success: false, message: "Missing email or OTP code" };
  }

  var subject = "Your Juta.Kapra Verification Passcode: " + otp;
  var htmlBody = "" +
    "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 16px;\">" +
      "<h2 style=\"font-size: 18px; font-weight: 800; margin: 0 0 6px 0;\">JUTA.KAPRA ARCHIVE</h2>" +
      "<p style=\"font-size: 13px; color: #a1a1aa; margin: 0 0 20px 0;\">Security Verification Code</p>" +
      "<p style=\"font-size: 13px; color: #e4e4e7; line-height: 1.5;\">Use the following passcode to authenticate your action. Valid for 10 minutes:</p>" +
      "<div style=\"margin: 20px 0; padding: 16px; background: #141416; border: 1px solid #27272a; border-radius: 10px; text-align: center;\">" +
        "<span style=\"font-size: 32px; font-family: monospace; font-weight: 900; letter-spacing: 6px; color: #ffffff;\">" + otp + "</span>" +
      "</div>" +
      "<p style=\"font-size: 11px; color: #71717a;\">If you did not request this code, no action is required.</p>" +
    "</div>";

  sendMailInternal(to, subject, htmlBody);
  return { success: true, message: "OTP sent" };
}

// ============================================================================
// Generic Email Dispatcher
// ============================================================================
function handleGenericEmail(data) {
  var to = data.to.trim();
  var subject = data.subject || "Juta.Kapra Notification";
  var htmlBody = data.htmlBody || data.body || "";
  sendMailInternal(to, subject, htmlBody);
  return { success: true, message: "Email dispatched" };
}

// ============================================================================
// Internal Mail Helper (Uses MailApp with fallback to GmailApp)
// ============================================================================
function sendMailInternal(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: SENDER_NAME
    });
  } catch (mailErr) {
    // Fallback to GmailApp if MailApp quota or permissions differ
    GmailApp.sendEmail(to, subject, "", {
      htmlBody: htmlBody,
      name: SENDER_NAME
    });
  }
}

// ============================================================================
// Deduplication Key Generator
// ============================================================================
function generateDedupeKey(action, data) {
  var identifier = data.orderNumber || data.orderId || data.id || data.to || data.email || "";
  if (!identifier) return null;
  return "dedupe_" + action + "_" + identifier.toString().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

// ============================================================================
// Table HTML Generator for Cart / Order Items
// ============================================================================
function buildItemsTable(items) {
  if (!items || !items.length) return "";

  var rows = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var title = (item.product && item.product.title) || item.title || item.name || "Archival Thrift Piece";
    var size = (item.selectedSize || (item.product && item.product.size) || item.size || "");
    var qty = item.quantity || 1;
    var price = (item.product && item.product.price) || item.price || 0;

    rows += "" +
      "<tr style=\"border-bottom: 1px solid #27272a;\">" +
        "<td style=\"padding: 10px 0; font-size: 13px; color: #ffffff;\">" +
          title + (size ? " <span style=\"color:#a1a1aa; font-family:monospace;\">(" + size + ")</span>" : "") +
        "</td>" +
        "<td style=\"padding: 10px 0; font-size: 13px; text-align: center; color: #a1a1aa;\">" + qty + "</td>" +
        "<td style=\"padding: 10px 0; font-size: 13px; text-align: right; color: #ffffff; font-weight: 700;\">Rs. " + formatMoney(price * qty) + "</td>" +
      "</tr>";
  }

  return "" +
    "<div style=\"margin: 16px 0; padding: 14px; background: #141416; border: 1px solid #27272a; border-radius: 10px;\">" +
      "<table style=\"width: 100%; border-collapse: collapse;\">" +
        "<thead>" +
          "<tr style=\"border-bottom: 1px solid #3f3f46; text-align: left;\">" +
            "<th style=\"padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #a1a1aa;\">Item</th>" +
            "<th style=\"padding-bottom: 8px; font-size: 11px; text-transform: uppercase; text-align: center; color: #a1a1aa;\">Qty</th>" +
            "<th style=\"padding-bottom: 8px; font-size: 11px; text-transform: uppercase; text-align: right; color: #a1a1aa;\">Amount</th>" +
          "</tr>" +
        "</thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table>" +
    "</div>";
}

// ============================================================================
// Google Sheets Logger (Appends to active or linked sheet)
// ============================================================================
function logOrderToSheet(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;

    var sheet = ss.getSheetByName("Orders") || ss.getActiveSheet();
    var orderNumber = data.orderNumber || data.id || "FS-ORDER";
    var customerName = (data.customer && data.customer.fullName) || data.customerName || "";
    var email = (data.customer && data.customer.email) || data.email || "";
    var phone = (data.customer && data.customer.phone) || data.phone || "";
    var total = data.total || data.totalAmount || 0;
    var payment = (data.paymentMethod || "cod").toUpperCase();

    sheet.appendRow([
      new Date(),
      orderNumber,
      customerName,
      email,
      phone,
      total,
      payment,
      "Placed"
    ]);
  } catch (sheetErr) {
    Logger.log("[Sheet Logging Notice] " + sheetErr.toString());
  }
}

function handleSheetSync(data) {
  logOrderToSheet(data);
  return { success: true, message: "Sheet logged" };
}

// Helper formatting utilities
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString();
}

function createJsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
