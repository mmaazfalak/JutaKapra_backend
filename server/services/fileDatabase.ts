import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserRecord } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Initial Admin User
const DEFAULT_ADMIN: UserRecord = {
  id: 'usr-admin-01',
  _id: 'usr-admin-01',
  fullName: 'Maaz Falak',
  name: 'Maaz Falak',
  email: 'mmaazfalak@icloud.com',
  phone: '+923000000000',
  passwordHash: '$2a$12$K8/gB4z4m66uY7wNqK7x5u88pZ0l7jI0vFkEwG4nOm91.2c8/8j.e',
  role: 'admin',
  status: 'active',
  authProvider: 'email',
  addresses: [],
  address: '',
  city: 'Islamabad',
  state: 'ICT',
  postalCode: '44000',
  country: 'Pakistan',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/**
 * Atomic file writer to ensure no corruption during concurrent writes
 */
function writeJsonAtomic(filePath: string, data: any): void {
  try {
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err: any) {
    console.error(`[FileDB] Failed writing to ${filePath}:`, err.message);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }
}

function readJsonSafe<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonAtomic(filePath, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err: any) {
    console.warn(`[FileDB] Failed reading ${filePath}, using fallback:`, err.message);
    return defaultValue;
  }
}

export const FileDB = {
  // USERS DATABASE
  getUsers(): UserRecord[] {
    const users = readJsonSafe<UserRecord[]>(USERS_FILE, [DEFAULT_ADMIN]);
    if (!users.some((u) => u.email.toLowerCase() === 'mmaazfalak@icloud.com')) {
      users.unshift(DEFAULT_ADMIN);
      writeJsonAtomic(USERS_FILE, users);
    }
    return users;
  },

  saveUsers(users: UserRecord[]): void {
    writeJsonAtomic(USERS_FILE, users);
  },

  findUserByEmail(email: string): UserRecord | null {
    const normalized = email.toLowerCase().trim();
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  findUserById(id: string): UserRecord | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id || u._id === id || (u.googleId && u.googleId === id)) || null;
  },

  saveUser(user: UserRecord): UserRecord {
    const users = this.getUsers();
    const idx = users.findIndex(
      (u) =>
        u.id === user.id ||
        (user._id && u._id === user._id) ||
        u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (idx >= 0) {
      const existing = users[idx];
      const passwordHash = user.passwordHash || user.password || existing.passwordHash || existing.password;
      users[idx] = {
        ...existing,
        ...user,
        passwordHash,
        password: passwordHash,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const passwordHash = user.passwordHash || user.password;
      users.unshift({
        ...user,
        passwordHash,
        password: passwordHash,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    this.saveUsers(users);
    return user;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const users = this.getUsers();
    const idx = users.findIndex(
      (u) =>
        u.id === id ||
        u._id === id ||
        (u.googleId && u.googleId === id) ||
        (u.email && u.email.toLowerCase() === id.toLowerCase())
    );
    if (idx < 0) return null;

    const existing = users[idx];
    const passwordHash = updates.passwordHash || updates.password || existing.passwordHash || existing.password;

    users[idx] = {
      ...existing,
      ...updates,
      passwordHash,
      password: passwordHash,
      updatedAt: new Date().toISOString(),
    };

    this.saveUsers(users);
    return users[idx];
  },

  deleteUser(idOrEmail: string): boolean {
    const normalized = idOrEmail.toLowerCase().trim();
    const users = this.getUsers();
    // Do not allow deleting root super admin
    const filtered = users.filter((u) => {
      if (u.email.toLowerCase() === 'mmaazfalak@icloud.com') return true;
      return (
        u.id !== idOrEmail &&
        u._id !== idOrEmail &&
        u.email.toLowerCase() !== normalized &&
        u.googleId !== idOrEmail
      );
    });
    const changed = filtered.length !== users.length;
    if (changed) {
      this.saveUsers(filtered);
    }
    return changed;
  },

  // ORDERS DATABASE
  getOrders(): any[] {
    return readJsonSafe<any[]>(ORDERS_FILE, []);
  },

  saveOrders(orders: any[]): void {
    writeJsonAtomic(ORDERS_FILE, orders);
  },

  saveOrder(order: any): any {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => (o.id && o.id === order.id) || (o.orderNumber && o.orderNumber === order.orderNumber));
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...order };
    } else {
      orders.unshift(order);
    }
    this.saveOrders(orders);
    return order;
  },

  deleteOrder(idOrNumber: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter(
      (o) => o.id !== idOrNumber && o.orderNumber !== idOrNumber && o._id !== idOrNumber
    );
    const changed = filtered.length !== orders.length;
    if (changed) {
      this.saveOrders(filtered);
    }
    return changed;
  },

  // PRODUCTS DATABASE
  getProducts(): any[] {
    return readJsonSafe<any[]>(PRODUCTS_FILE, []);
  },

  saveProducts(products: any[]): void {
    writeJsonAtomic(PRODUCTS_FILE, products);
  },

  // CARTS DATABASE (for Abandoned Cart Recovery 1-24h pipeline)
  getCarts(): any[] {
    return readJsonSafe<any[]>(CARTS_FILE, []);
  },

  saveCarts(carts: any[]): void {
    writeJsonAtomic(CARTS_FILE, carts);
  },

  saveCart(cart: any): any {
    const carts = this.getCarts();
    const emailKey = (cart.email || cart.customerEmail || '').toLowerCase().trim();
    const idx = carts.findIndex(
      (c) => (emailKey && (c.email || c.customerEmail || '').toLowerCase().trim() === emailKey) || (cart.id && c.id === cart.id)
    );
    const cartRecord = {
      ...cart,
      id: cart.id || 'cart-' + Date.now().toString(36),
      updatedAt: new Date().toISOString(),
      createdAt: cart.createdAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      carts[idx] = { ...carts[idx], ...cartRecord };
    } else {
      carts.unshift(cartRecord);
    }
    this.saveCarts(carts);
    return cartRecord;
  },

  getCartByEmail(email: string): any | null {
    const normalized = email.toLowerCase().trim();
    const carts = this.getCarts();
    return carts.find((c) => (c.email || c.customerEmail || '').toLowerCase().trim() === normalized) || null;
  },

  deleteCart(emailOrId: string): boolean {
    const normalized = emailOrId.toLowerCase().trim();
    const carts = this.getCarts();
    const filtered = carts.filter(
      (c) => c.id !== emailOrId && (c.email || c.customerEmail || '').toLowerCase().trim() !== normalized
    );
    const changed = filtered.length !== carts.length;
    if (changed) {
      this.saveCarts(filtered);
    }
    return changed;
  },
};
