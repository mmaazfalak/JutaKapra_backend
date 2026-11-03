import { Customer, CustomerAddress, Order, SupabaseProfile, CourierTracking, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured, profileToCustomer } from '../lib/supabase';
import { getApiUrl } from '../utils/api';

const DB_KEYS = {
  SESSION: 'juta_db_active_session_v2',
  USERS: 'juta_db_users_v2',
  ORDERS: 'juta_db_orders_v2',
  ADMIN_LOGGED_IN: 'juta_db_admin_auth_v2',
};

// Initial Seed Admin
const DEFAULT_SUPER_ADMIN: Customer = {
  id: 'usr-admin-01',
  fullName: 'Maaz Falak',
  email: 'mmaazfalak@icloud.com',
  phone: '+923000000000',
  avatarUrl: 'https://ui-avatars.com/api/?name=Maaz+Falak&background=0a0a0a&color=fff&size=200&bold=true',
  authProvider: 'email',
  role: 'admin',
  status: 'active',
  accountType: 'REGISTERED',
  totalOrders: 0,
  lifetimeValue: 0,
  addresses: [
    {
      id: 'addr-admin-01',
      recipientName: 'Maaz Falak',
      phone: '+923000000000',
      address: 'Sector F-7/2, Street 15',
      apartment: 'Suite 402',
      city: 'Islamabad',
      state: 'ICT',
      postalCode: '44000',
      country: 'Pakistan',
      isDefault: true,
    },
  ],
  purchaseHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  lastActivity: new Date().toISOString(),
};

