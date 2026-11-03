import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Hashes a plain-text password securely with bcrypt (12 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain-text password with a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP and its SHA-256 hash.
 * The plaintext OTP is dispatched to the user (via Google Apps Script email).
 * ONLY the SHA-256 hash is saved to the database.
 */
export function generateSecureOTP(): { otp: string; otpHash: string } {
  // Generates 6-digit number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, otpHash };
}

/**
 * Verifies an incoming OTP against the stored SHA-256 hash using constant-time comparison
 */
export function verifyOTPHash(incomingOtp: string, storedHash: string): boolean {
  try {
    const incomingHash = crypto
      .createHash('sha256')
      .update(incomingOtp.trim())
      .digest('hex');

    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (incomingBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(incomingBuffer, storedBuffer);
  } catch {
    return false;
  }
}
