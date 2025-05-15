import express from 'express';
import { config } from 'dotenv';

// Load environment variables
config();

interface FacebookPage {
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

const router = express.Router();

// Instagram OAuth callback handler
router.get('/callback', (req, res) => {
  const { code, error, error_reason } = req.query;
  
  // Serve an HTML page that posts the result back to the opener window
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Instagram Login...</title>
      </head>
      <body>
        <script>
          if (${error} || ${error_reason}) {
            window.opener?.postMessage(
              {
                type: 'instagram_auth_error',
                error: ${error_reason || error}
              },
              window.location.origin
            );
          } else if ('${code}') {
            window.opener?.postMessage(
              {
                type: 'instagram_auth',
                code: '${code}'
              },
              window.location.origin
            );
          }
          window.close();
        </script>
        <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center; background-color: rgb(249, 250, 251);">
          <div style="text-align: center;">
            <h1 style="font-size: 1.25rem; font-weight: 600; color: rgb(17, 24, 39);">Processing...</h1>
            <p style="margin-top: 0.5rem; color: rgb(75, 85, 99);">Please wait while we connect your Instagram account.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Token exchange endpoint
router.post('/exchange-token', async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange the code for a short-lived access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.VITE_INSTAGRAM_APP_ID!,
        client_secret: process.env.VITE_INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.VITE_INSTAGRAM_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token with Instagram');
    }

    const { access_token, user_id } = await tokenResponse.json();

    // Exchange short-lived token for long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.VITE_INSTAGRAM_APP_SECRET}&access_token=${access_token}`
    );

    if (!longLivedTokenResponse.ok) {
      throw new Error('Failed to get long-lived token');
    }

    const { access_token: long_lived_token } = await longLivedTokenResponse.json();

    // Get user's Facebook pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts`, {
      headers: {
        Authorization: `Bearer ${long_lived_token}`,
      },
    });

    if (!pagesResponse.ok) {
      throw new Error('Failed to fetch Facebook pages');
    }

    const pagesData = await pagesResponse.json();
    
    // Find the page with an Instagram business account
    const pageWithInstagram: FacebookPage | undefined = pagesData.data.find(
      (page: FacebookPage) => page.instagram_business_account
    );

    if (!pageWithInstagram || !pageWithInstagram.instagram_business_account) {
      throw new Error('No Instagram business account found');
    }

    // Get Instagram business account details
    const igBusinessResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pageWithInstagram.instagram_business_account.id}?fields=username`,
      {
        headers: {
          Authorization: `Bearer ${pageWithInstagram.access_token}`,
        },
      }
    );

    if (!igBusinessResponse.ok) {
      throw new Error('Failed to fetch Instagram business account details');
    }

    const igBusinessData = await igBusinessResponse.json();

    res.json({
      access_token: long_lived_token,
      user_id,
      business_account_id: pageWithInstagram.instagram_business_account.id,
      username: igBusinessData.username,
      page_access_token: pageWithInstagram.access_token,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange Instagram token' });
  }
});

export default router; 