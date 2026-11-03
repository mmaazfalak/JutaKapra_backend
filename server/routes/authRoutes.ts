import express from 'express';
import {
  register,
  login,
  googleLogin,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  listUsers,
  updateUserRoleStatus,
  deleteUserAccount,
  sendEmailController,
} from '../controllers/authController.js';
import { requireAuth, optionalAuth, createRateLimiter } from '../middleware/auth.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Registration limit reached from this IP. Please try again later.',
});

const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 6,
  message: 'Too many OTP requests. Please wait a few minutes before trying again.',
});

// Authentication Routes
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', optionalAuth, getMe);

// User Directory (Admin)
router.get('/users', listUsers);
router.patch('/users/:id/role-status', updateUserRoleStatus);
router.delete('/users/:id', deleteUserAccount);

// Profile & Password Management
router.get('/profile', optionalAuth, getMe);
router.patch('/profile', optionalAuth, updateProfile);
router.put('/profile', optionalAuth, updateProfile);
router.post('/profile', optionalAuth, updateProfile);
router.patch('/me', optionalAuth, updateProfile);
router.put('/me', optionalAuth, updateProfile);
router.post('/change-password', optionalAuth, changePassword);

// OTP Password Reset Flow
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/reset-password', otpLimiter, resetPassword);

// Email notification proxy route
router.post('/send-email', sendEmailController);

export default router;
