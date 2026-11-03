/**
 * Enterprise CRM Data Models & Interfaces for Forge.Supply
 */

export type CrmTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'drops'
  | 'customers'
  | 'reviews'
  | 'tickets'
  | 'payments'
  | 'audit'
  | 'team'
  | 'settings';

export type AccountType = 'AUTO_GUEST' | 'REGISTERED';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  totalOrders: number;
  lifetimeValue: number;
  lastActivity: string;
  shippingAddress: ShippingAddress;
  magicLinkSent?: boolean;
  createdAt: string;
}

export interface ThriftMeasurement {
  chest?: string;
  length?: string;
  shoulders?: string;
  waist?: string;
  inseam?: string;
  shoeSize?: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  category: 'Vintage Tees & Trousers' | 'Workwear & Jeans' | 'Jackets & Coats' | 'Sneakers & Boots' | 'Accessories';
  subcategory?: 'watch' | 'glasses' | 'bags' | 'wallets' | string;
  era: string;
  size: string;
  conditionGrade: string;
  conditionTier: 'Mint' | 'Good' | 'Distressed 1-of-1' | 'Deadstock';
  price: number;
  originalPrice?: number;
  inStock: boolean;
  is1of1: boolean;
  images: string[];
  description: string;
  measurements: ThriftMeasurement;
  dateAdded: string;
}

export type OrderStatus =
  | 'Pending Payment'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  trackingNumber?: string;
  courier?: string;
  createdAt: string;
}

export type GatewayProvider = 'stripe' | 'paypal' | 'cod_bank' | 'webhook';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface PaymentGatewayConfig {
  id: string;
  provider: GatewayProvider;
  name: string;
  status: 'active' | 'disabled';
  isSandbox: boolean;
  encryptedSecretKey: EncryptedPayload;
  maskedSecretKey: string;
  publishableKey?: string;
  webhookUrl?: string;
  hmacSecret?: EncryptedPayload;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  provider: string;
  action: string;
  transactionId: string;
  statusCode: number;
  payloadSnippet: string;
  user: string;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'payment' | 'inventory';
  title: string;
  description: string;
  timestamp: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'purple';
}
