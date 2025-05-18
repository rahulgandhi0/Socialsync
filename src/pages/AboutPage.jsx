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

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
          <div className="text-gray-600 space-y-4">
            <p>
              At SocialSync, we take your privacy seriously. This privacy policy describes how we collect, use, and protect your personal information.
            </p>
            <h3 className="text-lg font-medium text-gray-700 mt-4">Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Account information (name, email, profile picture)</li>
              <li>Event preferences and attendance history</li>
              <li>Location data (with your permission)</li>
              <li>Device and usage information</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-700 mt-4">How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Personalize your event recommendations</li>
              <li>Improve our services and user experience</li>
              <li>Send relevant notifications and updates</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            <p className="mt-4">
              We never sell your personal information to third parties. For more details about our data practices, please contact us.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Terms of Use</h2>
          <div className="text-gray-600 space-y-4">
            <p>
              By using SocialSync, you agree to these terms of use. Please read them carefully before using our platform.
            </p>
            <h3 className="text-lg font-medium text-gray-700 mt-4">User Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the security of your account</li>
              <li>Respect other users and their content</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-700 mt-4">Content Guidelines</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>No harmful, offensive, or inappropriate content</li>
              <li>No spam or unauthorized promotional material</li>
              <li>No infringement of intellectual property rights</li>
              <li>No fake events or misleading information</li>
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that violate these terms. For the complete terms of use, please contact us.
            </p>
          </div>
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