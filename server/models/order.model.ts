import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrderDocument extends Document {
  orderNumber: string;
  customerId?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    product: any;
    quantity: number;
    selectedSize?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Pending' | 'Processing' | 'Placed' | 'Dispatched to Courier' | 'Dispatched' | 'Delivered' | 'Cancelled';
  courier?: string;
  trackingNumber?: string;
  courierTracking?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl: string;
    dispatchedAt: string;
    dispatchNote?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, default: '' },
      address: { type: String, required: true },
      apartment: String,
      city: { type: String, required: true },
      state: String,
      postalCode: String,
      country: { type: String, default: 'Pakistan' },
    },
    items: [
      {
        product: { type: Schema.Types.Mixed, required: true },
        quantity: { type: Number, required: true, default: 1 },
        selectedSize: String,
      },
    ],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true, default: 'cod' },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Placed', 'Dispatched to Courier', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Processing',
      index: true,
    },
    courier: String,
    trackingNumber: String,
    courierTracking: {
      courierName: String,
      trackingNumber: String,
      trackingUrl: String,
      dispatchedAt: String,
      dispatchNote: String,
    },
    deliveredAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;
