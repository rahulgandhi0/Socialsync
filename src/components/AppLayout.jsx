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
    let mounted = true;
    let authListener = null;

    async function initializeAuth() {
      try {
        // Check current auth status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Handle navigation after setting loading to false
          if (!session?.user && !location.pathname.includes('/login') && !location.pathname.includes('/signup') && !location.pathname.includes('/about')) {
            navigate('/login', { replace: true });
          }
          
          if (session?.user && (location.pathname.includes('/login') || location.pathname.includes('/signup'))) {
            navigate('/events', { replace: true });
          }
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (!currentUser && !location.pathname.includes('/login') && !location.pathname.includes('/signup') && !location.pathname.includes('/about')) {
            navigate('/login', { replace: true });
          }
          
          if (currentUser && (location.pathname.includes('/login') || location.pathname.includes('/signup'))) {
            navigate('/events', { replace: true });
          }
        });

        authListener = subscription;
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
          toast.error('Authentication error: ' + err.message);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login', { replace: true });
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out: ' + error.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-start/5 via-gradient-mid/5 to-gradient-end/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to={user ? "/events" : "/"} 
              className="text-xl font-bold bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent"
            >
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
      <nav className="bg-white/80 backdrop-blur-sm shadow-md">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex space-x-1">
            {user && (
              <>
                <Link 
                  to="/events" 
                  className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname.includes('/events') ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
                >
                  Events
                </Link>
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