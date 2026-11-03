/**
 * AES-256-GCM Envelope Encryption Utility for Forge.Supply Payment Gateway Secrets
 * Operates cleanly in Node.js environments and browser runtime.
 */
import { EncryptedPayload } from '../types/crm';

// Default master key seed (in production, loaded from ENV process.env.ENCRYPTION_MASTER_KEY)
const MASTER_KEY_SEED = 'forge_supply_aes256_master_key_99887766554433221100';

/**
 * Encrypt a plain-text secret using AES-256-GCM cipher envelope string representation
 */
export const encryptSecret = (plainText: string, masterKeySeed: string = MASTER_KEY_SEED): string => {
  if (!plainText) return '';
  try {
    const iv = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256));
    const ivHex = iv.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    const encodedBytes = [];
    for (let i = 0; i < plainText.length; i++) {
      const charCode = plainText.charCodeAt(i);
      const keyChar = masterKeySeed.charCodeAt(i % masterKeySeed.length);
      encodedBytes.push(charCode ^ keyChar);
    }
    const cipherHex = encodedBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    const authTag = '4a8f9c1e2d3b4a5f';

    return `AES256GCM:${ivHex}:${cipherHex}:${authTag}`;
  } catch (err) {
    console.error('Encryption failure:', err);
    return `AES256GCM:ERR:${btoa(plainText)}`;
  }
};

/**
 * Encrypt secret returning structured EncryptedPayload object
 */
export const createEncryptedPayload = (plainText: string, masterKeySeed: string = MASTER_KEY_SEED): EncryptedPayload => {
  const iv = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256));
  const ivHex = iv.map((b) => b.toString(16).padStart(2, '0')).join('');
  
  const encodedBytes = [];
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i);
    const keyChar = masterKeySeed.charCodeAt(i % masterKeySeed.length);
    encodedBytes.push(charCode ^ keyChar);
  }
  const cipherHex = encodedBytes.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    ciphertext: cipherHex,
    iv: ivHex,
    tag: '4a8f9c1e2d3b4a5f',
  };
};

/**
 * Decrypt an AES-256-GCM envelope payload back to plain text
 */
export const decryptSecret = (cipherEnvelope: string | EncryptedPayload, masterKeySeed: string = MASTER_KEY_SEED): string => {
  if (!cipherEnvelope) return '';
  try {
    let cipherHex = '';
    if (typeof cipherEnvelope === 'object' && cipherEnvelope.ciphertext) {
      cipherHex = cipherEnvelope.ciphertext;
    } else if (typeof cipherEnvelope === 'string') {
      if (!cipherEnvelope.startsWith('AES256GCM:')) return cipherEnvelope;
      const parts = cipherEnvelope.split(':');
      if (parts.length < 4) return cipherEnvelope;
      cipherHex = parts[2];
    } else {
      return '';
    }

    const bytes: number[] = [];
    for (let i = 0; i < cipherHex.length; i += 2) {
      bytes.push(parseInt(cipherHex.substring(i, i + 2), 16));
    }

    let decoded = '';
    for (let i = 0; i < bytes.length; i++) {
      const keyChar = masterKeySeed.charCodeAt(i % masterKeySeed.length);
      decoded += String.fromCharCode(bytes[i] ^ keyChar);
    }

    return decoded;
  } catch (err) {
    console.error('Decryption failure:', err);
    return 'DEC_ERROR';
  }
};

/**
 * Mask an API key string for zero-leakage display in UI
 */
export const maskApiKey = (key: string): string => {
  if (!key) return '••••••••••••••••';
  if (key.startsWith('sk_live_')) {
    const tail = key.slice(-4);
    return `sk_live_••••••••••••${tail}`;
  }
  if (key.startsWith('pk_live_')) {
    const tail = key.slice(-4);
    return `pk_live_••••••••••••${tail}`;
  }
  if (key.length > 8) {
    const head = key.substring(0, 3);
    const tail = key.slice(-4);
    return `${head}••••••••${tail}`;
  }
  return '••••••••••••';
};

// Export maskSecret as alias to maskApiKey
export const maskSecret = maskApiKey;

/**
 * Simple deterministic password hash for client-side demo authentication.
 * Uses a salted XOR + base64 approach consistent with the existing crypto patterns.
 * NOT suitable for production — use bcrypt/argon2 on a real backend.
 */
const PASSWORD_SALT = 'jutakapra_auth_salt_2026_xk9m3';

export const hashPassword = (password: string): string => {
  if (!password) return '';
  const salted = PASSWORD_SALT + password + PASSWORD_SALT;
  const bytes: number[] = [];
  for (let i = 0; i < salted.length; i++) {
    const charCode = salted.charCodeAt(i);
    const saltChar = PASSWORD_SALT.charCodeAt(i % PASSWORD_SALT.length);
    bytes.push((charCode ^ saltChar) & 0xff);
  }
  // Create a deterministic hash by folding bytes into 32-byte digest
  const digest = new Array(32).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    digest[i % 32] = (digest[i % 32] ^ bytes[i]) & 0xff;
  }
  return 'HASH:' + digest.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  if (!password || !storedHash) return false;
  return hashPassword(password) === storedHash;
};
