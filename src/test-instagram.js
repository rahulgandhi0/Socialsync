async function testInstagramConfig() {
  try {
    console.log('Testing Instagram configuration...');
    
    const appId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    const appSecret = import.meta.env.VITE_INSTAGRAM_APP_SECRET;
    const redirectUri = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI;
    
    console.log('App ID:', appId ? '✅ Present' : '❌ Missing');
    console.log('App Secret:', appSecret ? '✅ Present' : '❌ Missing');
    console.log('Redirect URI:', redirectUri ? '✅ Present' : '❌ Missing');
    
    // Construct and validate OAuth URL
    const oauthUrl = new URL('https://api.instagram.com/oauth/authorize');
    oauthUrl.searchParams.append('client_id', appId);
    oauthUrl.searchParams.append('redirect_uri', redirectUri);
    oauthUrl.searchParams.append('scope', 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement');
    oauthUrl.searchParams.append('response_type', 'code');
    
    console.log('\nOAuth URL constructed successfully:');
    console.log(oauthUrl.toString());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testInstagramConfig(); 