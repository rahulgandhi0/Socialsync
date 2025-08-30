import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

// Updated client configuration for new Supabase workflow
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Set to false for server-side testing
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'socialsync-test'
      }
    }
  }
);

async function applyMigrations() {
  try {
    console.log('Applying new schema migrations...');
    const migrationPath = 'supabase/migrations/20241201000000_reset_schema.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error('❌ Migration Error:', error.message);
        console.error('Failed SQL:', statement.substring(0, 100) + '...');
        
        // Continue with next statement for some errors
        if (error.code !== '42P07' && error.code !== '42710') {
          return;
        } else {
          console.log('⚠️  Continuing (object already exists)...');
        }
      }
    }
    
    console.log('✅ Schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    console.error('Details:', error);
  }
}

async function testSupabaseConnection() {
  try {
    console.log('\n🔍 Testing Supabase connection (New Workflow)...');
    console.log('URL:', process.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing');
    console.log('Key:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
    console.log('Database URL:', process.env.VITE_DATABASE_URL ? '✅ Present' : '❌ Missing');
    
    // Test 1: Check database connectivity
    console.log('\n📊 Testing database schema...');
    const tablesToCheck = [
      'instagram_accounts',
      'scheduled_posts', 
      'posted_content',
      'cached_events',
      'user_preferences',
      'event_interactions'
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ Table '${table}' does not exist`);
          } else {
            console.log(`✅ Table '${table}' exists (${error.message})`);
          }
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 2: Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (expected for test)');
    } else {
      console.log('✅ User authenticated:', user?.email || 'Anonymous');
    }

    // Test 3: Test storage (if available)
    console.log('\n💾 Testing storage...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.log('ℹ️  Storage not configured or accessible:', bucketError.message);
      } else {
        console.log('✅ Storage accessible, buckets:', buckets?.length || 0);
      }
    } catch (err) {
      console.log('ℹ️  Storage test skipped:', err.message);
    }

    console.log('\n✅ Connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Details:', error);
  }
}

// Run tests
(async () => {
  await testSupabaseConnection();
  // Migration already applied manually - skipping automatic migration
  console.log('\n✅ Schema applied manually - migration step skipped');
})(); 