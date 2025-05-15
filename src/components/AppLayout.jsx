import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check current auth status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        setUser(session?.user ?? null);
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          // If user is not authenticated and not on login/signup page, redirect to login
          if (!currentUser && !location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
            navigate('/login');
          }
          
          // If user is authenticated and on login/signup page, redirect to events
          if (currentUser && (location.pathname.includes('/login') || location.pathname.includes('/signup'))) {
            navigate('/events');
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
        toast.error('Authentication error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out: ' + error.message);
    }
  };

  // Don't show the layout for auth pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-2"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !location.pathname.includes('/login')) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-gradient-start">
              SocialSync
            </Link>
            
            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex space-x-1">
            <Link 
              to="/events" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname.includes('/events') ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              Events
            </Link>
            {user && (
              <>
                <Link 
                  to="/instagram/connect" 
                  className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/instagram/connect' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
                >
                  Connect Instagram
                </Link>
                <Link 
                  to="/analytics" 
                  className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/analytics' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
                >
                  Analytics
                </Link>
              </>
            )}
            <Link 
              to="/about" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/about' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 