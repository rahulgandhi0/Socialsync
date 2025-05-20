import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2, LogOut, Menu, X } from 'lucide-react';

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authListener = null;

    async function initializeAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    authListener = subscription;

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-gradient-start" />
          <p className="text-surface-600 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-surface-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="button-primary w-full mb-2"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/login')}
              className="button-secondary w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPublicRoute = location.pathname === '/' || location.pathname === '/policies';
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';

  // Don't show the layout for auth pages
  if (isAuthRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass border-b border-surface-200/50">
          <div className="container mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="flex items-center justify-between h-[var(--header-height)]">
              <Link 
                to="/"
                className="text-2xl font-bold gradient-text hover:animate-text-shimmer"
              >
                SocialSync
              </Link>
              
              <div className="flex items-center space-x-6">
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1">
                  {/* Public Routes */}
                  <Link 
                    to="/policies" 
                    className={`nav-link ${location.pathname === '/policies' ? 'nav-link-active' : ''}`}
                  >
                    Policies
                  </Link>

                  {/* Protected Routes - Only show when logged in */}
                  {user && (
                    <>
                      <Link 
                        to="/events" 
                        className={`nav-link ${location.pathname.includes('/events') ? 'nav-link-active' : ''}`}
                      >
                        Events
                      </Link>
                      <Link 
                        to="/instagram/connect" 
                        className={`nav-link ${location.pathname === '/instagram/connect' ? 'nav-link-active' : ''}`}
                      >
                        Instagram
                      </Link>
                      <Link 
                        to="/analytics" 
                        className={`nav-link ${location.pathname === '/analytics' ? 'nav-link-active' : ''}`}
                      >
                        Analytics
                      </Link>
                    </>
                  )}

                  {/* Auth Button */}
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="nav-link text-surface-600 hover:text-red-600 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      className="button-primary"
                    >
                      Sign In
                    </Link>
                  )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-surface-100"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-surface-600" />
                  ) : (
                    <Menu className="w-6 h-6 text-surface-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass border-b border-surface-200/50">
            <nav className="container mx-auto max-w-[var(--content-max-width)] px-4 py-4 space-y-2">
              <Link 
                to="/policies" 
                className={`block nav-link ${location.pathname === '/policies' ? 'nav-link-active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Policies
              </Link>

              {user && (
                <>
                  <Link 
                    to="/events" 
                    className={`block nav-link ${location.pathname.includes('/events') ? 'nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link 
                    to="/instagram/connect" 
                    className={`block nav-link ${location.pathname === '/instagram/connect' ? 'nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Instagram
                  </Link>
                  <Link 
                    to="/analytics" 
                    className={`block nav-link ${location.pathname === '/analytics' ? 'nav-link-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                </>
              )}

              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 nav-link text-surface-600 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link 
                  to="/login"
                  className="block button-primary text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-[var(--content-max-width)] px-4 pt-[calc(var(--header-height)_+_2rem)] pb-16">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 