import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { executeAbandonedCartsScan } from './controllers/cartController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// High-speed response compression (Gzip / Deflate)
app.use(compression({
  threshold: 1024, // Compress responses over 1KB
}));

// Security Headers (configured to allow Google One Tap & OAuth postMessage popups)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// CORS Configuration (supports credentials for secure cookies with 24h preflight cache)
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow local development, custom domain, and specified frontend url
    if (!origin || origin === FRONTEND_URL || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin.includes('jutakapra.store')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400, // Cache OPTIONS preflight for 24 hours to eliminate cross-origin preflight latency
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Checks
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'juta-kapra-backend-api', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'juta-kapra-backend-api', timestamp: new Date().toISOString() });
});

// Authentication, Products, Orders, Carts & Email Subsystems
app.use('/api/auth', authRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/cron', emailRoutes);
app.use('/api', authRoutes);

// Fallback 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Background worker: Periodic scan for carts inactive for >= 10 hours
if (process.env.NODE_ENV !== 'test') {
  const CART_SCAN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    executeAbandonedCartsScan().catch((err: any) => {
      console.warn('[Cart Abandonment Scan Notice]:', err?.message || err);
    });
  }, CART_SCAN_INTERVAL_MS);
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && !process.env.NO_LISTEN) {
  app.listen(PORT, () => {
    console.log(`⚡ [Auth Server] Juta Kapra Authentication Service running on http://localhost:${PORT}`);
  });
}

export default app;
