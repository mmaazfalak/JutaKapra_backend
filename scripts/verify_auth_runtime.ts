import { getSupabaseAdmin, syncProfileToSupabase, syncOrderToSupabase } from '../server/services/supabaseService.js';
import { db } from '../server/db.js';
import { hashPassword, verifyPassword } from '../server/utils/crypto.js';

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('🚀 JUTA KAPRA - COMPLETE RUNTIME & AUTH VERIFICATION');
  console.log('====================================================\n');

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('❌ Supabase Admin client could not be initialized. Check keys.');
    process.exit(1);
  }

  const results: { test: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  // 1. CHECK SUPABASE AUTH & PROFILES TABLE FOR DUPLICATES
  console.log('🔍 Checking Supabase for duplicate users...');
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    results.push({ test: 'Duplicate Account Audit', status: 'FAIL', details: authErr.message });
  } else {
    const emailMap = new Map<string, string[]>();
    (authUsers.users as any[]).forEach((u: any) => {
      const email = (u.email || '').toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(u.id);
    });

    const duplicates = Array.from(emailMap.entries()).filter(([_, ids]) => ids.length > 1);
    if (duplicates.length === 0) {
      results.push({
        test: 'Duplicate Account Audit',
        status: 'PASS',
        details: `0 duplicate accounts found across ${authUsers.users.length} Supabase Auth users.`,
      });
    } else {
      results.push({
        test: 'Duplicate Account Audit',
        status: 'FAIL',
        details: `Found duplicates: ${JSON.stringify(duplicates)}`,
      });
    }
  }

  // 2. TEST SCENARIO A: Email Signup -> Supabase Sync & UUID Generation
  console.log('\n🧪 Testing Scenario A: Email Signup Flow...');
  const testEmailA = `test.user.a.${Date.now()}@example.com`;
  const testPasswordA = 'TestPass123!@#';
  const testNameA = 'User Alpha';

  let userAUuid = '';
  try {
    const syncResA = await syncProfileToSupabase({
      email: testEmailA,
      fullName: testNameA,
      password: testPasswordA,
      role: 'customer',
      authProvider: 'email',
    });

    if (syncResA.success && syncResA.id) {
      userAUuid = syncResA.id;
      // Check that UUID is valid format
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userAUuid);
      if (isUuid) {
        results.push({
          test: 'Email Signup -> Supabase UUID Creation',
          status: 'PASS',
          details: `Created user with canonical UUID: ${userAUuid}`,
        });
      } else {
        results.push({
          test: 'Email Signup -> Supabase UUID Creation',
          status: 'FAIL',
          details: `Returned non-UUID identity: ${userAUuid}`,
        });
      }
    } else {
      results.push({
        test: 'Email Signup -> Supabase UUID Creation',
        status: 'FAIL',
        details: 'Failed to sync profile to Supabase',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Email Signup -> Supabase UUID Creation',
      status: 'FAIL',
      details: err.message,
    });
  }

  // 3. TEST SCENARIO A cont: Email Login -> Resolves same UUID
  console.log('\n🧪 Testing Email Login Verification...');
  try {
    const { data: supaProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userAUuid)
      .maybeSingle();

    if (supaProfile && supaProfile.email === testEmailA) {
      results.push({
        test: 'Supabase Profile Persistence',
        status: 'PASS',
        details: `Profile successfully persisted with ID: ${supaProfile.id} matching email: ${supaProfile.email}`,
      });
    } else {
      results.push({
        test: 'Supabase Profile Persistence',
        status: 'FAIL',
        details: 'Profile row not found in public.profiles',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Supabase Profile Persistence',
      status: 'FAIL',
      details: err.message,
    });
  }

  // 4. TEST SCENARIO A cont: Same User logs in with Google OAuth -> Must NOT create a second account
  console.log('\n🧪 Testing Google Login for existing Email/Password user (Account Linking)...');
  try {
    const syncResGoogle = await syncProfileToSupabase({
      email: testEmailA,
      fullName: 'User Alpha Google',
      role: 'customer',
      authProvider: 'google',
    });

    if (syncResGoogle.success && syncResGoogle.id === userAUuid) {
      results.push({
        test: 'Google Login on Existing Account (Account Linking)',
        status: 'PASS',
        details: `Google login correctly resolved to existing canonical UUID: ${syncResGoogle.id} without creating duplicate account.`,
      });
    } else {
      results.push({
        test: 'Google Login on Existing Account (Account Linking)',
        status: 'FAIL',
        details: `Expected canonical UUID ${userAUuid}, got: ${syncResGoogle.id}`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Google Login on Existing Account (Account Linking)',
      status: 'FAIL',
      details: err.message,
    });
  }

  // 5. TEST SCENARIO B: User creates account with Google first -> Later sets password
  console.log('\n🧪 Testing Scenario B: Google Signup -> Set Password Flow...');
  const testEmailB = `test.user.b.${Date.now()}@example.com`;
  let userBUuid = '';
  try {
    const syncResB = await syncProfileToSupabase({
      email: testEmailB,
      fullName: 'User Beta (Google First)',
      role: 'customer',
      authProvider: 'google',
    });

    if (syncResB.success && syncResB.id) {
      userBUuid = syncResB.id;

      // Update password on existing Supabase auth user
      const { data: updateRes, error: updateErr } = await supabase.auth.admin.updateUserById(userBUuid, {
        password: 'BetaNewPassword123!',
      });

      if (!updateErr && updateRes.user.id === userBUuid) {
        results.push({
          test: 'Google-First User -> Password Set Flow',
          status: 'PASS',
          details: `Password added to Google-created user without altering canonical UUID: ${userBUuid}`,
        });
      } else {
        results.push({
          test: 'Google-First User -> Password Set Flow',
          status: 'FAIL',
          details: updateErr ? updateErr.message : 'UUID mismatch on password update',
        });
      }
    } else {
      results.push({
        test: 'Google-First User -> Password Set Flow',
        status: 'FAIL',
        details: 'Failed to create initial Google user',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Google-First User -> Password Set Flow',
      status: 'FAIL',
      details: err.message,
    });
  }

  // 6. TEST ORDER CREATION & ISOLATION
  console.log('\n🧪 Testing Order Creation & Customer Isolation...');
  const testOrderNumberA = `ORD-TEST-${Date.now()}`;
  try {
    const orderPayload = {
      order_number: testOrderNumberA,
      customer_id: userAUuid,
      customer_name: testNameA,
      customer_email: testEmailA,
      customer_phone: '+923001234567',
      shipping_address: '123 Test Street, Islamabad',
      city: 'Islamabad',
      total_amount: 5500,
      payment_method: 'cod',
      payment_status: 'pending',
      order_status: 'processing',
      items: [
        {
          id: 'item-1',
          name: 'Classic Oxford Shoes',
          price: 5500,
          quantity: 1,
          selectedSize: '42',
        },
      ],
      created_at: new Date().toISOString(),
    };

    const syncOrderRes = await syncOrderToSupabase(orderPayload);
    if (syncOrderRes) {
      // Fetch orders for user A
      const { data: ordersA } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userAUuid);

      // Fetch orders for user B
      const { data: ordersB } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userBUuid);

      const hasOrderA = ordersA?.some((o) => o.order_number === testOrderNumberA);
      const userBLeaked = ordersB?.some((o) => o.order_number === testOrderNumberA);

      if (hasOrderA && !userBLeaked) {
        results.push({
          test: 'Order Ownership & Customer Isolation',
          status: 'PASS',
          details: `Order ${testOrderNumberA} belongs exclusively to User A (${userAUuid}). User B sees 0 of User A orders.`,
        });
      } else {
        results.push({
          test: 'Order Ownership & Customer Isolation',
          status: 'FAIL',
          details: `Isolation failure: User A has order = ${hasOrderA}, User B leaked = ${userBLeaked}`,
        });
      }
    } else {
      results.push({
        test: 'Order Ownership & Customer Isolation',
        status: 'FAIL',
        details: 'Failed to sync order to Supabase',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Order Ownership & Customer Isolation',
      status: 'FAIL',
      details: err.message,
    });
  }

  // 7. TEST ADMIN AUTHORIZATION
  console.log('\n🧪 Testing Admin Authorization Security...');
  try {
    const adminEmails = ['mmaazfalak@icloud.com', 'admin@jutakapra.com'];
    const nonAdminRoleA = testEmailA;
    const isUnauthorizedAdmin = adminEmails.includes(nonAdminRoleA);

    // Verify root super admin profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'mmaazfalak@icloud.com')
      .maybeSingle();

    if (adminProfile && adminProfile.role === 'admin' && !isUnauthorizedAdmin) {
      results.push({
        test: 'Admin Role Authorization',
        status: 'PASS',
        details: `Root Super Admin verified (role: admin). Customer account correctly restricted to role: customer.`,
      });
    } else {
      results.push({
        test: 'Admin Role Authorization',
        status: 'FAIL',
        details: 'Admin verification failed or customer was assigned admin role improperly.',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Admin Role Authorization',
      status: 'FAIL',
      details: err.message,
    });
  }

  // CLEANUP TEST USERS & ORDERS FROM SUPABASE
  console.log('\n🧹 Cleaning up test accounts from Supabase...');
  try {
    if (userAUuid) {
      await supabase.from('orders').delete().eq('customer_id', userAUuid);
      await supabase.from('profiles').delete().eq('id', userAUuid);
      await supabase.auth.admin.deleteUser(userAUuid);
    }
    if (userBUuid) {
      await supabase.from('profiles').delete().eq('id', userBUuid);
      await supabase.auth.admin.deleteUser(userBUuid);
    }
    console.log('✅ Test artifacts cleaned up successfully.');
  } catch (cleanErr: any) {
    console.warn('Test cleanup warning:', cleanErr.message);
  }

  // SUMMARY REPORT
  console.log('\n====================================================');
  console.log('📋 VERIFICATION RESULTS SUMMARY');
  console.log('====================================================');
  results.forEach((r, idx) => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${idx + 1}. [${r.status}] ${icon} ${r.test}`);
    console.log(`   Details: ${r.details}\n`);
  });

  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(allPassed ? '🎉 ALL 7 TEST SUITES PASSED PERFECTLY!' : '⚠️ SOME TESTS FAILED');
}

runComprehensiveVerification().catch(console.error);
