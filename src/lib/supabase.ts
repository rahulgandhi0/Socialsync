import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add debug logging in development and production
const debugInfo = {
  url: supabaseUrl ? '✅ Present' : '❌ Missing',
  key: supabaseKey ? '✅ Present' : '❌ Missing',
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

console.log('Supabase Configuration:', debugInfo);

if (!supabaseUrl || !supabaseKey) {
  const error = new Error(
    'Missing Supabase environment variables. Please check your environment configuration.'
  );
  error.name = 'SupabaseConfigError';
  console.error('Supabase Configuration Error:', {
    ...debugInfo,
    error: error.message,
    stack: error.stack,
  });
  throw error;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'socialsync-auth-token',
    storage: window.localStorage
  }
});

// Test the connection in development only
if (import.meta.env.DEV) {
  void (async () => {
    try {
      const { error } = await supabase.from('instagram_accounts').select('count').limit(1);
      if (error) {
        console.error('Supabase Connection Test Failed:', error);
      } else {
        console.log('✅ Supabase Connection Test Successful');
      }
    } catch (error) {
      console.error('Supabase Connection Test Error:', error);
    }
  })();
}

// Export the initialized client and its type
export type { SupabaseClient }; 