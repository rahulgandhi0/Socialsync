import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Instagram, Loader2 } from 'lucide-react';

export default function InstagramConnect() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleInstagramConnect = async () => {
    setIsConnecting(true);
    try {
      // Get the correct redirect URI based on environment
      const redirectUri = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI || 
        `${window.location.origin}/instagram/auth`;

      const scopes = [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement'
      ].join(',');

      // Generate a random state for security
      const state = Math.random().toString(36).substring(7);
      
      // Use Facebook Login for Instagram
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${
        import.meta.env.VITE_INSTAGRAM_APP_ID
      }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${
        encodeURIComponent(scopes)
      }&response_type=code&state=${state}`;
      
      // Open auth in a popup
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'instagram-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for the auth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        // Verify state to prevent CSRF
        if (event.data?.state !== state) {
          throw new Error('Invalid state parameter');
        }

        if (event.data?.type === 'instagram_auth') {
          const { code } = event.data;
          
          try {
            // Exchange code for access token and account details
            const response = await fetch('/api/instagram/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code,
                redirectUri
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Failed to exchange token');
            }

            // Success! Account connected
            toast.success(`Successfully connected Instagram account @${data.instagram_username}!`);
            
            // Clean up
            window.removeEventListener('message', handleMessage);
            
            // Refresh the page
            window.location.reload();

          } catch (error) {
            console.error('Token exchange error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to connect Instagram account');
          }
        } else if (event.data?.type === 'instagram_auth_error') {
          const errorMessage = event.data.error || 'Failed to connect Instagram account';
          console.error('Instagram auth error:', errorMessage);
          toast.error(errorMessage);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Instagram connection error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect Instagram account');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block p-3 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900">
            Connect Instagram Account
          </h2>
          <p className="text-surface-600 max-w-md mx-auto">
            Connect your Instagram Business Account to start scheduling and automating your social media posts
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-surface-50 border border-surface-200">
            <h3 className="font-medium text-surface-900 mb-2">What you'll get:</h3>
            <ul className="space-y-2 text-surface-600">
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-gradient-start mr-2" />
                Automated post scheduling
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-gradient-mid mr-2" />
                Content optimization suggestions
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-gradient-end mr-2" />
                Performance analytics and insights
              </li>
            </ul>
          </div>

          <button
            onClick={handleInstagramConnect}
            disabled={isConnecting}
            className="button-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Instagram className="w-5 h-5" />
                <span>Connect Instagram Account</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-surface-500 text-center">
          By connecting your account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
} 