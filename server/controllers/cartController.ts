import { Request, Response } from 'express';
import { FileDB } from '../services/fileDatabase.js';
import { sendAbandonedCartEmail } from '../services/emailService.js';

/**
 * 1. POST /api/cart/sync (Sync active cart session with backend for recovery pipeline)
 */
export async function syncCart(req: Request, res: Response): Promise<void> {
  try {
    const { email, customerName, items, total } = req.body || {};

    if (!email || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Valid email and non-empty items array are required.' });
      return;
    }

    const saved = FileDB.saveCart({
      email: email.toLowerCase().trim(),
      customerName: customerName || email.split('@')[0],
      items,
      total: Number(total) || 0,
      abandonedEmailSent: false,
    });

    res.status(200).json({
      success: true,
      message: 'Cart state synchronized.',
      cart: saved,
    });
  } catch (error: any) {
    console.error('Sync cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync cart.', error: error.message });
  }
}

/**
 * 2. POST /api/cart/clear (Remove active cart after checkout or cart empty)
 */
export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body || {};
    if (email) {
      FileDB.deleteCart(String(email));
    }
    res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
}

/**
 * 3. GET /api/cron/abandoned-carts (Automated 10-Hour Urgency Abandoned Cart Recovery Pipeline)
 * When to Send: When items remain in a customer's cart for >= 10 hours without checking out.
 * Subject: "Get your order delivered before someone else grabs it! | Juta Kapra"
 * Strict Rule: No discount codes or promo vouchers.
 */
export async function executeAbandonedCartsScan(force: boolean = false): Promise<{ count: number; recipients: string[] }> {
  const carts = FileDB.getCarts();
  const orders = FileDB.getOrders();
  const now = Date.now();
  const TEN_HOURS_MS = 10 * 60 * 60 * 1000; // Strict 10-Hour Inactivity Threshold
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  // Emails with orders placed in the last 48h are not abandoned
  const recentOrderEmails = new Set(
    orders
      .filter((o) => now - new Date(o.createdAt).getTime() <= FORTY_EIGHT_HOURS_MS)
      .map((o) => (o.customer?.email || '').toLowerCase().trim())
      .filter(Boolean)
  );

  const dispatched: string[] = [];

  for (const cart of carts) {
    const email = (cart.email || cart.customerEmail || '').toLowerCase().trim();
    if (!email) continue;

    // If user completed an order recently, purge cart and skip
    if (recentOrderEmails.has(email)) {
      FileDB.deleteCart(email);
      continue;
    }

    if (cart.abandonedEmailSent && !force) continue;

    const updatedAt = new Date(cart.updatedAt || cart.createdAt).getTime();
    const diff = now - updatedAt;

    // Check if cart has been inactive for >= 10 hours
    const isEligible = force || (diff >= TEN_HOURS_MS && diff <= FORTY_EIGHT_HOURS_MS);

    if (isEligible && Array.isArray(cart.items) && cart.items.length > 0) {
      try {
        await sendAbandonedCartEmail({
          to: email,
          name: cart.customerName,
          cartItems: cart.items,
          cartTotal: cart.total,
          recoveryUrl: 'https://www.jutakapra.store/cart',
        });

        cart.abandonedEmailSent = true;
        cart.abandonedEmailSentAt = new Date().toISOString();
        FileDB.saveCart(cart);
        dispatched.push(email);
      } catch (e: any) {
        console.warn(`[10-Hour Abandoned Cart Notice for ${email}]:`, e.message);
      }
    }
  }

  return { count: dispatched.length, recipients: dispatched };
}

export async function cronAbandonedCarts(req: Request, res: Response): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const result = await executeAbandonedCartsScan(force);

    res.status(200).json({
      success: true,
      message: `Checked 10-hour abandoned carts. Dispatched recovery emails to ${result.count} recipients.`,
      dispatchedCount: result.count,
      recipients: result.recipients,
    });
  } catch (error: any) {
    console.error('Cron abandoned carts error:', error);
    res.status(500).json({ success: false, message: 'Cron abandoned carts failed.', error: error.message });
  }
}

/**
 * 4. POST /api/cart/test-abandoned (Staff test trigger with sample archival items)
 */
export async function sendTestAbandonedCart(req: Request, res: Response): Promise<void> {
  try {
    const { email, name } = req.body || {};
    const targetEmail = (email || 'support@jutakapra.store').toLowerCase().trim();

    // Sample showcase pieces covering all core store categories: shoes, jackets, shirts, watches
    const sampleItems = [
      {
        product: {
          title: 'Archival 1994 Air Pegasus Runner',
          category: 'Vintage Shoes & Footwear',
          price: 14500,
        },
        selectedSize: 'US 10 / EU 44',
      },
      {
        product: {
          title: 'Distressed Vintage Leather Aviator Bomber Jacket',
          category: 'Archival Outerwear',
          price: 26000,
        },
        selectedSize: 'L (Chest 44")',
      },
      {
        product: {
          title: 'Single-Stitch Heavyweight Washed Graphic Tee',
          category: 'Vintage Shirts & Tops',
          price: 4800,
        },
        selectedSize: 'XL',
      },
      {
        product: {
          title: 'Retro Stainless Chronograph Classic Timepiece',
          category: 'Classic Watches',
          price: 18500,
        },
        selectedSize: 'Adjustable 38mm',
      },
    ];

    const sampleTotal = sampleItems.reduce((acc, i) => acc + i.product.price, 0);

    const sent = await sendAbandonedCartEmail({
      to: targetEmail,
      name: name || 'Valued Collector',
      cartItems: sampleItems,
      cartTotal: sampleTotal,
    });

    res.status(200).json({
      success: sent,
      message: `Test abandoned cart recovery email sent to ${targetEmail}.`,
      items: sampleItems,
      total: sampleTotal,
    });
  } catch (error: any) {
    console.error('Test abandoned cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test abandoned cart email.', error: error.message });
  }
}
