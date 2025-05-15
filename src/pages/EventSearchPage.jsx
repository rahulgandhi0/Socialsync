import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '../context/EventContext.jsx';
import GlowButton from '../components/GlowButton';
import StepNavigator from '../components/StepNavigator';

// Use dynamic API key from environment variable
const API_KEY = import.meta.env.VITE_TICKETMASTER_KEY;
if (!API_KEY) {
  throw new Error('Missing required environment variable: VITE_TICKETMASTER_KEY');
}

// Static arrays for dropdowns
const MAIN_CATEGORIES = [
  "Music",
  "Sports",
  "Arts & Theatre",
  "Film",
  "Miscellaneous"
];

const SUBCATEGORY_MAP = {
  Music: [
    "Rock",
    "Pop",
    "Hip-Hop/Rap",
    "Country",
    "Jazz",
    "Electronic",
    "Classical",
    "Reggae",
    "Latin",
    "R&B",
    "Metal"
  ],
  Sports: [
    "Baseball",
    "Basketball",
    "Football",
    "Hockey",
    "Soccer",
    "Tennis",
    "Motorsports",
    "Golf"
  ],
  "Arts & Theatre": [
    "Theatre",
    "Comedy",
    "Dance",
    "Opera",
    "Circus & Specialty Acts"
  ],
  Film: [
    "Film Festivals",
    "Movie Screenings"
  ],
  Miscellaneous: [
    "Fairs & Festivals",
    "Lectures & Seminars",
    "Family",
    "Spiritual",
    "Other"
  ]
};

const CITIES = [
  "Atlanta",
  "Austin",
  "Boston",
  "Chicago",
  "Dallas",
  "Denver",
  "Houston",
  "Las Vegas",
  "Los Angeles",
  "Miami",
  "New York",
  "Philadelphia",
  "Phoenix",
  "San Diego",
  "San Francisco",
  "San Jose",
  "Seattle",
  "Washington"
];

