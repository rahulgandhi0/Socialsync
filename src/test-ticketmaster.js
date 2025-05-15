import axios from 'axios';

async function testTicketmasterConfig() {
  try {
    console.log('Testing Ticketmaster API configuration...');
    
    const apiKey = import.meta.env.VITE_TICKETMASTER_KEY;
    console.log('API Key:', apiKey ? '✅ Present' : '❌ Missing');
    
    if (apiKey) {
      // Test a simple event search
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: apiKey,
          size: 1,
          city: 'New York'
        }
      });
      
      console.log('\n✅ Ticketmaster API test successful!');
      console.log('Events API is responding correctly');
      console.log('Found events:', response.data._embedded?.events?.length || 0);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data.fault?.message || error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testTicketmasterConfig(); 