import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// High-speed response compression (Gzip / Deflate)
app.use(compression({
  threshold: 1024, // Compress responses over 1KB
}));

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS Configuration (supports credentials for secure cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and specified frontend url
      if (!origin || origin === FRONTEND_URL || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

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

// Authentication & Admin API Subsystem
app.use('/api/auth', authRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', authRoutes);

// Fallback 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ [Auth Server] Juta Kapra Authentication Service running on http://localhost:${PORT}`);
  });
}

export default app;
