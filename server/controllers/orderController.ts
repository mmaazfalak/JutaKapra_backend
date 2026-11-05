import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model.js';
import { syncToGoogleSheets } from '../services/sheetsService.js';
import { syncOrderToSupabase } from '../services/supabaseService.js';
import {
  sendOrderConfirmationEmail,
  sendShippingFulfillmentEmail,
  sendOrderCancellationEmail,
  sendReviewRequestEmail,
} from '../services/emailService.js';
import { FileDB } from '../services/fileDatabase.js';
import mongoose from 'mongoose';

// In-Memory fallback cache for orders if MongoDB is running offline
const inMemoryOrders: Map<string, any> = new Map();

/**
 * 1. POST /api/orders (Create Order & Trigger "Placed" Notification)
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body || {};
    const orderNumber = data.orderNumber || 'FS-' + Math.floor(10000 + Math.random() * 90000);

    const orderData = {
      orderNumber,
      customerId: data.customerId || '',
      customer: {
        fullName: data.customer?.fullName || data.shippingAddress?.fullName || 'Customer',
        email: data.customer?.email || data.user?.email || data.guestEmail || '',
        phone: data.customer?.phone || data.shippingAddress?.phone || '',
        address: data.customer?.address || data.shippingAddress?.street || data.shippingAddress?.address || '',
        apartment: data.customer?.apartment || data.shippingAddress?.apartment || '',
        city: data.customer?.city || data.shippingAddress?.city || 'Karachi',
        state: data.customer?.state || data.shippingAddress?.state || 'Sindh',
        postalCode: data.customer?.postalCode || data.shippingAddress?.postalCode || '',
        country: data.customer?.country || data.shippingAddress?.country || 'Pakistan',
      },
      items: data.items || data.orderItems || [],
      subtotal: data.subtotal || data.total || 0,
      shipping: data.shipping || data.shippingFee || 0,
      discount: data.discount || 0,
      total: data.total || data.totalPrice || 0,
      paymentMethod: data.paymentMethod || 'cod',
      status: 'Processing',
      courier: data.courier || '',
      trackingNumber: data.trackingNumber || '',
      createdAt: new Date(),
    };

    let savedOrder: any = null;

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const orderDoc = new OrderModel(orderData);
        savedOrder = await orderDoc.save();
      } catch (dbErr: any) {
        console.warn('[Order DB] MongoDB save error, storing in memory:', dbErr.message);
      }
    }

    if (!savedOrder) {
      savedOrder = {
        ...orderData,
        id: 'ord-' + Date.now().toString(36),
        _id: 'ord-' + Date.now().toString(36),
      };
      inMemoryOrders.set(savedOrder.id, savedOrder);
    }

    // Persist immediately to website repository database
    FileDB.saveOrder(savedOrder);

    const orderId = savedOrder._id ? savedOrder._id.toString() : savedOrder.id || orderNumber;

    // Trigger Non-Blocking Google Apps Script Webhook ("Placed" Event)
    const formattedItems = (savedOrder.items || []).map((item: any) => ({
      name: item.product?.title || item.name || 'Archival Vintage Piece',
      quantity: item.quantity || 1,
      price: item.product?.price || item.price || 0,
      size: item.selectedSize || item.size || '',
    }));

    syncToGoogleSheets({
      eventType: 'ORDER_STATUS',
      orderId,
      orderNumber,
      customerName: savedOrder.customer?.fullName || 'Customer',
      email: savedOrder.customer?.email || '',
      phone: savedOrder.customer?.phone || '',
      totalAmount: savedOrder.total || 0,
      status: 'Placed',
      trackingNumber: savedOrder.trackingNumber || '',
      courier: savedOrder.courier || '',
      items: formattedItems,
    });

    // Automatically sync order to Supabase public.orders synchronously
    try {
      await syncOrderToSupabase(savedOrder);
    } catch (e: any) {
      console.warn('[Supabase Create Order Warning]:', e.message);
    }

    // Clear active shopping cart so abandoned cart emails are never dispatched for completed orders
    if (savedOrder.customer?.email) {
      FileDB.deleteCart(savedOrder.customer.email);
    }

    // Send Order Confirmation Email via support@jutakapra.store (non-blocking)
    sendOrderConfirmationEmail(savedOrder).catch((e: any) => {
      console.warn('[Order Confirmation Email Notice]:', e.message);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again.',
      error: error.message,
    });
  }
}

/**
 * 2. PUT /api/orders/:id/status (Update Order Status -> "Dispatched" or "Delivered")
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierName, courier, trackingUrl, dispatchNote } = req.body || {};

    if (!status) {
      res.status(400).json({ success: false, message: 'Status field is required.' });
      return;
    }

    const courierUsed = courierName || courier || '';
    const trackingNum = trackingNumber || '';

    let updatedOrder: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const updateFields: Record<string, any> = { status };
        if (courierUsed) updateFields.courier = courierUsed;
        if (trackingNum) updateFields.trackingNumber = trackingNum;
        if (status === 'Delivered') updateFields.deliveredAt = new Date();

        if (trackingNum || courierUsed || dispatchNote) {
          updateFields.courierTracking = {
            courierName: courierUsed,
            trackingNumber: trackingNum,
            trackingUrl: trackingUrl || '',
            dispatchedAt: new Date().toISOString(),
            dispatchNote: dispatchNote || '',
          };
        }

        if (mongoose.Types.ObjectId.isValid(id)) {
          updatedOrder = await OrderModel.findByIdAndUpdate(id, updateFields, { new: true }).exec();
        }
        if (!updatedOrder) {
          updatedOrder = await OrderModel.findOneAndUpdate(
            { $or: [{ orderNumber: id }, { _id: id }] },
            updateFields,
            { new: true }
          ).exec();
        }
      } catch (dbErr: any) {
        console.warn('[Order DB] MongoDB update error:', dbErr.message);
      }
    }

    if (!updatedOrder) {
      const existing = inMemoryOrders.get(id) || FileDB.getOrders().find((o) => o.id === id || o.orderNumber === id);
      if (existing) {
        existing.status = status;
        if (courierUsed) existing.courier = courierUsed;
        if (trackingNum) existing.trackingNumber = trackingNum;
        if (status === 'Delivered') existing.deliveredAt = new Date().toISOString();
        inMemoryOrders.set(id, existing);
        updatedOrder = existing;
      }
    }

    if (updatedOrder) {
      FileDB.saveOrder(updatedOrder);
    }

    // Trigger Non-Blocking Google Apps Script Webhook ("Dispatched" or "Delivered" Event)
    if (status === 'Dispatched' || status === 'Dispatched to Courier' || status === 'Delivered') {
      const formattedItems = updatedOrder?.items
        ? updatedOrder.items.map((item: any) => ({
            name: item.product?.title || item.name || 'Archival Item',
            quantity: item.quantity || 1,
            price: item.product?.price || item.price || 0,
            size: item.selectedSize || item.size || '',
          }))
        : [];

      const normalizedStatus = status.includes('Dispatch') ? 'Dispatched' : status;

      syncToGoogleSheets({
        eventType: 'ORDER_STATUS',
        orderId: updatedOrder?._id?.toString() || id,
        orderNumber: updatedOrder?.orderNumber || id,
        customerName: updatedOrder?.customer?.fullName || 'Customer',
        email: updatedOrder?.customer?.email || '',
        phone: updatedOrder?.customer?.phone || '',
        totalAmount: updatedOrder?.total || 0,
        status: normalizedStatus,
        trackingNumber: trackingNum || updatedOrder?.trackingNumber || '',
        courier: courierUsed || updatedOrder?.courier || '',
        items: formattedItems,
      });
    }

    // Automatically sync updated order status to Supabase public.orders
    if (updatedOrder) {
      syncOrderToSupabase(updatedOrder).catch((e) =>
        console.warn('[Supabase Update Order Status Warning]:', e.message)
      );
    }

    // EMAIL 5: Shipping & Fulfillment Notice Trigger
    if (['Dispatched', 'Shipped', 'Dispatched to Courier', 'In Transit'].includes(status) && updatedOrder) {
      sendShippingFulfillmentEmail({
        order: updatedOrder,
        courierName: courierUsed || updatedOrder.courier,
        trackingNumber: trackingNum || updatedOrder.trackingNumber,
        trackingUrl: trackingUrl || updatedOrder.courierTracking?.trackingUrl,
        deliveryTimeframe: '2 to 4 business days nationwide',
      }).catch((e) => console.warn('[Shipping Email Dispatch Warning]:', e.message));
    }

    // EMAIL 6: Order Cancellation / Refund Notice Trigger
    if (['Cancelled', 'Canceled', 'Refunded'].includes(status) && updatedOrder) {
      sendOrderCancellationEmail({
        order: updatedOrder,
        reason: dispatchNote || req.body.reason || 'Requested by customer / inventory verification update',
      }).catch((e) => console.warn('[Cancellation Email Dispatch Warning]:', e.message));
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}. Notification dispatched.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message,
    });
  }
}

/**
 * 3. GET /api/orders (List all orders with Supabase as live authoritative source)
 */
