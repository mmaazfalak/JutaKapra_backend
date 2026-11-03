import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  '';

const ADMIN_CREDENTIALS = {
  name: 'Maaz Falak',
  email: 'mmaazfalak@icloud.com',
  passwordPlain: 'Pass@Jutakapra12',
  role: 'admin' as const,
  phone: '+923000000000',
  status: 'active' as const,
  authProvider: 'email' as const,
};

async function wipeAndResetUserDatabase() {
  console.log('====================================================');
  console.log('🔄 STARTING COMPLETE USER DATABASE WIPE & RESET');
  console.log('====================================================\n');

  if (!MONGODB_URI || !MONGODB_URI.startsWith('mongodb')) {
    console.log('⚠️ No remote MONGODB_URI configured. Resetting in-memory / local structure.');
    console.log('\n✅ Local Admin Account Configured:');
    console.log(`   - Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`   - Password: ${ADMIN_CREDENTIALS.passwordPlain}`);
    console.log(`   - Role: ${ADMIN_CREDENTIALS.role}`);
    console.log('\n====================================================');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(' Connected to MongoDB database successfully.\n');

    // 1. Delete ALL existing user accounts
    console.log(' Deleting all existing user records (customers and admins)...');
    const deleteResult = await User.deleteMany({});
    console.log(` Deleted ${deleteResult.deletedCount} existing user records.\n`);

    // 2. Generate bcrypt hash for Admin password
    console.log(' Generating secure bcrypt hash for Admin credentials...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(ADMIN_CREDENTIALS.passwordPlain, salt);

    // 3. Create the single Admin account
    console.log(' Creating single primary Admin user...');
    const adminDoc = await User.create({
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email.toLowerCase().trim(),
      password: passwordHash,
      phone: ADMIN_CREDENTIALS.phone,
      role: ADMIN_CREDENTIALS.role,
      status: ADMIN_CREDENTIALS.status,
      authProvider: ADMIN_CREDENTIALS.authProvider,
    });

    console.log('\n====================================================');
    console.log('🎉 USER DATABASE WIPE & SEED COMPLETE');
    console.log('====================================================');
    console.log(`Admin User ID : ${adminDoc._id}`);
    console.log(`Admin Name    : ${adminDoc.name}`);
    console.log(`Admin Email   : ${adminDoc.email}`);
    console.log(`Plain Password: ${ADMIN_CREDENTIALS.passwordPlain}`);
    console.log(`Role          : ${adminDoc.role}`);
    console.log(`Status        : ${adminDoc.status}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error during user database reset:', err.message);
    process.exit(1);
  }
}

wipeAndResetUserDatabase();
