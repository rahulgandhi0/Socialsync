import axios from 'axios';

// Use the environment variables directly
const GOOGLE_API_KEY = 'AIzaSyDWt6s2oE6KmTLwoT_gJ_ckUZJ9sONruLA';
const GOOGLE_SEARCH_ENGINE_ID = 'c1c7630325e7342e9';

async function testGoogleSearch() {
  console.log('Google API Key:', GOOGLE_API_KEY ? `Present (${GOOGLE_API_KEY})` : 'Missing');
  console.log('Google Search Engine ID:', GOOGLE_SEARCH_ENGINE_ID ? `Present (${GOOGLE_SEARCH_ENGINE_ID})` : 'Missing');
  
  try {
    const searchQuery = 'Taylor Swift concert';
    console.log('Searching for:', searchQuery);
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        searchType: 'image',
        num: 5,
        imgSize: 'large',
        safe: 'active'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Total results:', response.data.searchInformation?.totalResults);
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('Found', response.data.items.length, 'images');
      
      // Print the first 3 results
      response.data.items.slice(0, 3).forEach((item, index) => {
        console.log(`\nImage ${index + 1}:`);
        console.log('Title:', item.title);
        console.log('URL:', item.link);
        console.log('Thumbnail:', item.image?.thumbnailLink);
      });
    } else {
      console.log('No images found in the response');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error during API call:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testGoogleSearch(); 