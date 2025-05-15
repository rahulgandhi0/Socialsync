import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function InstagramAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    if (window.opener) {
      if (code) {
        window.opener.postMessage({
          type: 'instagram_auth',
          code
        }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({
          type: 'instagram_auth_error',
          error: errorDescription || errorReason || error
        }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
} 