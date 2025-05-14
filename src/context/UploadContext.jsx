import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const UploadContext = createContext();

// Custom hook to use the Upload context
export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
};

// Provider component
export const UploadProvider = ({ children }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [orderedImages, setOrderedImages] = useState([]);
  const [captionForPost, setCaptionForPost] = useState('');
  
  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedImages = JSON.parse(localStorage.getItem('orderedImages'));
      const savedCaption = localStorage.getItem('captionForPost');
      const savedSelectedImages = JSON.parse(localStorage.getItem('selectedImages'));

      console.log('Loading saved state:', {
        hasOrderedImages: !!savedImages?.length,
        hasCaption: !!savedCaption,
        hasSelectedImages: !!savedSelectedImages?.length
      });

      if (savedImages?.length) setOrderedImages(savedImages);
      if (savedCaption) setCaptionForPost(savedCaption);
      if (savedSelectedImages?.length) setSelectedImages(savedSelectedImages);
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('orderedImages', JSON.stringify(orderedImages));
      localStorage.setItem('captionForPost', captionForPost);
      localStorage.setItem('selectedImages', JSON.stringify(selectedImages));

      console.log('Saving state to localStorage:', {
        orderedImagesCount: orderedImages?.length,
        captionLength: captionForPost?.length,
        selectedImagesCount: selectedImages?.length
      });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [orderedImages, captionForPost, selectedImages]);
  
  const addImage = (image) => {
    setSelectedImages(prev => {
      // Check if image already exists
      const exists = prev.some(img => img.id === image.id);
      if (!exists) {
        return [...prev, image];
      }
      return prev;
    });
  };
  
  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };
  
  const clearImages = () => {
    setSelectedImages([]);
    setOrderedImages([]);
    setCaptionForPost('');
    // Clear localStorage
    localStorage.removeItem('orderedImages');
    localStorage.removeItem('captionForPost');
    localStorage.removeItem('selectedImages');
  };
  
  const value = {
    selectedImages,
    addImage,
    removeImage,
    clearImages,
    setSelectedImages,
    orderedImages,
    setOrderedImages,
    captionForPost,
    setCaptionForPost
  };
  
  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export default UploadContext; 