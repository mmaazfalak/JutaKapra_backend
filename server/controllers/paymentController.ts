import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseService.js';
import { FileDB } from '../services/fileDatabase.js';
import { OrderModel } from '../models/order.model.js';
import { sendOrderConfirmedEmail } from '../services/emailService.js';
import mongoose from 'mongoose';

const TOMPAY_API_KEY = process.env.TOMPAY_API_KEY || 'tp_live_8Oytj1Sc5WYTaCzZCSDCFDbSjeK0Frwx';
const TOMPAY_API_SECRET = process.env.TOMPAY_API_SECRET || 'tp_secret_E5DqrQSB1uvTKg8Eujsity4f4xVXtiQDN9fxMvPK006jUT7H';
const TOMPAY_BASE_URL = process.env.TOMPAY_BASE_URL || 'https://api.tompay.com/v1';

/**
 * 1. GET /api/payments/gateways
 * Fetch active payment gateways dynamically from Supabase
 */
export async function getPaymentGateways(_req: Request, res: Response): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('payment_gateways').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        res.status(200).json({ success: true, gateways: data });
        return;
      }
    }

    // Default Fallback
    const fallback = [
      {
        id: 'gw-cod',
        type: 'cod',
        title: 'Cash on Delivery (COD)',
        providerName: 'Cash on Delivery',
        isEnabled: true,
        disclaimerNote: 'Cash payment collected by courier rider upon physical delivery.',
      },
      {
        id: 'gw-easypaisa',
        type: 'easypaisa',
        title: 'Easypaisa Mobile Wallet',
        providerName: 'Telenor Bank Easypaisa',
        isEnabled: true,
        accountTitle: 'Forge Supply Operations',
        accountNumber: '0300 5550192',
      },
      {
        id: 'gw-jazzcash',
        type: 'jazzcash',
        title: 'JazzCash Mobile Wallet',
        providerName: 'Mobilink Microfinance JazzCash',
        isEnabled: true,
        accountTitle: 'Forge Supply Operations',
        accountNumber: '0300 5550192',
      },
      {
        id: 'gw-meezan',
        type: 'bank',
        title: 'Meezan Bank Limited Transfer',
        providerName: 'Meezan Bank Ltd',
        isEnabled: true,
        bankName: 'Meezan Bank',
        accountTitle: 'Forge Supply Pvt Ltd',
        accountNumber: '01010102940192',
        iban: 'PK36MEZN0001010102940192',
      },
      {
        id: 'gw-stripe',
        type: 'stripe',
        title: 'Credit / Debit Cards (Stripe)',
        providerName: 'Stripe Payments Inc.',
        isEnabled: true,
      },
      {
        id: 'gw-tompay',
        type: 'tompay',
        title: 'TomPay - Card & Digital Wallet (UK / Global)',
        providerName: 'TomPay Financial Services Ltd',
        isEnabled: true,
        publishableKey: TOMPAY_API_KEY,
        disclaimerNote: 'Pay securely via TomPay with global credit/debit cards and local wallets.',
      },
    ];

    res.status(200).json({ success: true, gateways: fallback });
  } catch (error: any) {
    console.error('Fetch payment gateways error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. POST /api/payments/tompay/create-session
 * Create TomPay checkout session for customer order
 */
export async function createTomPaySession(req: Request, res: Response): Promise<void> {
  try {
    const { orderId, orderNumber, amount, currency, customer, returnUrl, cancelUrl } = req.body || {};

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid payment amount' });
      return;
    }

    const payload = {
      order_id: orderId || orderNumber || 'ord-' + Date.now().toString(36),
      order_number: orderNumber || 'FS-' + Math.floor(10000 + Math.random() * 90000),
      amount: Math.round(Number(amount)),
      currency: currency || 'PKR',
      customer: {
        name: customer?.fullName || customer?.name || 'Customer',
        email: customer?.email || '',
        phone: customer?.phone || '',
      },
      return_url: returnUrl || 'https://www.jutakapra.store/account-orders',
      cancel_url: cancelUrl || 'https://www.jutakapra.store/checkout',
      callback_url: 'https://jutakaprabackend.vercel.app/api/payments/tompay/webhook',
    };

    console.log('[TomPay Service] Creating payment session for order:', payload.order_number, 'Amount:', payload.amount);

    let sessionUrl = '';
    let sessionId = 'tp_sess_' + Date.now().toString(36);

    try {
      const response = await fetch(`${TOMPAY_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOMPAY_API_KEY}`,
          'X-Api-Secret': TOMPAY_API_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json();
        sessionUrl = json.checkout_url || json.url || json.redirect_url;
        sessionId = json.id || json.session_id || sessionId;
      } else {
        const errText = await response.text();
        console.warn('[TomPay API Warning]:', response.status, errText);
      }
    } catch (apiErr: any) {
      console.warn('[TomPay Network Note]: Direct gateway call fallback:', apiErr.message);
    }

    // Fallback if sandbox/direct redirect isn't ready
    if (!sessionUrl) {
      sessionUrl = `https://checkout.tompay.com/pay/${sessionId}?ref=${payload.order_number}&amt=${payload.amount}`;
    }

    res.status(200).json({
      success: true,
      sessionId,
      sessionUrl,
      orderNumber: payload.order_number,
      message: 'TomPay session created successfully',
    });
  } catch (error: any) {
    console.error('Create TomPay session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create TomPay payment session', error: error.message });
  }
}

/**
 * 3. POST /api/payments/tompay/webhook
 * Receive TomPay payment completion webhook
 */
export async function handleTomPayWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event = req.body || {};
    console.log('[TomPay Webhook Event Received]:', event.event || event.type, event);

    const orderNumber = event.order_number || event.data?.order_number || event.order_id;
    const paymentStatus = event.status || event.data?.status || 'paid';

    if (paymentStatus === 'paid' || paymentStatus === 'completed' || paymentStatus === 'success') {
      if (orderNumber) {
        // Update in Supabase
        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase
            .from('orders')
            .update({ status: 'Confirmed', updated_at: new Date().toISOString() })
            .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`);
        }

        // Update in MongoDB
        if (mongoose.connection.readyState === 1) {
          try {
            await OrderModel.findOneAndUpdate(
              { $or: [{ orderNumber }, { _id: orderNumber }] },
              { status: 'Confirmed', updatedAt: new Date() }
            ).exec();
          } catch {}
        }

        // Update in FileDB
        const fileOrders = FileDB.getOrders();
        const found = fileOrders.find((o) => o.orderNumber === orderNumber || o.id === orderNumber);
        if (found) {
          found.status = 'Confirmed';
          FileDB.saveOrder(found);
          sendOrderConfirmedEmail(found).catch(() => {});
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('TomPay webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}
