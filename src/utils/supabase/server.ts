import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://kbdrlhiishmetsddlstq.supabase.co';

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_SECRET_KEY) ||
  'sb_publishable_r4PIdoHdJ5606fytYnajYA_DV0ekz1d';

export const createClient = (cookieStore?: any) => {
  if (cookieStore && typeof createServerClient === 'function') {
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return typeof cookieStore.getAll === 'function' ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          try {
            if (typeof cookieStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            }
          } catch {}
        },
      },
    });
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};
