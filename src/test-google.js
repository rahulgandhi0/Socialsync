import axios from 'axios';

async function testGoogleConfig() {
  try {
    console.log('Testing Google API configuration...');
    
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    
    console.log('API Key:', apiKey ? '✅ Present' : '❌ Missing');
    console.log('Search Engine ID:', searchEngineId ? '✅ Present' : '❌ Missing');
    
    if (apiKey && searchEngineId) {
      // Test a simple search
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: 'test query',
          num: 1
        }
      });
      
      console.log('\n✅ Google API test successful!');
      console.log('Search API is responding correctly');
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data.error.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testGoogleConfig(); 