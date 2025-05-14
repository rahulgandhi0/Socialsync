import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '../context/EventContext.jsx';
import { useUploadContext } from '../context/UploadContext.jsx';
import GlowButton from '../components/GlowButton';
import StepNavigator from '../components/StepNavigator';

// Hashtag generation utility
const generateHashtags = (event) => {
  if (!event) return [];
  
  const name = event.name.toLowerCase();
  const venue = event._embedded?.venues?.[0]?.name?.split(' ')[0]?.toLowerCase() || '';
  const city = event._embedded?.venues?.[0]?.city?.name?.toLowerCase() || '';
  const genre = event.classifications?.[0]?.genre?.name?.toLowerCase() || '';
  
  const base = ['#event', '#nightout', '#ticketdrop', '#vibes', '#weekendplans'];

  const tags = [
    `#${name.replace(/\s+/g, '')}`,
    `#${city}`,
    `#${venue}`,
    `#${genre}`,
    `#${name.split(' ')[0]}`,
    '#liveevent',
    '#concert',
    '#instagood',
    '#musiclover',
    '#justannounced'
  ].filter(tag => tag.length > 1 && !tag.includes('#undefined'));

  return [...new Set([...base, ...tags])].slice(0, 12);
};

const CaptionSelectionPage = () => {
  const navigate = useNavigate();
  const { selectedEvent } = useEventContext();
  const { captionForPost, setCaptionForPost } = useUploadContext();
  const [selectedCaption, setSelectedCaption] = useState(captionForPost || '');
  const [customCaption, setCustomCaption] = useState('');
  const [activeTab, setActiveTab] = useState('suggested');
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);

  // Generate hashtags when event is loaded
  useEffect(() => {
    if (selectedEvent) {
      const tags = generateHashtags(selectedEvent);
      setSuggestedHashtags(tags);
    }
  }, [selectedEvent]);

  // Dynamic suggested captions
  const suggestedCaptions = useMemo(() => {
    if (!selectedEvent) return [];

    const eventTitle = selectedEvent.name;
    const venue = selectedEvent._embedded?.venues?.[0]?.name || '';
    const date = new Date(selectedEvent.dates?.start?.dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return [
      `${eventTitle} is going up at ${venue} on ${date} 💫 This one's not sitting—tickets are already moving. 🎟️`,
      `Pull up to ${eventTitle} • ${date} at ${venue} • Certified vibe check. Don't wait on tickets. 🎫`,
      `${eventTitle} is your next main character moment ⚡️ ${date} at ${venue} • Tickets won't last.`,
      `Not to start a panic but... ${eventTitle} is almost at capacity 😈 ${venue} • ${date} • Tap in for tickets.`,
      `Tickets? Yeah, they're flying 💨 ${eventTitle} • ${venue} • ${date} 🎟️`,
      `Lowkey? Nah. This is ${eventTitle} at ${venue} on ${date}—it's about to eat. Grab your tickets.`,
      `You've been warned ⚜️ ${eventTitle} on ${date} at ${venue} • Tickets still up, for now.`,
      `${eventTitle} got that ✨ energy • ${date} at ${venue} 🎫 Don't get caught without a ticket.`,
      `Big flex loading: ${eventTitle} • ${venue} • ${date} • Get your ticket before the group chat fills it up.`,
      `This ain't no free trial 😈 ${eventTitle} is happening ${date} at ${venue} • Secure your ticket.`,
      `Rare link-up alert ⚡️ ${eventTitle} at ${venue} • ${date} • Don't sleep on tickets.`,
      `Don't say we didn't warn you ⭐️ ${eventTitle} • ${venue} • ${date} • Grab your ticket.`,
      `It's not just an event. It's ${eventTitle} • ${venue} • ${date} • Tickets are running low. 🎫`,
      `${eventTitle} • ${venue} • ${date} • You outsideee or what?`,
      `Real ones already got their tickets 🎟️ ${eventTitle} • ${venue} • ${date} • You next?`,
    ];
  }, [selectedEvent]);

  const handlePrevious = () => {
    navigate('/crop-and-order');
  };

  const handleNext = () => {
    const finalCaption = getFinalCaption();
    console.log('Saving caption to context:', finalCaption);
    setCaptionForPost(finalCaption);
    navigate('/preview');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCaptionSelect = (caption) => {
    setSelectedCaption(caption);
  };

  const toggleHashtag = (tag) => {
    // Remove # from tag if it exists before storing
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
    setSelectedHashtags((prev) =>
      prev.includes(cleanTag)
        ? prev.filter((t) => t !== cleanTag)
        : [...prev, cleanTag]
    );
  };

  const handleFinalCaptionEdit = (e) => {
    const newText = e.target.value;
    console.log('Editing final caption:', newText);
    // Extract hashtags from the text (words starting with #)
    const hashtags = newText.match(/#\w+/g) || [];
    // Remove hashtags from the text to get the pure caption
    const caption = newText.replace(/#\w+/g, '').trim();
    
    setSelectedCaption(caption);
    // Store hashtags without the # symbol
    setSelectedHashtags(hashtags.map(tag => tag.slice(1))); 
    setCaptionForPost(newText);
  };

  const getFinalCaption = () => {
    // Only add # when joining, don't store it in the selectedHashtags array
    const caption = `${selectedCaption.trim()}\n\n${selectedHashtags.map(tag => `#${tag}`).join(' ')}`;
    console.log('Generated final caption:', caption);
    return caption;
  };

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">No Event Selected</h2>
          <p className="text-gray-300 mb-6">Please select an event before proceeding to caption selection.</p>
          <GlowButton onClick={() => navigate('/')} className="px-6 py-3">
            Go to Event Search
          </GlowButton>
        </div>
      </div>
    );
  }

  const finalPreviewSection = (
    <div className="mt-6 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Final Preview</h3>
      <textarea
        value={getFinalCaption()}
        onChange={handleFinalCaptionEdit}
        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Edit your caption here..."
      />
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>Character count: {getFinalCaption().length}/2200</span>
        <span>Click to edit the caption directly</span>
      </div>
    </div>
  );

  return (
    <StepNavigator 
      onPrevious={handlePrevious}
      onNext={handleNext}
      isNextDisabled={!selectedCaption.trim()}
    >
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Your Caption</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {finalPreviewSection}

          {/* Hashtag Section - Moved Second */}
          <div className="mb-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Suggested Hashtags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleHashtag(tag)}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    selectedHashtags.includes(tag)
                      ? 'bg-gradient-start text-white border-transparent'
                      : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-100'
                  } transition`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Options - Moved Last */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Suggested Captions</h3>
            <div className="space-y-4">
              {suggestedCaptions.map((caption, index) => (
                <div 
                  key={index}
                  className={`relative p-4 border ${
                    selectedCaption === caption
                      ? 'border-gradient-start bg-gray-50 ring-2 ring-green-400'
                      : 'border-gray-200'
                  } rounded-lg cursor-pointer hover:bg-gray-50 transition`}
                  onClick={() => handleCaptionSelect(caption)}
                >
                  {selectedCaption === caption && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 text-white text-xs font-bold flex items-center justify-center rounded-full">
                      ✓
                    </div>
                  )}
                  <p className="text-gray-800">{caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StepNavigator>
  );
};

export default CaptionSelectionPage; 