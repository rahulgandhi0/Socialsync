import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = import.meta.env.VITE_DATABASE_URL;

// Enhanced debug logging for new connection workflow
const debugInfo = {
  url: supabaseUrl ? '✅ Present' : '❌ Missing',
  key: supabaseKey ? '✅ Present' : '❌ Missing',
  dbUrl: databaseUrl ? '✅ Present' : '❌ Missing',
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

console.log('Supabase Configuration (New Workflow):', debugInfo);

if (!supabaseUrl || !supabaseKey) {
  const error = new Error(
    'Missing required Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
  error.name = 'SupabaseConfigError';
  console.error('Supabase Configuration Error:', {
    ...debugInfo,
    error: error.message,
    stack: error.stack,
  });
  throw error;
}

// Updated client configuration for new Supabase workflow
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'socialsync-auth-token',
    storage: window.localStorage,
    flowType: 'pkce'  // Added for enhanced security
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'socialsync-web'
    }
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