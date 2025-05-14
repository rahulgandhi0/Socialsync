import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '../context/EventContext.jsx';
import GlowButton from './GlowButton';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const { setSelectedEvent } = useEventContext();
  
  // Extract event details
  const {
    name,
    dates,
    images = [],
    _embedded = {}
  } = event;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get venue and city
  const venue = _embedded.venues?.[0]?.name || 'Venue TBA';
  const city = _embedded.venues?.[0]?.city?.name 
    ? `${_embedded.venues[0].city.name}${_embedded.venues[0].state ? ', ' + _embedded.venues[0].state.stateCode : ''}`
    : 'Location TBA';

  // Get image
  const imageUrl = images[0]?.url || 'https://placehold.co/600x400?text=No+Image';

  const handleSelectEvent = () => {
    setSelectedEvent(event);
    navigate('/image-selection');
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md bg-white hover:shadow-xl transition-shadow duration-300">
      <div 
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{name}</h3>
        <p className="text-gray-600 text-sm mb-1">{venue}</p>
        <p className="text-gray-500 text-sm mb-3">{city}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-indigo-600">
            {formatDate(dates?.start?.localDate)}
          </span>
          <GlowButton 
            onClick={handleSelectEvent}
            className="text-sm py-1 px-4"
          >
            Select Event
          </GlowButton>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 