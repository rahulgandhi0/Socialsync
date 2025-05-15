import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

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
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">
          Connect Instagram Account
        </h3>
        <p className="mt-2 text-gray-600">
          Connect your Instagram Business Account to start scheduling posts
        </p>
      </div>

      <button
        onClick={handleInstagramConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Instagram Account'
        )}
      </button>
    </div>
  );
} 