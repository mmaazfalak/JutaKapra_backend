export type CategoryType = 
  | 'All Vintage'
  | 'Sneakers & Boots'
  | 'Vintage Tees & Trousers'
  | 'Workwear & Jeans'
  | 'Jackets & Coats'
  | 'Accessories'
  | 'Deals';

export interface ProductMeasurements {
  chest?: string;
  length?: string;
  shoulders?: string;
  inseam?: string;
  shoeSize?: string;
  waist?: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: 'Sneakers & Boots' | 'Vintage Tees & Trousers' | 'Workwear & Jeans' | 'Jackets & Coats' | 'Accessories';
  subcategory?: 'watch' | 'glasses' | 'bags' | 'wallets' | string;
  era: string; // e.g. '1990s', '1980s', 'Early 2000s'
  price: number;
  originalPrice?: number;
  conditionGrade: string; // e.g. 'Vintage 9/10 - Single Stitch'
  conditionTier: 'Mint' | 'Good' | 'Distressed 1-of-1' | 'Deadstock';
  size: string; // e.g. 'L', 'XL', 'US 10.5', '32x32', 'One Size'
  measurements: ProductMeasurements;
  description: string;
  details: string[];
  images: string[];
  inStock: boolean;
  is1of1: boolean;
  inventoryType?: 'thrift_1of1' | 'multi_stock'; // Separate management of 1-of-1 thrift pieces vs multi-quantity stock
  stockCount?: number; // Stock quantity available
  storeId?: string; // Assigned store account ID
  storeName?: string; // Assigned store name
  isHidden?: boolean; // Hidden product flag
  isReserved?: boolean;
  isArchived?: boolean;
  isHotDeal?: boolean;
  isTrending?: boolean;
  dateAdded: string;
  dropBatch?: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Confirmed'
  | 'Dispatched to Courier'
  | 'Delivered'
  | 'Cancelled';

export interface CourierTracking {
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  dispatchedAt: string;
  dispatchNote?: string;
  estimatedDeliveryDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string; // e.g. 'cod', 'easypaisa', 'jazzcash', 'bank', 'stripe'
  status: OrderStatus;
  courier?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  courierTracking?: CourierTracking;
  createdAt: string;
  deliveredAt?: string;
}

export type AccountType = 'AUTO_GUEST' | 'REGISTERED';

export interface CustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  googleId?: string;
  authProvider?: 'google' | 'email' | 'guest';
  role?: 'customer' | 'admin';
  status?: 'active' | 'suspended';
  accountType: AccountType;
  totalOrders: number;
  lifetimeValue: number;
  addresses: CustomerAddress[];
  purchaseHistory: { orderId: string; date: string; amount: number; status: OrderStatus }[];
  magicLinkToken?: string;
  magicLinkSentAt?: string;
  passwordResetSentAt?: string;
  passwordHash?: string;
  hasPassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lastActivity: string;
}

export interface SupabaseProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  auth_provider: 'google' | 'email' | 'guest';
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  address?: string;
  default_shipping_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  has_password?: boolean;
  password_hash?: string;
  created_at: string;
  last_login_at: string;
}

export type PaymentGatewayType =
  | 'cod'
  | 'easypaisa'
  | 'jazzcash'
  | 'bank'
  | 'stripe'
  | 'custom';

export interface PaymentGatewayConfig {
  id: string;
  type: PaymentGatewayType;
  title: string;
  providerName: string;
  isEnabled: boolean;
  environment?: 'live' | 'sandbox';
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  bankName?: string;
  minOrderLimit?: number;
  maxOrderLimit?: number;
  disclaimerNote?: string;
  customInstructions?: string;
  autoConfirmCOD?: boolean;
  publishableKey?: string;
  encryptedSecretKey?: string;
  webhookSecret?: string;
  webhookEndpoint?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  provider: string;
  action: string;
  transactionId: string;
  httpStatusCode: number;
  payload: string;
  adminUser: string;
}

export interface Review {
  id: string;
  customerName: string;
  productTitle: string;
  productId: string;
  rating: number;
  comment: string;
  status: 'Published' | 'Pending';
  date: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting on Customer' | 'Resolved' | 'Closed';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName?: string;
  customerEmail: string;
  subject: string;
  orderReference?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaff?: string;
  notes?: { id: string; author: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt?: string;
}

export type StaffRole =
  | 'Principal Admin'
  | 'Inventory Curator'
  | 'Fulfillment Staff'
  | 'Customer Support'
  | 'Read-only Analyst';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  permissions: string[];
  status: 'Active' | 'Disabled' | 'Invited';
  lastActive: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DropEvent {
  id: string;
  title: string;
  dateStr: string;
  targetTimestamp: number;
  badge: string;
  description: string;
  bannerImage: string;
  itemCount: number;
  category: string;
  status: 'upcoming' | 'live' | 'archived';
  previewProductIds: string[];
}

export interface StoreLocation {
  id: string;
  name: string;
  type: 'Flagship Store' | 'Archival Pop-Up' | 'Showroom';
  address: string;
  neighborhood: string;
  city: string;
  hours: string;
  phone: string;
  coordinates: string;
  isPopUp: boolean;
  image: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'cart';
  title: string;
  message?: string;
  duration?: number;
}

export interface StoreAccount {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone?: string;
  passcode?: string;
  status: 'active' | 'suspended';
  isHidden: boolean; // Hide all products belonging to this store from storefront
  city?: string;
  address?: string;
  commissionRate?: number;
  createdAt: string;
  logoUrl?: string;
  description?: string;
  defaultCourier?: string; // e.g. 'TCS', 'Leopards', 'Trax', 'Call Courier'
  payoutAccountTitle?: string;
  payoutBankName?: string;
  payoutIbanOrPhone?: string;
  badge?: string; // e.g. 'Verified Vault', 'Vintage Archive', 'Official Partner'
}

export interface SupabaseStore {
  id: string;
  name: string;
  slug?: string;
  owner_email: string;
  owner_name?: string;
  owner_phone?: string;
  passcode?: string;
  status: 'active' | 'suspended';
  is_hidden: boolean;
  city?: string;
  address?: string;
  commission_rate: number;
  logo_url?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

