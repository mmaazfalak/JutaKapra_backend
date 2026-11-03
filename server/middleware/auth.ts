import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRecord } from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'juta-kapra-super-secure-jwt-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

/**
 * Middleware to enforce authentication via secure HttpOnly cookie or Bearer token
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User session invalid or user not found.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please log in again.',
    });
  }
}

/**
 * Optional Auth middleware: attaches req.user if a valid token is present, but does not reject request if absent
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      const user = await db.findUserById(decoded.userId);
      if (user && user.status !== 'suspended') {
        req.user = user;
      }
    }
  } catch {}
  next();
}

/**
 * In-memory Rate Limiter to guard auth endpoints against brute force attacks
 */
interface RateLimitTracker {
  count: number;
  resetAt: number;
}
const rateLimits: Map<string, RateLimitTracker> = new Map();

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    const current = rateLimits.get(key);

    if (!current || now > current.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (current.count >= options.maxRequests) {
      const waitSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.status(429).json({
        success: false,
        message:
          options.message ||
          `Too many requests. Please try again after ${waitSeconds} seconds.`,
      });
      return;
    }

    current.count += 1;
    rateLimits.set(key, current);
    next();
  };
}
