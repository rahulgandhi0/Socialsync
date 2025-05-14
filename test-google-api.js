import axios from 'axios';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';

// Set up __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually load .env file
const envConfig = config();
if (envConfig.error) {
  console.error('Error loading .env file');
}

// Read .env file manually if needed
const envPath = `${__dirname}/.env`;
let envVars = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^VITE_([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2].trim();
    }
  });
}

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY || envVars.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_SEARCH_ENGINE_ID || envVars.GOOGLE_SEARCH_ENGINE_ID;

async function testGoogleSearch() {
  console.log('Google API Key:', GOOGLE_API_KEY ? 'Present (starts with ' + GOOGLE_API_KEY.substring(0, 5) + '...)' : 'Missing');
  console.log('Google Search Engine ID:', GOOGLE_SEARCH_ENGINE_ID ? 'Present (starts with ' + GOOGLE_SEARCH_ENGINE_ID.substring(0, 5) + '...)' : 'Missing');
  
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