import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  // Don't show the layout for auth pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Animated Banner */}
      <div className="relative w-full overflow-hidden">
        {/* Background with enhanced glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow opacity-90"></div>
        
        {/* Subtle overlay patterns for depth */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_50%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-5xl py-6 px-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 animate-text-shimmer">
              SocialSync
            </h1>
            <p className="text-base text-white text-opacity-90">
              Making event promotion easy
            </p>
          </div>
          
          {/* Auth Navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-white">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto max-w-5xl">
          <nav className="flex space-x-1">
            <Link 
              to="/" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              Home
            </Link>
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
              </>
            )}
            <Link 
              to="/about" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/about' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-start"></div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} SocialSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout; 