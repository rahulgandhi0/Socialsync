import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventContext } from '../context/EventContext.jsx';
import { useUploadContext } from '../context/UploadContext.jsx';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import GlowButton from '../components/GlowButton';
import StepNavigator from '../components/StepNavigator';

// Set to false for production, true for testing
const DEBUG_MODE = false;

// Hardcoded test images to ensure display works
const TEST_IMAGES = [
  {
    id: 'test-1',
    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300',
    title: 'Concert Test Image 1',
    source: 'Unsplash'
  },
  {
    id: 'test-2',
    url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
    thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300',
    title: 'Concert Test Image 2',
    source: 'Unsplash'
  },
  {
    id: 'test-3',
    url: 'https://images.unsplash.com/photo-1522158637959-30ab8018e198',
    thumbnail: 'https://images.unsplash.com/photo-1522158637959-30ab8018e198?w=300',
    title: 'Concert Test Image 3',
    source: 'Unsplash'
  },
  {
    id: 'test-4',
    url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec',
    thumbnail: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300',
    title: 'Concert Test Image 4',
    source: 'Unsplash'
  },
  {
    id: 'test-5',
    url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b',
    thumbnail: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300',
    title: 'Concert Test Image 5',
    source: 'Unsplash'
  }
];

const ImageSelectionPage = () => {
  const navigate = useNavigate();
  const { selectedEvent } = useEventContext();
  const { selectedImages, setSelectedImages, addImage, removeImage } = useUploadContext();
  
  // State for uploaded and searched images
  const [uploadedImages, setUploadedImages] = useState([]);
  const [searchResults, setSearchResults] = useState(DEBUG_MODE ? TEST_IMAGES : []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aspectRatioFilter, setAspectRatioFilter] = useState('any');
  
  // Access API keys from environment variables
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  // Navigation handlers
  const handlePrevious = () => navigate('/events');
  const handleNext = () => {
    // Validate selected images before proceeding
    const invalidImages = selectedImages.filter(img => !img.id || !img.url);
    if (invalidImages.length > 0) {
      console.error('Invalid images in selection:', invalidImages);
      setUploadError('Some selected images are invalid. Please try selecting them again.');
      return;
    }

    console.log('Proceeding to crop page with images:', selectedImages);
    navigate('/crop-and-order');
  };
  
  // Helper function to check if image meets quality requirements
  const meetsQualityRequirements = (width, height, aspectRatioFilter) => {
    if (!width || !height || width < 1000 || height < 1000) {
      console.log('Image rejected - dimensions too small:', { width, height });
      return false;
    }

    const ratio = width / height;
    console.log('Checking image quality:', {
      width,
      height,
      ratio: ratio.toFixed(3),
      filter: aspectRatioFilter
    });

    switch (aspectRatioFilter) {
      case '4:5':
        // For portrait, we want height/width ≈ 1.25 (or width/height ≈ 0.8)
        const isValidPortrait = ratio >= 0.75 && ratio <= 0.85;
        if (!isValidPortrait) {
          console.log('Image rejected - invalid portrait ratio:', ratio.toFixed(3));
        }
        return isValidPortrait;
      case '1:1':
        // For square, we want ratio ≈ 1.0 ±5%
        const isValidSquare = ratio >= 0.95 && ratio <= 1.05;
        if (!isValidSquare) {
          console.log('Image rejected - invalid square ratio:', ratio.toFixed(3));
        }
        return isValidSquare;
      default:
        // For 'any', still ensure it's a reasonable ratio
        const isReasonableRatio = ratio >= 0.5 && ratio <= 2.0;
        if (!isReasonableRatio) {
          console.log('Image rejected - unreasonable ratio:', ratio.toFixed(3));
        }
        return isReasonableRatio;
    }
  };

  // Google Image Search
  const performSearch = useCallback(async (query) => {
    if (!query) {
      console.log('No query provided');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      console.log('Starting image search with params:', {
        query,
        aspectRatioFilter,
        minDimensions: '1000x1000',
        preferredSize: 'xxlarge'
      });

      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_SEARCH_ENGINE_ID,
          q: `${query} high resolution professional photo`,
          searchType: 'image',
          num: 10,
          safe: 'active',
          imgSize: 'xxlarge', // Request largest possible images
          imgType: 'photo', // Only get photos, no illustrations
          filter: '1', // Remove duplicate images
          rights: 'cc_publicdomain,cc_attribute,cc_sharealike', // Prefer licensed images
        }
      });

      console.log('Search response received:', {
        status: response.status,
        itemCount: response.data?.items?.length
      });

      if (response.data?.items?.length > 0) {
        const images = response.data.items
          .filter(item => {
            const width = parseInt(item.image?.width) || 0;
            const height = parseInt(item.image?.height) || 0;
            
            return meetsQualityRequirements(width, height, aspectRatioFilter);
          })
          .map(item => {
            const width = parseInt(item.image?.width);
            const height = parseInt(item.image?.height);
            const ratio = width / height;
            
            const imageObj = {
              id: `google-${item.link}`,
              url: item.link,
              thumbnail: item.link,
              width,
              height,
              aspectRatio: ratio.toFixed(2),
              title: item.title || 'Event Image',
              source: 'Google Search',
              quality: {
                resolution: `${width}x${height}`,
                ratio: `${ratio.toFixed(2)}:1`,
                size: item.image?.byteSize ? `${Math.round(item.image.byteSize / 1024)}KB` : 'Unknown',
                megapixels: ((width * height) / 1000000).toFixed(1) + 'MP'
              }
            };
            
            console.log('Processed high-quality image:', {
              resolution: imageObj.quality.resolution,
              ratio: imageObj.quality.ratio,
              megapixels: imageObj.quality.megapixels
            });
            
            return imageObj;
          });

        if (images.length === 0) {
          console.log('No images met the quality requirements');
          setSearchError(`No high-quality images found matching ${aspectRatioFilter} ratio requirements (minimum 1000x1000px). Try a different search term.`);
          setSearchResults([]);
        } else {
          console.log('Final filtered images:', {
            count: images.length,
            ratios: images.map(img => img.quality.ratio)
          });
          setSearchResults(images);
        }
      } else {
        console.log('No items found in response');
        setSearchResults([]);
        setSearchError('No images found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setSearchError(`Failed to fetch images: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID, aspectRatioFilter]);

  // Effect to re-run search when aspect ratio filter changes
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [aspectRatioFilter, performSearch]);

  // Set dynamic search query based on selected event
  useEffect(() => {
    if (selectedEvent) {
      const eventTitle = selectedEvent.name;
      const venue = selectedEvent._embedded?.venues?.[0]?.name || '';
      const location = selectedEvent._embedded?.venues?.[0]?.city?.name || '';
      
      const defaultQuery = `${eventTitle} ${venue} ${location} concert live`;
      console.log('Setting search query with event data:', defaultQuery);
      setSearchQuery(defaultQuery);
      performSearch(defaultQuery);
    }
  }, [selectedEvent, performSearch]);

  // Debug render
  console.log('Render check — searchResults:', searchResults);

  // Create a local image object from a file
  const createLocalImageObject = (file) => {
    const imageId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Creating local image object:', {
      id: imageId,
      name: file.name,
      file: file
    });

    return {
      id: imageId,
      name: file.name,
      url: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      source: 'Local'
    };
  };
  
  // Modify uploadToDropbox function with correct folder name
  const uploadToDropbox = async (file) => {
    console.log('Starting Dropbox upload...');
    
    // Get token from environment variable
    const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
    
    // Verify token exists
    if (!DROPBOX_ACCESS_TOKEN) {
      console.error('Dropbox access token is missing');
      throw new Error('Dropbox configuration is missing');
    }

    // Create a temporary URL for immediate display
    const localUrl = URL.createObjectURL(file);
    
    try {
      // First upload the file
      const uploadUrl = 'https://content.dropboxapi.com/2/files/upload';
      const path = `/Apps/SocialsyncIG/${file.name}`;
      
      console.log('Uploading to Dropbox path:', path);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: path,
            mode: 'add',
            autorename: true,
            mute: false
          }),
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);

      // Then create a shared link
      const shareUrl = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings';
      const shareResponse = await fetch(shareUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: uploadData.path_display,
          settings: {
            requested_visibility: 'public',
            audience: 'public',
            access: 'viewer'
          }
        })
      });

      let shareData;
      try {
        shareData = await shareResponse.json();
        console.log('Share link created:', shareData);
      } catch (error) {
        console.error('Error parsing share response:', error);
        // If sharing fails, still return the upload data
        return {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          url: localUrl,
          thumbnail: localUrl,
          size: file.size,
          type: file.type,
          source: 'Dropbox',
          path: uploadData.path_display
        };
      }

      // Convert the share URL to a raw URL
      const rawUrl = shareData.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');

      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        url: rawUrl,
        thumbnail: localUrl,
        size: file.size,
        type: file.type,
        source: 'Dropbox',
        path: uploadData.path_display
      };
    } catch (error) {
      console.error('Dropbox upload error:', error);
      // Return a local-only version if upload fails
      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        url: localUrl,
        thumbnail: localUrl,
        size: file.size,
        type: file.type,
        source: 'Local (Upload Failed)',
        error: error.message
      };
    }
  };
  
  // Modify onDrop to handle both successful and failed uploads
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      console.log('Processing dropped files:', acceptedFiles);
      const uploadPromises = acceptedFiles.map(async (file) => {
        // Create a local image object for immediate display
        const localImage = createLocalImageObject(file);
        console.log('Created local image:', localImage);
        
        try {
          // Upload to Dropbox and get public URL
          const dropboxImage = await uploadToDropbox(file);
          console.log('Uploaded to Dropbox:', dropboxImage);
          
          // Merge local and Dropbox data, ensuring we have valid URLs
          const finalImage = {
            ...localImage,
            url: dropboxImage.url || localImage.url,
            thumbnail: dropboxImage.thumbnail || localImage.thumbnail,
            source: dropboxImage.source,
            path: dropboxImage.path
          };
          
          console.log('Final image object:', finalImage);
          return finalImage;
        } catch (error) {
          console.error('Failed to upload image:', error);
          console.log('Falling back to local image:', localImage);
          return localImage; // Fall back to local URL if upload fails
        }
      });
      
      const newImages = await Promise.all(uploadPromises);
      console.log('All images processed:', newImages);
      
      // Validate images before adding them
      const validImages = newImages.filter(img => {
        const isValid = img && img.id && img.url;
        if (!isValid) {
          console.error('Invalid image object:', img);
        }
        return isValid;
      });
      
      console.log('Valid images to be added:', validImages);
      setUploadedImages(prev => [...prev, ...validImages]);
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      setUploadError('Failed to process uploaded files');
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 10485760, // 10MB
    multiple: true
  });
  
  // Image selection handlers
  const toggleImageSelection = (image) => {
    if (!image || !image.id || !image.url) {
      console.error('Invalid image object in toggleImageSelection:', image);
      return;
    }

    console.log('Toggling image selection:', image);
    const isSelected = selectedImages.some(img => img.id === image.id);
    
    if (isSelected) {
      console.log('Removing image:', image.id);
      removeImage(image.id);
    } else {
      console.log('Adding image:', image);
      addImage(image);
    }
  };
  
  const isImageSelected = (imageId) => {
    return selectedImages.some(img => img.id === imageId);
  };
  
  const removeUploadedImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    removeImage(imageId);
  };
  
  // Redirect if no event selected
  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">No Event Selected</h2>
          <p className="text-gray-300 mb-6">Please select an event before proceeding to image selection.</p>
          <GlowButton onClick={() => navigate('/events')} className="px-6 py-3">
            Go to Event Search
          </GlowButton>
        </div>
      </div>
    );
  }
  
  return (
    <StepNavigator
      onPrevious={handlePrevious}
      onNext={handleNext}
      isNextDisabled={selectedImages.length === 0}
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Select Images</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload Your Images</h2>
              
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragActive 
                    ? 'border-gradient-start bg-gradient-start bg-opacity-5' 
                    : 'border-gray-300 hover:border-gradient-start hover:bg-gradient-start hover:bg-opacity-5'
                  }
                `}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="animate-pulse">
                    <p className="text-gray-600">Uploading images...</p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-gray-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">Drag & drop images here, or click to select files</p>
                    <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
                  </div>
                )}
              </div>
              
              {uploadError && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {uploadError}
                </div>
              )}
              
              {/* Uploaded Images Grid */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Uploaded Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div 
                        key={image.id}
                        className={`
                          relative rounded-lg overflow-hidden cursor-pointer
                          ${isImageSelected(image.id) ? 'ring-2 ring-gradient-start' : ''}
                        `}
                        onClick={() => toggleImageSelection(image)}
                      >
                        <img 
                          src={image.thumbnail} 
                          alt={image.name || 'Uploaded image'} 
                          className="w-full aspect-square object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(image.id);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Custom Search Bar with Aspect Ratio Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Custom Image Search</h2>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search terms..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        performSearch(searchQuery);
                      }
                    }}
                  />
                  <button
                    onClick={() => performSearch(searchQuery)}
                    disabled={isSearching}
                    className={`px-6 py-2 rounded-lg text-white ${
                      isSearching ? 'bg-gray-400' : 'bg-gradient-to-r from-gradient-start to-gradient-end'
                    }`}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <select
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                  value={aspectRatioFilter}
                  onChange={(e) => setAspectRatioFilter(e.target.value)}
                >
                  <option value="any">All Ratios</option>
                  <option value="4:5">4:5 Portrait</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>
            </div>
            
            {/* Search Results Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Event Images</h2>
              
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-start mx-auto"></div>
                  <p className="mt-4 text-gray-600">Searching for images...</p>
                </div>
              ) : searchError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{searchError}</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No images found. Try a different search term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {searchResults.map((image) => (
                    <div 
                      key={image.id}
                      className={`
                        relative rounded-lg overflow-hidden cursor-pointer group
                        ${isImageSelected(image.id) ? 'ring-2 ring-gradient-start' : ''}
                      `}
                      onClick={() => toggleImageSelection(image)}
                    >
                      {/* Quality Badge */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full z-10">
                        {image.quality.ratio}
                      </div>
                      
                      {/* Image */}
                      <div className="relative aspect-square">
                        <img 
                          src={image.thumbnail} 
                          alt={image.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Image Info Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end">
                          <p className="text-white text-sm mb-1">Resolution: {image.quality.resolution}</p>
                          <p className="text-white text-sm mb-1">Ratio: {image.quality.ratio}</p>
                          <p className="text-white text-sm mb-1">Size: {image.quality.megapixels}</p>
                          {image.quality.size !== 'Unknown' && (
                            <p className="text-white text-sm">File Size: {image.quality.size}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Resolution and Aspect Ratio Display */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center">
                        {image.quality.resolution} – {image.quality.ratio}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Selection Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">
                Selected Images ({selectedImages.length})
              </h2>
              
              {selectedImages.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500">No images selected</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click on images to select them
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedImages.map((image, index) => (
                      <div 
                        key={image.id} 
                        className="relative group"
                        onClick={() => toggleImageSelection(image)}
                      >
                        <div className="h-32 rounded-lg overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={image.title || `Selected Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image';
                            }}
                          />
                        </div>
                        <button
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-gradient-start to-gradient-end text-white rounded-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Continue with {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StepNavigator>
  );
};

export default ImageSelectionPage; 