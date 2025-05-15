import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add debug logging in development
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.log('Supabase Key:', supabaseKey ? '✅ Present' : '❌ Missing');
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your environment configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 