const EventSearchPage = () => {
  const navigate = useNavigate();
  const { selectEvent } = useEventContext();
  
  // State for form inputs
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [subcategoryInput, setSubcategoryInput] = useState('');
  
  // Form state
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Format date for API
  const formatDateForApi = (date, isEndDate = false) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${isEndDate ? '23:59:59' : '00:00:00'}Z`;
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    selectEvent(event);
    navigate('/image-selection');
  };
  
  // Handle main category selection
  const handleMainCategoryChange = (option) => {
    setSelectedMainCategory(option);
    setSelectedSubcategory(null); // Reset subcategory when main category changes
  };
  
  // Convert arrays to react-select options
  const mainCategoryOptions = MAIN_CATEGORIES.map(category => ({
    value: category,
    label: category
  })).sort((a, b) => a.label.localeCompare(b.label));
  
  const cityOptions = CITIES.map(city => ({
    value: city,
    label: city
  })).sort((a, b) => a.label.localeCompare(b.label));
  
  // Get subcategory options based on selected main category
  const subcategoryOptions = useMemo(() => {
    if (!selectedMainCategory) return [];
    
    return SUBCATEGORY_MAP[selectedMainCategory.value].map(subcategory => ({
      value: subcategory,
      label: subcategory
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedMainCategory]);
  
  // Filter cities based on input
  const filteredCities = useMemo(() => {
    if (!cityInput) return cityOptions;
    return cityOptions.filter(city => 
      city.label.toLowerCase().includes(cityInput.toLowerCase())
    );
  }, [cityInput]);
  
  // Filter main categories based on input
  const filteredMainCategories = useMemo(() => {
    if (!categoryInput) return mainCategoryOptions;
    return mainCategoryOptions.filter(category => 
      category.label.toLowerCase().includes(categoryInput.toLowerCase())
    );
  }, [categoryInput]);
  
  // Filter subcategories based on input
  const filteredSubcategories = useMemo(() => {
    if (!subcategoryInput) return subcategoryOptions;
    return subcategoryOptions.filter(subcategory => 
      subcategory.label.toLowerCase().includes(subcategoryInput.toLowerCase())
    );
  }, [subcategoryInput, subcategoryOptions]);
  
  // Validate form before search
  const validateForm = () => {
    if (!selectedMainCategory) {
      setError('Please select a main category');
      return false;
    }
    
    if (!selectedSubcategory) {
      setError('Please select a subcategory');
      return false;
    }
    
    if (!selectedCity) {
      setError('Please select a city');
      return false;
    }
    
    if (!startDate) {
      setError('Please select a start date');
      return false;
    }
    
    if (!endDate) {
      setError('Please select an end date');
      return false;
    }
    
    return true;
  };
  
  // Fetch events
  const fetchEvents = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        apikey: API_KEY,
        classificationName: selectedSubcategory.value, // Use the subcategory for the API call
        city: selectedCity.value,
        startDateTime: formatDateForApi(startDate),
        endDateTime: formatDateForApi(endDate, true),
        size: 30
      };
      
      console.log('Fetching events with params:', params);
      
      const response = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        { params }
      );
      
      console.log('Events API response:', response.data);
      
      if (response.data._embedded?.events) {
        setEvents(response.data._embedded.events);
      } else {
        setEvents([]);
        setError('No events found matching your criteria');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };
  
  // Handle navigation to next step
  const handleNext = () => {
    if (events.length > 0) {
      navigate('/image-selection');
    } else {
      setError('Please search and select an event first');
    }
  };
  
  const isNextDisabled = events.length === 0;

  return (
    <StepNavigator 
      hidePrevious={true}
      isNextDisabled={isNextDisabled}
      onNext={handleNext}
    >
      <div className="w-full">
        <div className="bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end animate-glow-flow p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">Find Events</h2>
          <p className="text-white text-opacity-90">Search for events to promote on SocialSync</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Category
                </label>
                <Select
                  options={filteredMainCategories}
                  value={selectedMainCategory}
                  onChange={handleMainCategoryChange}
                  onInputChange={setCategoryInput}
                  placeholder="Select a category"
                  className="text-gray-900"
                  isSearchable
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Subcategory
                </label>
                <Select
                  options={filteredSubcategories}
                  value={selectedSubcategory}
                  onChange={setSelectedSubcategory}
                  onInputChange={setSubcategoryInput}
                  placeholder={selectedMainCategory ? "Select a subcategory" : "Select a category first"}
                  className="text-gray-900"
                  isSearchable
                  isDisabled={!selectedMainCategory}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  City
                </label>
                <Select
                  options={filteredCities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  onInputChange={setCityInput}
                  placeholder="Select a city"
                  className="text-gray-900"
                  isSearchable
                  maxMenuHeight={300}
                  menuPlacement="auto"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  placeholderText="Select start date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  wrapperClassName="w-full"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || new Date()}
                  placeholderText="Select end date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <GlowButton type="submit" className="px-8 py-2">
                {loading ? 'Searching...' : 'Search Events'}
              </GlowButton>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-center">
                {error}
              </div>
            )}
          </form>
        </div>
        
        {/* Results */}
        {events.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Events Found ({events.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <div key={event.id} className="rounded-lg overflow-hidden shadow-md bg-white hover:shadow-xl transition-shadow duration-300">
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.images[0]?.url || 'https://placehold.co/600x400?text=No+Image'})` }}
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{event.name}</h3>
                    <p className="text-gray-600 text-sm mb-1">{event._embedded?.venues?.[0]?.name || 'Venue TBA'}</p>
                    <p className="text-gray-500 text-sm mb-3">
                      {event._embedded?.venues?.[0]?.city?.name
                        ? `${event._embedded.venues[0].city.name}${event._embedded.venues[0].state ? ', ' + event._embedded.venues[0].state.stateCode : ''}`
                        : 'Location TBA'
                      }
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {event.dates?.start?.localDate
                          ? new Date(event.dates.start.localDate).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : 'Date TBA'
                        }
                      </span>
                      <GlowButton 
                        onClick={() => handleSelectEvent(event)}
                        className="text-sm py-1 px-4"
                      >
                        Select Event
                      </GlowButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No results message */}
        {!loading && events.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              Enter your search criteria and click "Search Events" to find events.
            </p>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-gradient-start to-gradient-end rounded-full mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        )}
      </div>
    </StepNavigator>
  );
};

export default EventSearchPage; 