export async function listOrders(_req: Request, res: Response): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('../services/supabaseService.js');
    const supabase = getSupabaseAdmin();
    const orderMap = new Map<string, any>();

    let supaOrderKeys: Set<string> | null = null;

    // 1. Supabase public.orders (Live Primary Authority)
    if (supabase) {
      try {
        const { data: supaOrders, error: supaErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaErr && Array.isArray(supaOrders)) {
          supaOrderKeys = new Set<string>();
          supaOrders.forEach((so: any) => {
            const key = String(so.order_number || so.id).toLowerCase();
            supaOrderKeys!.add(key);
            if (so.id) supaOrderKeys!.add(String(so.id).toLowerCase());
            if (so.order_number) supaOrderKeys!.add(String(so.order_number).toLowerCase());

            const formatted = {
              id: so.id,
              _id: so.id,
              orderNumber: so.order_number || ('FS-' + (so.id ? so.id.slice(-5) : '00000')),
              customerId: so.customer_id,
              customer: {
                fullName: so.customer_name || 'Customer',
                email: so.customer_email || '',
                phone: so.customer_phone || '',
                address: so.shipping_address || '',
                apartment: '',
                city: 'Islamabad',
                state: 'ICT',
                postalCode: '44000',
                country: 'Pakistan',
              },
              items: Array.isArray(so.items) ? so.items : typeof so.items === 'string' ? JSON.parse(so.items) : [],
              subtotal: Number(so.subtotal) || Number(so.total) || 0,
              shipping: Number(so.shipping) || 0,
              discount: Number(so.discount) || 0,
              total: Number(so.total) || 0,
              paymentMethod: so.payment_method || 'cod',
              status: so.status || 'Processing',
              courier: so.courier,
              trackingNumber: so.tracking_number,
              courierTracking: so.courier_tracking,
              createdAt: so.created_at || new Date().toISOString(),
              deliveredAt: so.delivered_at,
            };
            orderMap.set(key, formatted);
          });
        }
      } catch (err: any) {
        console.warn('[Order DB] Supabase listOrders warning:', err.message);
      }
    }

    // 2. In-memory orders (prune if deleted from Supabase)
    for (const [id, o] of inMemoryOrders.entries()) {
      const key = (o.orderNumber || o.id || id).toLowerCase();
      if (supaOrderKeys && !supaOrderKeys.has(key)) {
        inMemoryOrders.delete(id);
        continue;
      }
      if (!orderMap.has(key)) {
        orderMap.set(key, o);
      }
    }

    // 3. FileDB orders (prune if deleted from Supabase)
    const fileOrders = FileDB.getOrders();
    fileOrders.forEach((o) => {
      const key = (o.orderNumber || o.id || o._id || '').toLowerCase();
      if (key) {
        if (supaOrderKeys && !supaOrderKeys.has(key)) {
          FileDB.deleteOrder(o.id || o.orderNumber);
          return;
        }
        if (!orderMap.has(key)) {
          orderMap.set(key, o);
        }
      }
    });

    // 4. MongoDB orders (prune if deleted from Supabase)
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoOrders = await OrderModel.find({}).sort({ createdAt: -1 }).exec();
        mongoOrders.forEach((doc) => {
          const o = doc.toObject();
          const key = (o.orderNumber || o._id.toString()).toLowerCase();
          if (supaOrderKeys && !supaOrderKeys.has(key)) {
            OrderModel.findByIdAndDelete(doc._id).exec().catch(() => {});
            return;
          }
          if (!orderMap.has(key)) {
            orderMap.set(key, { ...o, id: o._id.toString() });
          }
        });
      } catch (dbErr: any) {
        console.warn('[Order DB] MongoDB query error:', dbErr.message);
      }
    }

    const mergedOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      success: true,
      count: mergedOrders.length,
      orders: mergedOrders,
    });
  } catch (error: any) {
    console.error('List orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders', error: error.message });
  }
}

