import { fetchInstagramUserId } from './src/utils/fetchIGUserId.js';

async function testInstagramSetup() {
  try {
    console.log('🔍 Fetching Instagram Business Account ID...');
    const businessAccountId = await fetchInstagramUserId();
    console.log('✅ Success! Found Instagram Business Account ID:', businessAccountId);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testInstagramSetup(); 