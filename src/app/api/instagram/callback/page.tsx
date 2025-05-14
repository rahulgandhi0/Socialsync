import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstagramCallback() {
  const router = useRouter();

  useEffect(() => {
    // Get the code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const error_reason = urlParams.get('error_reason');

    if (error || error_reason) {
      // Send error back to opener window
      window.opener?.postMessage(
        {
          type: 'instagram_auth_error',
          error: error_reason || error
        },
        window.location.origin
      );
    } else if (code) {
      // Send the code back to opener window
      window.opener?.postMessage(
        {
          type: 'instagram_auth',
          code
        },
        window.location.origin
      );
    }

    // Close this popup window
    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Processing...</h1>
        <p className="mt-2 text-gray-600">Please wait while we connect your Instagram account.</p>
      </div>
    </div>
  );
} 