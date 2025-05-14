import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Animated Banner */}
      <div className="relative w-full overflow-hidden">
        {/* Background with enhanced glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow opacity-90"></div>
        
        {/* Subtle overlay patterns for depth */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_50%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-5xl py-6 px-6">
          <h1 className="text-3xl font-bold text-white mb-1 animate-text-shimmer">
            SocialSync
          </h1>
          <p className="text-base text-white text-opacity-90">
            Making event promotion easy
          </p>
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
            <Link 
              to="/events" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname.includes('/events') ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              Events
            </Link>
            <Link 
              to="/demo" 
              className={`px-4 py-3 font-medium transition-colors hover:bg-gray-100 ${location.pathname === '/demo' ? 'border-b-2 border-gradient-start text-gradient-start' : 'text-gray-700'}`}
            >
              Glow Demo
            </Link>
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
        <Outlet />
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