/**
 * 4. POST /api/orders/:id/cancel (Cancel Order & Trigger Refund / Cancellation Notice)
 */
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const cancelReason = reason || 'Order cancellation requested by customer';

    let order = FileDB.getOrders().find((o) => o.id === id || o.orderNumber === id);
    if (!order && mongoose.connection.readyState === 1) {
      try {
        order = await OrderModel.findOne({ $or: [{ orderNumber: id }, { _id: id }] }).exec();
      } catch {}
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    order.status = 'Cancelled';
    order.cancellationReason = cancelReason;
    order.cancelledAt = new Date().toISOString();

    FileDB.saveOrder(order);

    if (mongoose.connection.readyState === 1 && order._id) {
      try {
        await OrderModel.findByIdAndUpdate(order._id, {
          status: 'Cancelled',
          cancellationReason: cancelReason,
        }).exec();
      } catch {}
    }

    try {
      await syncOrderToSupabase(order);
    } catch {}

    // Dispatch Order Cancellation / Refund Email
    await sendOrderCancellationEmail({
      order,
      reason: cancelReason,
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber || id} has been canceled and refund notification sent.`,
      order,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order.', error: error.message });
  }
}

/**
 * 5. POST /api/orders/:id/send-review-request (Manual Staff Trigger for Review Request)
 */
export async function sendReviewRequestForOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    let order = FileDB.getOrders().find((o) => o.id === id || o.orderNumber === id);
    if (!order && mongoose.connection.readyState === 1) {
      try {
        order = await OrderModel.findOne({ $or: [{ orderNumber: id }, { _id: id }] }).exec();
      } catch {}
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const email = order.customer?.email || order.user?.email || order.guestEmail;
    if (!email) {
      res.status(400).json({ success: false, message: 'Order does not have a customer email address.' });
      return;
    }

    await sendReviewRequestEmail({
      to: email,
      name: order.customer?.fullName || order.shippingAddress?.fullName,
      orderNumber: order.orderNumber || id,
      items: order.items || [],
    });

    order.reviewEmailSent = true;
    order.reviewEmailSentAt = new Date().toISOString();
    FileDB.saveOrder(order);

    res.status(200).json({
      success: true,
      message: `Review request email sent to ${email} for order #${order.orderNumber || id}.`,
    });
  } catch (error: any) {
    console.error('Send review request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send review request.', error: error.message });
  }
}

