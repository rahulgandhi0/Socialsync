import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '../context/EventContext.jsx';
import { useUploadContext } from '../context/UploadContext.jsx';
import GlowButton from '../components/GlowButton';
import StepNavigator from '../components/StepNavigator';
import instagramPublisher from '../utils/publisher';
import { format, addMinutes, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, RefreshCw } from 'react-feather';

const PreviewPage = () => {
  const navigate = useNavigate();
  const { selectedEvent, clearEvent } = useEventContext();
  const { orderedImages, captionForPost, clearImages } = useUploadContext();
  
  // State for carousel and scheduling
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [likes] = useState(() => Math.floor(250 + Math.random() * 800));
  const [uploadProgress, setUploadProgress] = useState(0);

  // Calculate minimum allowed scheduled time (20 minutes from now)
  const minScheduledTime = format(addMinutes(new Date(), 20), "yyyy-MM-dd'T'HH:mm");

  // Debug logging
  useEffect(() => {
    console.log('Preview Page State:', {
      hasEvent: !!selectedEvent,
      hasImages: orderedImages?.length,
      hasCaption: captionForPost?.trim?.(),
      eventDetails: selectedEvent,
      imagesCount: orderedImages?.length,
      captionLength: captionForPost?.length,
      fullState: {
        orderedImages,
        captionForPost,
        selectedEvent
      }
    });
  }, [selectedEvent, orderedImages, captionForPost]);

  // Validate scheduled time
  const isValidScheduledTime = () => {
    if (!scheduledTime) return false;
    const scheduledDate = new Date(scheduledTime);
    return isBefore(new Date(), scheduledDate);
  };

  const handleScheduleTimeChange = (e) => {
    setScheduledTime(e.target.value);
  };

  const handleStartNewPost = () => {
    // Clear all states
    clearImages();
    clearEvent();
    setCurrentIndex(0);
    setScheduledTime('');
    setIsSubmitting(false);
    setSubmitStatus(null);
    setSubmitMessage('');
    setShowScheduler(false);
    setUploadProgress(0);
    // Navigate to event search
    navigate('/');
  };

  const handlePublish = async (isScheduled = false) => {
    try {
      if (isScheduled && !isValidScheduledTime()) {
        setSubmitStatus('error');
        setSubmitMessage('Please select a valid future date and time');
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);
      setSubmitMessage('');
      setUploadProgress(0);

      // Start progress animation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90; // Cap at 90% until complete
          return prev + Math.random() * 15;
        });
      }, 1000);

      const publishTime = isScheduled ? new Date(scheduledTime) : null;
      
      const result = await instagramPublisher.publish(orderedImages, captionForPost, publishTime);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSubmitStatus('success');
      setSubmitMessage(isScheduled 
        ? `Post scheduled for ${format(publishTime, 'PPpp')} 🎯` 
        : 'Post published successfully! ✨'
      );
      
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(`Error: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Carousel controls
  const next = () => {
    if (orderedImages?.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % orderedImages.length);
    }
  };
  
  const prev = () => {
    if (orderedImages?.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + orderedImages.length) % orderedImages.length);
    }
  };

  const handlePrevious = () => {
    navigate('/caption-selection');
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % orderedImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + orderedImages.length) % orderedImages.length);
  };

  if (!selectedEvent || !orderedImages?.length || !captionForPost?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">No Content to Preview</h2>
          <p className="text-gray-300 mb-6">Please ensure you have selected an event, uploaded images, and created a caption before proceeding to preview.</p>
          <GlowButton onClick={() => navigate('/')} className="px-6 py-3">
            Go to Event Search
          </GlowButton>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{submitMessage}</h2>
            <p className="text-gray-600">Your content has been successfully published to Instagram.</p>
          </div>
          
          <div className="space-y-3">
            <GlowButton 
              onClick={handleStartNewPost}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Create a New Post
            </GlowButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StepNavigator 
      onPrevious={handlePrevious}
      hideNext={true}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Preview Your Post</h1>
        
        {/* Instagram Preview */}
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-10">
          {/* Instagram Header */}
          <div className="flex items-center p-4 border-b">
            <div className="bg-gradient-to-tr from-pink-500 to-yellow-400 w-10 h-10 rounded-full mr-3"></div>
            <div>
              <p className="font-bold text-gray-800">SocialSync</p>
              <p className="text-xs text-gray-400">Sponsored</p>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="relative">
            <div 
              className={`w-full ${
                orderedImages[currentIndex].aspectRatio === '4:5' 
                  ? 'aspect-[4/5]' 
                  : 'aspect-square'
              }`}
            >
              <img
                src={orderedImages[currentIndex].url}
                alt={`Preview ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {orderedImages.length > 1 && (
              <>
                {/* Carousel Controls */}
                <div className="absolute inset-0 flex items-center justify-between p-2">
                  <button
                    onClick={handlePrev}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {orderedImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Post Details */}
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-3">
              <button className="text-red-500 hover:text-red-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="text-gray-700 hover:text-gray-900">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="text-gray-700 hover:text-gray-900">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <p className="font-bold text-sm text-gray-800 mb-2">{likes.toLocaleString()} likes</p>
            <p className="text-sm mb-2">
              <span className="font-bold mr-2">SocialSync</span>
              {captionForPost}
            </p>
            <p className="text-xs text-gray-400">Just now</p>
          </div>
        </div>

        {/* Publishing Controls */}
        <div className="w-full max-w-md mx-auto space-y-4">
          {isSubmitting && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading to Instagram...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {showScheduler ? (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                Schedule Your Post
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledTime"
                    min={minScheduledTime}
                    value={scheduledTime}
                    onChange={handleScheduleTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 20 minutes in the future
                  </p>
                </div>
                <div className="flex space-x-3">
                  <GlowButton
                    onClick={() => handlePublish(true)}
                    disabled={isSubmitting || !isValidScheduledTime()}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
                  </GlowButton>
                  <button
                    onClick={() => setShowScheduler(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3">
              <GlowButton
                onClick={() => handlePublish(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Now'}
              </GlowButton>
              <button
                onClick={() => setShowScheduler(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Clock className="mr-2" size={20} />
                Schedule
              </button>
            </div>
          )}
          
          {submitMessage && submitStatus === 'error' && (
            <div className="p-4 rounded-md bg-red-100 text-red-700">
              {submitMessage}
            </div>
          )}
        </div>
      </div>
    </StepNavigator>
  );
};

export default PreviewPage; 