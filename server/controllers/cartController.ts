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
 * 3. GET /api/cron/abandoned-carts (Automated 1 to 24 Hour Abandoned Cart Recovery Pipeline)
 * When to Send: 1 to 24 hours after a customer adds items (shoes, jackets, shirts, watches)
 * to their cart but leaves without checking out. Strict: No discount codes.
 */
export async function cronAbandonedCarts(req: Request, res: Response): Promise<void> {
  try {
    const carts = FileDB.getCarts();
    const orders = FileDB.getOrders();
    const now = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const force = req.query.force === 'true';

    // Emails with orders placed in the last 24h are not abandoned
    const recentOrderEmails = new Set(
      orders
        .filter((o) => now - new Date(o.createdAt).getTime() <= TWENTY_FOUR_HOURS_MS)
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

      // Check if cart is between 1 and 24 hours old (or forced in test mode)
      const isEligible = force || (diff >= ONE_HOUR_MS && diff <= TWENTY_FOUR_HOURS_MS);

      if (isEligible && Array.isArray(cart.items) && cart.items.length > 0) {
        try {
          await sendAbandonedCartEmail({
            to: email,
            name: cart.customerName,
            cartItems: cart.items,
            cartTotal: cart.total,
          });

          cart.abandonedEmailSent = true;
          cart.abandonedEmailSentAt = new Date().toISOString();
          FileDB.saveCart(cart);
          dispatched.push(email);
        } catch (e: any) {
          console.warn(`[Abandoned Cart Dispatch Notice for ${email}]:`, e.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Checked abandoned carts. Dispatched recovery emails to ${dispatched.length} recipients.`,
      dispatchedCount: dispatched.length,
      recipients: dispatched,
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