/**
 * 6. GET /api/cron/review-requests (Automated Cron / Timeline Checker: 7 to 10 days post-delivery)
 */
export async function cronReviewRequests(_req: Request, res: Response): Promise<void> {
  try {
    const orders = FileDB.getOrders();
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

    const eligibleOrders = orders.filter((o) => {
      if (o.status !== 'Delivered' || o.reviewEmailSent) return false;
      const deliveryDate = o.deliveredAt ? new Date(o.deliveredAt).getTime() : new Date(o.updatedAt || o.createdAt).getTime();
      const diff = now - deliveryDate;
      // Trigger between 7 and 10 days, or if delivered >= 7 days ago
      return diff >= SEVEN_DAYS_MS;
    });

    const sentOrders: string[] = [];
    for (const order of eligibleOrders) {
      const email = order.customer?.email || order.user?.email || order.guestEmail;
      if (email) {
        try {
          await sendReviewRequestEmail({
            to: email,
            name: order.customer?.fullName,
            orderNumber: order.orderNumber || order.id,
            items: order.items || [],
          });
          order.reviewEmailSent = true;
          order.reviewEmailSentAt = new Date().toISOString();
          FileDB.saveOrder(order);
          sentOrders.push(order.orderNumber || order.id);
        } catch (e: any) {
          console.warn(`[Review Cron Error for ${order.orderNumber}]:`, e.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed review request timeline. Dispatched ${sentOrders.length} emails.`,
      dispatchedCount: sentOrders.length,
      orders: sentOrders,
    });
  } catch (error: any) {
    console.error('Cron review requests error:', error);
    res.status(500).json({ success: false, message: 'Review requests cron failed.', error: error.message });
  }
}

