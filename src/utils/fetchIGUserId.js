import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v19.0';
const ACCESS_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
const IG_USERNAME = import.meta.env.VITE_INSTAGRAM_USERNAME;

/**
 * Fetch the connected Instagram Business Account ID from the user's Facebook Pages
 * @returns {Promise<string>} The Instagram Business Account ID
 */
export async function fetchInstagramUserId() {
  try {
    if (!ACCESS_TOKEN) {
      throw new Error('Missing Facebook access token in environment variables');
    }

    // Step 1: Get list of pages the user has access to
    const pagesResponse = await axios.get(`${BASE_URL}/me/accounts`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'name,access_token,instagram_business_account{id,username}'
      }
    });

    const pages = pagesResponse.data.data;
    if (!pages || pages.length === 0) {
      throw new Error('No managed Facebook Pages found for the current access token');
    }

    // Step 2: Find the page that matches the IG username
    const matched = pages.find(
      page => page.instagram_business_account?.username === IG_USERNAME
    );

    if (!matched) {
      console.log('Available IG usernames:', pages.map(p => p.instagram_business_account?.username));
      throw new Error(`No Instagram business account found matching username: @${IG_USERNAME}`);
    }

    console.log('✅ Found IG Business Account:', matched.instagram_business_account.id);
    return matched.instagram_business_account.id;

  } catch (err) {
    console.error('❌ Failed to fetch Instagram user ID:', err.response?.data || err.message);
    throw err;
  }
} 