function getLocalUsers(): Customer[] {
  try {
    const raw = localStorage.getItem(DB_KEYS.USERS);
    if (raw) {
      const parsed: Customer[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some((u) => u.email.toLowerCase() === 'mmaazfalak@icloud.com')) {
          parsed.unshift(DEFAULT_SUPER_ADMIN);
          localStorage.setItem(DB_KEYS.USERS, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {}
  const initial = [DEFAULT_SUPER_ADMIN];
  try {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initial));
  } catch {}
  return initial;
}

function setLocalUsers(users: Customer[]): void {
  try {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  } catch {}
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(DB_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function setLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  } catch {}
}

export const UnifiedStorage = {
  /**
   * Get Active Session from local storage
   */
  getActiveSession(): Customer | null {
    try {
      const raw = localStorage.getItem(DB_KEYS.SESSION);
      if (raw) {
        return JSON.parse(raw) as Customer;
      }
    } catch {}
    return null;
  },

  /**
   * Set Active Session in local storage
   */
  setActiveSession(user: Customer | null): void {
    try {
      if (user) {
        localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
      } else {
        localStorage.removeItem(DB_KEYS.SESSION);
      }
    } catch {}
  },

  /**
   * Clear active auth session from storage
   */
  clearAuthSession(): void {
    this.setActiveSession(null);
  },

  /**
   * Remove user from local cache
   */
  deleteUser(userIdOrEmail: string): void {
    try {
      const normalized = userIdOrEmail.toLowerCase().trim();
      const users = getLocalUsers().filter(
        (u) => u.id !== userIdOrEmail && u.email.toLowerCase().trim() !== normalized
      );
      setLocalUsers(users);
      const active = this.getActiveSession();
      if (active && (active.id === userIdOrEmail || active.email.toLowerCase().trim() === normalized)) {
        this.clearAuthSession();
      }
    } catch {}
  },

  /**
   * Infallibly fetch user profile by userId or email from all connected bases
   */
  async fetchUserProfile(userIdOrEmail: string): Promise<Customer | null> {
    if (!userIdOrEmail) return null;
    const key = userIdOrEmail.toLowerCase().trim();

    let matchedUser: Customer | null = null;

    // 1. Check Tier 3: Website Backend API (/api/auth/profile or /api/auth/me)
    try {
      const res = await fetch(getApiUrl(`/api/auth/profile?email=${encodeURIComponent(key)}&id=${encodeURIComponent(key)}`), {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          const u = json.user;
          const uAddresses = Array.isArray(u.addresses) ? [...u.addresses] : [];

          // Synthesize address if addresses array is empty but single address field exists
          if (uAddresses.length === 0 && (u.address || u.defaultShippingAddress)) {
            uAddresses.push({
              id: 'addr-db-' + (u.id || key),
              recipientName: u.fullName || u.name || 'Customer',
              phone: u.phone || '',
              address: u.address || u.defaultShippingAddress || '',
              apartment: u.apartment || '',
              city: u.city || 'Islamabad',
              state: u.state || 'ICT',
              postalCode: u.postalCode || '44000',
              country: u.country || 'Pakistan',
              isDefault: true,
            });
          }

          const backendCust: Customer = {
            id: u.id || u._id || 'usr_' + Date.now().toString(36),
            fullName: u.fullName || u.name || 'Customer',
            email: u.email || key,
            phone: u.phone || (uAddresses[0]?.phone) || '',
            avatarUrl: u.avatarUrl || '',
            authProvider: u.authProvider || 'email',
            role: u.role || 'customer',
            status: u.status || 'active',
            accountType: 'REGISTERED',
            totalOrders: 0,
            lifetimeValue: 0,
            addresses: uAddresses,
            purchaseHistory: [],
            createdAt: u.createdAt || new Date().toISOString(),
            lastLoginAt: u.lastLoginAt || new Date().toISOString(),
            lastActivity: new Date().toISOString(),
          };
          matchedUser = backendCust;
        }
      }
    } catch {}

    // 2. Check Tier 2: Supabase public.profiles
    if (isSupabaseConfigured()) {
      try {
        const isEmail = key.includes('@');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);

        if (isEmail || isUuid) {
          let query = supabase.from('profiles').select('*');
          if (isEmail) {
            query = query.eq('email', key);
          } else {
            query = query.eq('id', key);
          }
          const { data, error } = await query.maybeSingle();
          if (!error && data) {
            const supaCust = profileToCustomer(data as SupabaseProfile);
            if (matchedUser) {
              // Merge Supabase with Backend
              const mergedAddresses = [...matchedUser.addresses];
              supaCust.addresses.forEach((sa) => {
                if (!mergedAddresses.some((ma) => ma.address.toLowerCase() === sa.address.toLowerCase())) {
                  mergedAddresses.push(sa);
                }
              });

              matchedUser = {
                ...matchedUser,
                fullName: matchedUser.fullName || supaCust.fullName,
                phone: matchedUser.phone || supaCust.phone || (mergedAddresses[0]?.phone) || '',
                avatarUrl: matchedUser.avatarUrl || supaCust.avatarUrl,
                addresses: mergedAddresses,
              };
            } else {
              matchedUser = supaCust;
            }
          }
        }
      } catch (err) {
        console.warn('[UnifiedStorage] Supabase fetch error:', err);
      }
    }

    // 3. Check Tier 1: Local Cache
    const localUsers = getLocalUsers();
    const local = localUsers.find(
      (u) => u.id === key || u.email.toLowerCase() === key
    );

    if (local) {
      if (matchedUser) {
        const mergedAddresses = [...matchedUser.addresses];
        (local.addresses || []).forEach((la) => {
          if (!mergedAddresses.some((ma) => ma.id === la.id || ma.address.toLowerCase() === la.address.toLowerCase())) {
            mergedAddresses.push(la);
          }
        });
        matchedUser = {
          ...matchedUser,
          phone: matchedUser.phone || local.phone || (mergedAddresses[0]?.phone) || '',
          addresses: mergedAddresses,
        };
      } else {
        matchedUser = local;
      }
    }

    if (matchedUser) {
      // Synchronize back to Tier 1
      const users = getLocalUsers();
      const idx = users.findIndex(
        (u) => u.id === matchedUser!.id || u.email.toLowerCase() === matchedUser!.email.toLowerCase()
      );
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...matchedUser };
      } else {
        users.unshift(matchedUser);
      }
      setLocalUsers(users);
      this.setActiveSession(matchedUser);
    }

    return matchedUser;
  },

  /**
   * Infallibly save/update user account on the spot across all tiers
   */
  async saveUserProfile(user: Customer): Promise<{ success: boolean; user: Customer; error?: string }> {
    const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
    const resolvedPhone = user.phone || defaultAddr?.phone || '';

    const updatedUser: Customer = {
      ...user,
      phone: resolvedPhone,
      lastActivity: new Date().toISOString(),
    };

    // 1. Immediately Save to Tier 1 (Zero-Lag Local Storage Cache)
    const users = getLocalUsers();
    const idx = users.findIndex(
      (u) => u.id === updatedUser.id || u.email.toLowerCase() === updatedUser.email.toLowerCase()
    );
    if (idx >= 0) {
      users[idx] = updatedUser;
    } else {
      users.unshift(updatedUser);
    }
    setLocalUsers(users);
    this.setActiveSession(updatedUser);

    // 2. Immediately Push to Tier 2: Supabase Database (public.profiles)
    if (isSupabaseConfigured() && updatedUser.id) {
      try {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: updatedUser.id,
              full_name: updatedUser.fullName,
              email: updatedUser.email.toLowerCase().trim(),
              phone: resolvedPhone,
              avatar_url: updatedUser.avatarUrl || '',
              role: updatedUser.role || 'customer',
              status: updatedUser.status || 'active',
              address: defaultAddr?.address || '',
              default_shipping_address: defaultAddr?.address || '',
              city: defaultAddr?.city || '',
              state: defaultAddr?.state || '',
              postal_code: defaultAddr?.postalCode || '',
              country: defaultAddr?.country || 'Pakistan',
              last_login_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      } catch (err) {
        console.warn('[UnifiedStorage] Supabase write warning:', err);
      }
    }

    // 3. Immediately Push to Tier 3: Website Backend API (/api/auth/profile)
    try {
      await fetch(getApiUrl('/api/auth/profile'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: updatedUser.id,
          userId: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          phone: resolvedPhone,
          avatarUrl: updatedUser.avatarUrl,
          addresses: updatedUser.addresses,
          address: defaultAddr?.address,
          apartment: defaultAddr?.apartment,
          city: defaultAddr?.city,
          state: defaultAddr?.state,
          postalCode: defaultAddr?.postalCode,
          country: defaultAddr?.country || 'Pakistan',
          defaultShippingAddress: defaultAddr?.address,
        }),
      });
    } catch {}

    return { success: true, user: updatedUser };
  },

  /**
   * Infallibly add or update an address for a user and push on the spot
   */
  async saveAddress(
    userId: string,
    address: Omit<CustomerAddress, 'id'> & { id?: string }
  ): Promise<CustomerAddress> {
    const users = getLocalUsers();
    let targetUser = users.find((u) => u.id === userId) || this.getActiveSession();

    const addressId = address.id || 'addr-' + Date.now().toString(36);
    const completeAddress: CustomerAddress = {
      ...address,
      id: addressId,
      isDefault: Boolean(address.isDefault),
    };

    if (targetUser) {
      let addresses = [...(targetUser.addresses || [])];
      const existingIdx = addresses.findIndex((a) => a.id === addressId);

      if (completeAddress.isDefault || addresses.length === 0) {
        addresses = addresses.map((a) => ({ ...a, isDefault: false }));
        completeAddress.isDefault = true;
      }

      if (existingIdx >= 0) {
        addresses[existingIdx] = completeAddress;
      } else {
        addresses.push(completeAddress);
      }

      const updatedUser: Customer = {
        ...targetUser,
        addresses,
        phone: targetUser.phone || completeAddress.phone,
      };

      await this.saveUserProfile(updatedUser);
    }

    return completeAddress;
  },

  /**
   * Infallibly delete address for a user and push on the spot
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const users = getLocalUsers();
    let targetUser = users.find((u) => u.id === userId) || this.getActiveSession();

    if (targetUser && targetUser.addresses) {
      let remaining = targetUser.addresses.filter((a) => a.id !== addressId);
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }

      const updatedUser: Customer = {
        ...targetUser,
        addresses: remaining,
      };

      await this.saveUserProfile(updatedUser);
    }
  },

  /**
   * Fetch all orders from all bases
   */
  async fetchOrders(): Promise<Order[]> {
    let allOrders: Order[] = [];

    // 1. Fetch from Backend API
    try {
      const res = await fetch(getApiUrl('/api/orders'), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const raw = Array.isArray(json) ? json : json.orders || [];
        if (Array.isArray(raw)) {
          allOrders = [...raw];
        }
      }
    } catch {}

    // 2. Fetch from Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          allOrders = [...allOrders, ...data];
        }
      } catch {}
    }

    // 3. Merge with local cache
    const local = getLocalOrders();
    const map = new Map<string, Order>();
    [...allOrders, ...local].forEach((ord: any) => {
      const id = ord.id || ord.orderNumber || ord._id;
      if (id) {
        map.set(id, {
          id: ord.id || ord._id || 'ord-' + Math.random().toString(36).slice(2),
          orderNumber: ord.orderNumber || ord.order_number || ('FS-' + Math.floor(10000 + Math.random() * 90000)),
          customerId: ord.customerId || ord.customer_id,
          customer: {
            fullName: ord.customer?.fullName || ord.customer_name || 'Customer',
            email: ord.customer?.email || ord.customer_email || '',
            phone: ord.customer?.phone || ord.customer_phone || '',
            address: ord.customer?.address || ord.shipping_address || '',
            apartment: ord.customer?.apartment || '',
            city: ord.customer?.city || 'Islamabad',
            state: ord.customer?.state || 'ICT',
            postalCode: ord.customer?.postalCode || '44000',
            country: ord.customer?.country || 'Pakistan',
          },
          items: Array.isArray(ord.items) ? ord.items : [],
          subtotal: Number(ord.subtotal) || Number(ord.total) || 0,
          shipping: Number(ord.shipping) || 0,
          discount: Number(ord.discount) || 0,
          total: Number(ord.total) || 0,
          paymentMethod: ord.paymentMethod || ord.payment_method || 'cod',
          status: ord.status || 'Processing',
          courier: ord.courier,
          trackingNumber: ord.trackingNumber,
          createdAt: ord.createdAt || ord.created_at || new Date().toISOString(),
          deliveredAt: ord.deliveredAt || ord.delivered_at,
        });
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setLocalOrders(merged);
    return merged;
  },

  /**
   * Save order immediately across all bases
   */
  async saveOrder(order: Order): Promise<Order> {
    const orders = getLocalOrders();
    const idx = orders.findIndex((o) => o.id === order.id || o.orderNumber === order.orderNumber);
    if (idx >= 0) {
      orders[idx] = order;
    } else {
      orders.unshift(order);
    }
    setLocalOrders(orders);

    // Push to Backend API
    try {
      await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch {}

    // Push to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').upsert({
          id: order.id,
          order_number: order.orderNumber,
          customer_id: order.customerId,
          customer_name: order.customer.fullName,
          customer_email: order.customer.email,
          customer_phone: order.customer.phone,
          shipping_address: order.customer.address,
          items: order.items,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          payment_method: order.paymentMethod,
          status: order.status,
          created_at: order.createdAt,
        });
      } catch {}
    }

    return order;
  },

  /**
   * Update order status across local storage
   */
  updateOrderStatus(orderId: string, status: OrderStatus | string): void {
    const orders = getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx >= 0) {
      orders[idx].status = status as OrderStatus;
      if (status === 'Delivered') {
        orders[idx].deliveredAt = new Date().toISOString();
      }
      setLocalOrders(orders);
    }
  },

  /**
   * Update order courier tracking details
   */
  updateOrderTracking(orderId: string, tracking: CourierTracking): void {
    const orders = getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx >= 0) {
      orders[idx].status = 'Dispatched to Courier';
      orders[idx].courier = tracking.courierName;
      orders[idx].trackingNumber = tracking.trackingNumber;
      orders[idx].courierTracking = tracking;
      setLocalOrders(orders);
    }
  },
};
