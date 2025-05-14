import React from 'react';
import { useParams, Link } from 'react-router-dom';
import GlowButton from '../components/GlowButton';

const EventDetailsPage = () => {
  const { id } = useParams();

  // This would normally fetch event data based on the ID
  const eventData = {
    id,
    title: `Example Event ${id}`,
    date: 'June 15, 2024',
    time: '7:00 PM - 10:00 PM',
    location: 'Downtown Conference Center',
    description: 'This is a placeholder for a detailed event description. In a real application, this would contain information about the event fetched from an API or database based on the event ID.',
    organizer: 'SocialSync Events',
    image: null, // In a real app, this would be a URL to an image
    categories: ['Music', 'Networking']
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Event header with background */}
        <div className="h-48 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow flex items-end p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{eventData.title}</h1>
            <p className="text-white text-opacity-90 mt-2">{eventData.date} • {eventData.time}</p>
          </div>
        </div>
        
        {/* Event details */}
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {eventData.categories.map(category => (
              <span 
                key={category} 
                className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-3">About This Event</h2>
              <p className="text-gray-600 mb-4">{eventData.description}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Details</h3>
              <div className="text-sm text-gray-600">
                <p className="mb-2"><span className="font-medium">Location:</span> {eventData.location}</p>
                <p className="mb-2"><span className="font-medium">Date:</span> {eventData.date}</p>
                <p className="mb-2"><span className="font-medium">Time:</span> {eventData.time}</p>
                <p><span className="font-medium">Organized by:</span> {eventData.organizer}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Link to="/events">
              <button className="text-indigo-600 hover:text-indigo-800">
                ← Back to Events
              </button>
            </Link>
            
            <GlowButton>
              Register Now
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage; 