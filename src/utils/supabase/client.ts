import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kbdrlhiishmetsddlstq.supabase.co';

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_r4PIdoHdJ5606fytYnajYA_DV0ekz1d';

export const createClient = () => {
  if (typeof createBrowserClient === 'function') {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }
  return createSupabaseClient(supabaseUrl, supabaseKey);
};
