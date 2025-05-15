import { supabase } from './lib/supabase';
import axios from 'axios';

async function testConfigurations() {
  console.log('🔍 Testing all configurations...\n');

  // Test Supabase
  try {
    console.log('1️⃣ Testing Supabase configuration:');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
    console.log('Anon Key:', supabaseKey ? '✅ Present' : '❌ Missing');
    
    if (supabaseUrl && supabaseKey) {
      const { error } = await supabase.from('instagram_accounts').select('id').limit(0);
      if (error) throw error;
      console.log('✅ Supabase connection successful!\n');
    }
  } catch (error) {
    console.error('❌ Supabase Error:', error.message, '\n');
  }

  // Test Instagram OAuth
  try {
    console.log('2️⃣ Testing Instagram configuration:');
    const appId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    const appSecret = import.meta.env.VITE_INSTAGRAM_APP_SECRET;
    const redirectUri = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI;
    
    console.log('App ID:', appId ? '✅ Present' : '❌ Missing');
    console.log('App Secret:', appSecret ? '✅ Present' : '❌ Missing');
    console.log('Redirect URI:', redirectUri ? '✅ Present' : '❌ Missing');
    
    if (appId && appSecret && redirectUri) {
      const oauthUrl = new URL('https://api.instagram.com/oauth/authorize');
      oauthUrl.searchParams.append('client_id', appId);
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('scope', 'instagram_basic,instagram_content_publish');
      oauthUrl.searchParams.append('response_type', 'code');
      console.log('✅ OAuth URL constructed successfully!\n');
    }
  } catch (error) {
    console.error('❌ Instagram Error:', error.message, '\n');
  }

  // Test Google API
  try {
    console.log('3️⃣ Testing Google API configuration:');
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    
    console.log('API Key:', apiKey ? '✅ Present' : '❌ Missing');
    console.log('Search Engine ID:', searchEngineId ? '✅ Present' : '❌ Missing');
    
    if (apiKey && searchEngineId) {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: 'test',
          num: 1
        }
      });
      console.log('✅ Google API test successful!\n');
    }
  } catch (error) {
    console.error('❌ Google API Error:', error.response?.data?.error?.message || error.message, '\n');
  }

  // Test Ticketmaster API
  try {
    console.log('4️⃣ Testing Ticketmaster API configuration:');
    const apiKey = import.meta.env.VITE_TICKETMASTER_KEY;
    console.log('API Key:', apiKey ? '✅ Present' : '❌ Missing');
    
    if (apiKey) {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: apiKey,
          size: 1,
          city: 'New York'
        }
      });
      console.log('✅ Ticketmaster API test successful!\n');
    }
  } catch (error) {
    console.error('❌ Ticketmaster API Error:', error.response?.data?.fault?.message || error.message, '\n');
  }
}

testConfigurations(); 