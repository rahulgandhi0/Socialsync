import { createContext, useState, useContext } from 'react';

// Create the EventContext
const EventContext = createContext();

// Custom hook to use the context
export const useEventContext = () => useContext(EventContext);

// Provider component
export const EventProvider = ({ children }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSearchParams, setEventSearchParams] = useState({
    keyword: '',
    category: null,
    city: null,
    startDate: null,
    endDate: null
  });

  const selectEvent = (event) => {
    setSelectedEvent(event);
  };

  const clearEvent = () => {
    setSelectedEvent(null);
    setEventSearchParams({
      keyword: '',
      category: null,
      city: null,
      startDate: null,
      endDate: null
    });
  };

  const updateSearchParams = (params) => {
    setEventSearchParams(prevParams => ({
      ...prevParams,
      ...params
    }));
  };

  // Context value
  const value = {
    selectedEvent,
    selectEvent,
    clearEvent,
    eventSearchParams,
    updateSearchParams
  };
  
  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

export default EventContext; 