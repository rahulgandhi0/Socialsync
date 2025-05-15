import { supabase } from './lib/supabase';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic query
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('count')
      .limit(1);

    if (error) throw error;
    
    console.log('✅ Supabase connection successful!');
    console.log('Database is accessible');
    
    // Test storage
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('instagram-images');
      
    if (bucketError) throw bucketError;
    
    console.log('✅ Storage bucket "instagram-images" is accessible');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testSupabaseConnection(); 