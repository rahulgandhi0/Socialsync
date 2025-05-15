import express from 'express';
import { config } from 'dotenv';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Initialize Supabase client with server-side environment variables
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Types and interfaces
interface FacebookPage {
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

interface TokenExchangeResponse {
  access_token: string;
  user_id: string;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Validation schemas
const tokenExchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

const router = express.Router();

// Apply rate limiting to all routes
router.use(limiter);

// Helper functions
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenExchangeResponse> {
  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.VITE_INSTAGRAM_APP_ID!,
      client_secret: process.env.VITE_INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Instagram API error: ${error.error_message || 'Failed to exchange token'}`);
  }

  return response.json();
}

async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  const response = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.VITE_INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get long-lived token: ${error.error_message}`);
  }

  const data: LongLivedTokenResponse = await response.json();
  return data.access_token;
}

async function getInstagramBusinessAccount(accessToken: string): Promise<{ 
  businessAccountId: string; 
  username: string;
  pageAccessToken: string;
}> {
  // Get user's Facebook pages
  const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!pagesResponse.ok) {
    const error = await pagesResponse.json();
    throw new Error(`Failed to fetch Facebook pages: ${error.error_message}`);
  }

  const pagesData = await pagesResponse.json();
  
  // Find the page with an Instagram business account
  const pageWithInstagram: FacebookPage | undefined = pagesData.data.find(
    (page: FacebookPage) => page.instagram_business_account
  );

  if (!pageWithInstagram?.instagram_business_account) {
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
    const error = await igBusinessResponse.json();
    throw new Error(`Failed to fetch Instagram business account details: ${error.error_message}`);
  }

  const igBusinessData = await igBusinessResponse.json();

  return {
    businessAccountId: pageWithInstagram.instagram_business_account.id,
    username: igBusinessData.username,
    pageAccessToken: pageWithInstagram.access_token,
  };
}

// Instagram OAuth callback handler
router.get('/callback', (req, res) => {
  const { code, error, error_reason, state } = req.query;
  
  // Serve an HTML page that posts the result back to the opener window
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Instagram Login...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <script>
          if (${error} || ${error_reason}) {
            window.opener?.postMessage(
              {
                type: 'instagram_auth_error',
                error: ${error_reason || error},
                state: '${state}'
              },
              window.location.origin
            );
          } else if ('${code}') {
            window.opener?.postMessage(
              {
                type: 'instagram_auth',
                code: '${code}',
                state: '${state}'
              },
              window.location.origin
            );
          }
          window.close();
        </script>
        <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center; background-color: rgb(249, 250, 251);">
          <div style="text-align: center;">
            <div style="border: 4px solid #f3f4f6; border-top: 4px solid #8b5cf6; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
            <h1 style="font-size: 1.25rem; font-weight: 600; color: rgb(17, 24, 39);">Processing...</h1>
            <p style="margin-top: 0.5rem; color: rgb(75, 85, 99);">Please wait while we connect your Instagram account.</p>
          </div>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </body>
    </html>
  `);
});

// Token exchange endpoint
router.post('/exchange-token', async (req, res) => {
  try {
    // Validate request body
    const { code, redirectUri } = tokenExchangeSchema.parse(req.body);

    // Get user ID from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Exchange code for short-lived token
    const { access_token: shortLivedToken, user_id: instagramUserId } = 
      await exchangeCodeForToken(code, redirectUri);

    // Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(shortLivedToken);

    // Get Instagram business account details
    const { businessAccountId, username, pageAccessToken } = 
      await getInstagramBusinessAccount(longLivedToken);

    // Store the credentials in Supabase
    const { error: dbError } = await supabase
      .from('instagram_accounts')
      .upsert({
        user_id: user.id,
        instagram_user_id: instagramUserId,
        instagram_business_account_id: businessAccountId,
        instagram_username: username,
        access_token: pageAccessToken,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        connected_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store Instagram credentials');
    }

    // Return success response
    res.json({
      success: true,
      instagram_username: username,
      business_account_id: businessAccountId,
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({ 
        error: error.message || 'Failed to exchange Instagram token' 
      });
    }

    res.status(500).json({ 
      error: 'An unexpected error occurred' 
    });
  }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    // Get user ID from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current Instagram credentials
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError || !account) {
      return res.status(404).json({ error: 'No Instagram account found' });
    }

    // Check if token needs refresh (refresh if less than 7 days until expiry)
    const daysUntilExpiry = (new Date(account.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry > 7) {
      return res.json({ message: 'Token still valid' });
    }

    // Refresh the token
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.access_token}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to refresh token: ${error.error_message}`);
    }

    const { access_token: newToken, expires_in } = await response.json();

    // Update the token in database
    const { error: updateError } = await supabase
      .from('instagram_accounts')
      .update({
        access_token: newToken,
        token_expires_at: new Date(Date.now() + expires_in * 1000),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update token in database');
    }

    res.json({ success: true, message: 'Token refreshed successfully' });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to refresh token' 
    });
  }
});

export default router; 