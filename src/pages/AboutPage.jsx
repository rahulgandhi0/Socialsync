import React from 'react';
import GlowButton from '../components/GlowButton';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">About SocialSync</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            SocialSync is dedicated to making event discovery and promotion easier 
            for everyone. Our platform connects event organizers with attendees, 
            creating a seamless experience for finding and sharing social experiences.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Discover events in your area</li>
            <li>Filter by categories and dates</li>
            <li>Create and promote your own events</li>
            <li>Connect with other attendees</li>
            <li>Receive personalized event recommendations</li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-gray-600 mb-4">
            Have questions or suggestions? We'd love to hear from you!
          </p>
          <p className="text-gray-600">
            Email: <a href="mailto:info@socialsync.example" className="text-gradient-start hover:underline">info@socialsync.example</a>
          </p>
        </div>
        
        <div className="flex justify-center mt-8">
          <Link to="/">
            <GlowButton className="px-6">
              Explore Events
            </GlowButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 