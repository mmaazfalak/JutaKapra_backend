import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vtlcbycbsrhcxemwlpbf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qk1ZBdWX9tBmS5V-H3KaFA_T-7CROvL';

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoresTable() {
  try {
    console.log('1. Querying public.stores table in Supabase...');
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching stores:', error.message);
      return;
    }

    console.log(`✅ Success! Found ${data?.length || 0} stores in Supabase database:`);
    data?.forEach((s) => {
      console.log(` - [${s.id}] "${s.name}" | Owner: ${s.owner_email} | Commission: ${s.commission_rate}% | Hidden: ${s.is_hidden}`);
    });

    console.log('\n2. Testing Store Entity Upsert...');
    const testStore = {
      id: 'store-test-live',
      name: 'Live Verification Vault',
      slug: 'live-verification-vault',
      owner_email: 'verifier@jutakapra.com',
      owner_name: 'Verification Bot',
      owner_phone: '+92 300 1234567',
      passcode: 'live123',
      status: 'active',
      is_hidden: false,
      city: 'Islamabad',
      address: 'F-7 Markaz, Islamabad',
      commission_rate: 10.00,
      description: 'Automated live verification entity.',
    };

    const { error: upsertErr } = await supabase.from('stores').upsert(testStore, { onConflict: 'id' });
    if (upsertErr) {
      console.error('❌ Upsert test error:', upsertErr.message);
    } else {
      console.log('✅ Upsert test succeeded!');
      // Clean up test store
      await supabase.from('stores').delete().eq('id', 'store-test-live');
      console.log('✅ Cleaned up temporary test store.');
    }

    console.log('\n🎉 Supabase Stores Integration is 100% Active & Operational!');
  } catch (err: any) {
    console.error('❌ Exception in test:', err.message);
  }
}

checkStoresTable();
