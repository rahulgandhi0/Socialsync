import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadContext } from '../context/UploadContext';
import Cropper from 'react-easy-crop';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';
import StepNavigator from '../components/StepNavigator';

// Helper function to create an image object with retries
const createImage = (url) =>
  new Promise(async (resolve, reject) => {
    // List of proxy services to try
    const proxyServices = [
      (url) => url, // Try original URL first
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url) => {
        const timestamp = new Date().getTime();
        return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
      }
    ];

    let lastError = null;

    // Try each proxy service in sequence
    for (const getProxyUrl of proxyServices) {
      try {
        const proxyUrl = getProxyUrl(url);
        console.log('Attempting to load image with URL:', proxyUrl);
        
        const image = new Image();
        
        await new Promise((res, rej) => {
          image.onload = () => {
            // Verify the loaded image has sufficient resolution
            if (image.naturalWidth < 1080 || image.naturalHeight < 1080) {
              console.warn('Image resolution may be too low:', {
                width: image.naturalWidth,
                height: image.naturalHeight,
                recommended: '1080x1080 minimum'
              });
            }
            res();
          };
          image.onerror = (error) => {
            console.warn('Failed to load image with URL:', proxyUrl, error);
            rej(error);
          };
          
          // Set crossOrigin for all attempts except the timestamp one
          if (getProxyUrl !== proxyServices[3]) {
            image.crossOrigin = "anonymous";
          }
          
          image.src = proxyUrl;
        });

        // If we get here, the image loaded successfully
        console.log('Successfully loaded image:', {
          url: proxyUrl,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          displayWidth: image.width,
          displayHeight: image.height
        });
        resolve(image);
        return;
      } catch (error) {
        lastError = error;
        console.warn('Proxy attempt failed:', error);
        continue; // Try next proxy
      }
    }

    // If we get here, all attempts failed
    reject(new Error(`Failed to load image after trying all proxy services. Last error: ${lastError?.message || 'Unknown error'}`));
  });

// Function to scale canvas dimensions to minimum 1080px width while preserving aspect ratio
const scaleCanvasToMinimumDimensions = (width, height) => {
  const MIN_WIDTH = 1080;
  const MIN_HEIGHT = 1080;
  
  if (width >= MIN_WIDTH && height >= MIN_HEIGHT) {
    return { width, height };
  }
  
  let newWidth = width;
  let newHeight = height;
  
  if (width < MIN_WIDTH) {
    const scale = MIN_WIDTH / width;
    newWidth = MIN_WIDTH;
    newHeight = Math.round(height * scale);
  }
  
  if (newHeight < MIN_HEIGHT) {
    const scale = MIN_HEIGHT / newHeight;
    newHeight = MIN_HEIGHT;
    newWidth = Math.round(newWidth * scale);
  }
  
  console.log('Scaled dimensions:', {
    original: `${width}x${height}`,
    scaled: `${newWidth}x${newHeight}`,
    scale: `${(newWidth/width).toFixed(2)}x`
  });
  
  return { width: newWidth, height: newHeight };
};

// Function to create a canvas with the cropped image
const createCroppedImage = async (imageSrc, pixelCrop, targetAspectRatio) => {
  try {
    console.log('Starting high-quality image crop process:', {
      crop: pixelCrop,
      targetAspectRatio,
      source: imageSrc
    });
    
    const image = await createImage(imageSrc);
    
    // Log detailed image information
    console.log('Source image loaded:', {
      naturalSize: `${image.naturalWidth}x${image.naturalHeight}`,
      displaySize: `${image.width}x${image.height}`,
      aspectRatio: (image.naturalWidth / image.naturalHeight).toFixed(3)
    });

    // Calculate scale factors to maintain original resolution
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate cropped dimensions at full resolution
    const croppedWidth = Math.round(pixelCrop.width * scaleX);
    const croppedHeight = Math.round(pixelCrop.height * scaleY);
    
    // Scale dimensions if needed to meet Instagram's minimum requirements
    const { width: finalWidth, height: finalHeight } = scaleCanvasToMinimumDimensions(
      croppedWidth,
      croppedHeight
    );

    // Create a high-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Configure canvas for highest quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    console.log('Canvas configured for maximum quality:', {
      dimensions: `${canvas.width}x${canvas.height}`,
      aspectRatio: (canvas.width / canvas.height).toFixed(3),
      quality: 'Maximum',
      smoothing: 'High'
    });

    try {
      // Draw the cropped image onto the canvas at native resolution
      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        croppedWidth,
        croppedHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );

      // Convert canvas to blob with maximum quality JPEG
      return new Promise((resolve, reject) => {
        try {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed - null blob returned'));
                return;
              }

              // Verify the blob meets quality standards
              const minSize = 500 * 1024; // 500KB minimum for good quality
              if (blob.size < minSize) {
                console.warn('Warning: Output image may be too small for optimal quality:', {
                  size: `${(blob.size / 1024).toFixed(2)}KB`,
                  recommended: '500KB minimum'
                });
              }

              console.log('High-quality crop completed:', {
                dimensions: `${finalWidth}x${finalHeight}`,
                aspectRatio: (finalWidth / finalHeight).toFixed(3),
                size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
                type: blob.type
              });

              resolve(blob);
            },
            'image/jpeg',
            1.0 // Maximum JPEG quality
          );
        } catch (error) {
          console.error('Canvas to Blob conversion error:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error drawing image to canvas:', error);
      throw error;
    }
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

const ASPECT_RATIOS = {
  PORTRAIT: 4 / 5,
  SQUARE: 1,
};

const CropAndOrderPage = () => {
  const navigate = useNavigate();
  const { selectedImages, setSelectedImages, setOrderedImages: setContextOrderedImages } = useUploadContext();
  
  // State for crop settings and ordered images
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS.PORTRAIT);
  const [crops, setCrops] = useState({});
  const [orderedImages, setOrderedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [carouselError, setCarouselError] = useState(null);
  
  // Validate images helper
  const validateImages = (images) => {
    if (!Array.isArray(images)) {
      console.error('Images is not an array:', images);
      return false;
    }

    const invalidImages = images.filter(img => !img?.id || !img?.url);
    if (invalidImages.length > 0) {
      console.error('Invalid images found:', invalidImages);
      return false;
    }

    return true;
  };
  
  // Initialize crops and ordered images on component mount
  useEffect(() => {
    try {
      console.log('Initializing CropAndOrderPage with images:', selectedImages);
      
      if (!selectedImages?.length) {
        console.log('No selected images found, redirecting to image selection');
        navigate('/image-selection');
        return;
      }

      // Validate selected images
      if (!validateImages(selectedImages)) {
        throw new Error('Invalid image data received. Please select your images again.');
      }

      // Initialize crop data for each image
      const initialCrops = {};
      selectedImages.forEach(img => {
        // Set initial crop area based on current aspect ratio
        const cropWidth = aspectRatio === ASPECT_RATIOS.SQUARE ? 100 : 80;  // 80% for 4:5, 100% for 1:1
        const cropHeight = aspectRatio === ASPECT_RATIOS.SQUARE ? 100 : 100; // Always 100% height

        initialCrops[img.id] = {
          crop: { x: 0, y: 0 },
          zoom: 1,
          croppedAreaPixels: {
            x: 0,
            y: 0,
            width: cropWidth,
            height: cropHeight
          },
          aspectRatio: aspectRatio,
        };
      });

      console.log('Setting initial crops:', initialCrops);
      setCrops(initialCrops);
      
      console.log('Setting initial ordered images:', selectedImages);
      setOrderedImages(selectedImages);
      setCarouselError(null);
    } catch (error) {
      console.error('Error initializing carousel containers:', error);
      setCarouselError(`Failed to create carousel containers: ${error.message}`);
      // Redirect back to image selection if there's an error
      setTimeout(() => navigate('/image-selection'), 2000);
    }
  }, [selectedImages, navigate, aspectRatio]);

  // Crop handlers with improved error handling
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels, imageId) => {
    try {
      if (!imageId || !croppedAreaPixels) {
        throw new Error('Invalid crop data received');
      }

      // Validate that the image exists
      const imageExists = orderedImages.some(img => img.id === imageId);
      if (!imageExists) {
        throw new Error(`No image found with ID: ${imageId}`);
      }

      console.log('Crop complete for image:', imageId, {
        croppedArea,
        croppedAreaPixels,
        aspectRatio: crops[imageId]?.aspectRatio
      });
      
      setCrops(prev => ({
        ...prev,
        [imageId]: {
          ...prev[imageId],
          croppedAreaPixels,
          crop: prev[imageId]?.crop || { x: 0, y: 0 },
          zoom: prev[imageId]?.zoom || 1,
          aspectRatio: prev[imageId]?.aspectRatio || aspectRatio
        },
      }));
    } catch (error) {
      console.error('Error in onCropComplete:', error);
      setCarouselError(`Failed to update crop: ${error.message}`);
    }
  }, [crops, aspectRatio, orderedImages]);

  const onCropChange = useCallback((crop, imageId) => {
    console.log('Crop changed for image:', imageId, crop);
    setCrops(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        crop,
      },
    }));
  }, []);

  const onZoomChange = useCallback((zoom, imageId) => {
    console.log('Zoom changed for image:', imageId, zoom);
    setCrops(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        zoom,
      },
    }));
  }, []);

  // Drag and drop handler
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const updated = Array.from(orderedImages);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setOrderedImages(updated);
  };

  // Upload cropped images to Dropbox
  const uploadCroppedImages = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    // Verify that we have crop data for all images
    const missingCropData = orderedImages.find(image => {
      const cropData = crops[image.id];
      return !cropData?.croppedAreaPixels || !cropData?.aspectRatio;
    });

    if (missingCropData) {
      setUploadError('Please ensure all images are properly cropped before proceeding');
      setIsUploading(false);
      return;
    }

    try {
      const timestamp = Date.now();
      const uploadPromises = orderedImages.map(async (image, index) => {
        const cropData = crops[image.id];
        console.log('Processing image:', image.id, 'with crop data:', cropData);

        if (!cropData?.croppedAreaPixels) {
          throw new Error(`Missing crop data for image: ${image.id}`);
        }

        try {
          // Pass the aspect ratio to createCroppedImage
          let croppedBlob = await createCroppedImage(
            image.url, 
            cropData.croppedAreaPixels,
            cropData.aspectRatio // Pass the stored aspect ratio
          );
          
          if (!croppedBlob) {
            throw new Error('Failed to create cropped image');
          }

          // Verify the blob meets minimum quality requirements
          if (croppedBlob.size < 500 * 1024) { // 500KB minimum
            console.warn(`Warning: Image ${image.id} may be too small for optimal quality:`, {
              size: `${(croppedBlob.size / 1024 / 1024).toFixed(2)}MB`,
              recommended: '500KB minimum'
            });
          }

          // Create a File object from the blob with quality indicators in name
          const aspectRatioStr = cropData.aspectRatio === ASPECT_RATIOS.PORTRAIT ? '4-5' : '1-1';
          const qualityInfo = `${Math.round(croppedBlob.size / 1024)}KB`;
          const fileName = `cropped-${aspectRatioStr}-${qualityInfo}-${image.name || 'image.jpg'}`;
          
          const croppedFile = new File([croppedBlob], fileName, {
            type: 'image/jpeg'
          });

          // Get Dropbox token
          const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
          if (!DROPBOX_ACCESS_TOKEN) {
            throw new Error('Dropbox access token is missing');
          }

          console.log('Starting upload for image:', {
            id: image.id,
            fileName,
            size: `${(croppedFile.size / 1024 / 1024).toFixed(2)}MB`,
            aspectRatio: aspectRatioStr
          });

          // Upload to Dropbox with content type header to preserve quality
          const uploadUrl = 'https://content.dropboxapi.com/2/files/upload';
          const path = `/socialsync-cropped/${timestamp}-${index}-${fileName}`;
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
              'Dropbox-API-Arg': JSON.stringify({
                path: path,
                mode: 'add',
                autorename: true,
                mute: false,
                strict_conflict: false
              }),
              'Content-Type': 'application/octet-stream'
            },
            body: croppedFile
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload response error:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              errorText
            });
            throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
          }

          const uploadData = await uploadResponse.json();
          console.log('Upload successful:', uploadData);

          // Get temporary link
          const tempLinkUrl = 'https://api.dropboxapi.com/2/files/get_temporary_link';
          const tempLinkResponse = await fetch(tempLinkUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              path: uploadData.path_display
            })
          });

          if (!tempLinkResponse.ok) {
            const errorText = await tempLinkResponse.text();
            console.error('Temporary link error:', {
              status: tempLinkResponse.status,
              statusText: tempLinkResponse.statusText,
              errorText
            });
            throw new Error(`Failed to get temporary link: ${tempLinkResponse.status} - ${errorText}`);
          }

          const tempLinkData = await tempLinkResponse.json();
          console.log('Temporary link created:', {
            ...tempLinkData,
            fileSize: `${(croppedFile.size / 1024 / 1024).toFixed(2)}MB`,
            aspectRatio: aspectRatioStr
          });

          // Update progress
          setUploadProgress(prev => Math.min(95, prev + (95 / orderedImages.length)));

          return {
            id: `${image.id}-cropped`,
            url: tempLinkData.link,
            path: uploadData.path_display,
            order: index,
            aspectRatio: cropData.aspectRatio === ASPECT_RATIOS.PORTRAIT ? '4:5' : '1:1',
            cropData: cropData,
            size: croppedFile.size,
            dimensions: cropData.aspectRatio === ASPECT_RATIOS.PORTRAIT ? '1080x1350' : '1080x1080'
          };
        } catch (error) {
          console.error(`Error processing image ${image.id}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Verify all uploads meet quality standards
      const lowQualityUploads = results.filter(result => result.size < 500 * 1024);
      if (lowQualityUploads.length > 0) {
        console.warn('Some images may be too low quality for Instagram:', 
          lowQualityUploads.map(img => ({
            id: img.id,
            size: `${(img.size / 1024 / 1024).toFixed(2)}MB`,
            dimensions: img.dimensions
          }))
        );
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Save cropped images to context
      console.log('Saving cropped images to context:', results);
      setContextOrderedImages(results);
      
      navigate('/caption-selection');
    } catch (error) {
      console.error('Error uploading cropped images:', error);
      setUploadError(error.message || 'Failed to upload images');
      setIsUploading(false);
    }
  };

  // Update aspect ratio and reset crops when changed
  const updateAspectRatio = (newRatio) => {
    setAspectRatio(newRatio);
    // Reset crops when aspect ratio changes
    const resetCrops = {};
    orderedImages.forEach(img => {
      resetCrops[img.id] = {
        ...crops[img.id],
        aspectRatio: newRatio,
        crop: { x: 0, y: 0 },
        zoom: 1
      };
    });
    setCrops(resetCrops);
  };

  if (!selectedImages?.length) {
    return null; // Early return while redirecting
  }

  return (
    <StepNavigator
      onPrevious={() => navigate('/image-selection')}
      onNext={uploadCroppedImages}
      isNextDisabled={isUploading || !Object.keys(crops).length || carouselError}
    >
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Crop & Order Images</h1>
          
          {/* Show carousel error if any */}
          {carouselError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{carouselError}</p>
              <p className="text-sm mt-2">You will be redirected to the image selection page...</p>
            </div>
          )}
          
          {/* Show upload error if any */}
          {uploadError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {uploadError}
            </div>
          )}
          
          {/* Show upload progress if uploading */}
          {isUploading && (
            <div className="mb-4">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gradient-start to-gradient-end transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
          
          {/* Aspect ratio controls */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => updateAspectRatio(ASPECT_RATIOS.SQUARE)}
              className={`px-4 py-2 rounded-lg transition-all ${
                aspectRatio === ASPECT_RATIOS.SQUARE
                  ? 'bg-gradient-to-r from-gradient-start to-gradient-end text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Square (1:1)
            </button>
            <button
              onClick={() => updateAspectRatio(ASPECT_RATIOS.PORTRAIT)}
              className={`px-4 py-2 rounded-lg transition-all ${
                aspectRatio === ASPECT_RATIOS.PORTRAIT
                  ? 'bg-gradient-to-r from-gradient-start to-gradient-end text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Portrait (4:5)
            </button>
          </div>
        </div>

        {/* Crop preview grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {orderedImages.map((image) => (
            <div key={image.id} className="relative bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative aspect-[4/5] w-full">
                <Cropper
                  image={image.url}
                  crop={crops[image.id]?.crop}
                  zoom={crops[image.id]?.zoom}
                  aspect={aspectRatio}
                  onCropChange={(crop) => onCropChange(crop, image.id)}
                  onZoomChange={(zoom) => onZoomChange(zoom, image.id)}
                  onCropComplete={(croppedArea, croppedAreaPixels) =>
                    onCropComplete(croppedArea, croppedAreaPixels, image.id)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Reordering section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Arrange Post Order</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="image-reorder" direction="horizontal">
              {(provided) => (
                <div
                  className="flex gap-4 overflow-x-auto pb-4"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ zIndex: 10 }}
                >
                  {orderedImages.map((image, index) => (
                    <Draggable 
                      draggableId={image.id} 
                      index={index} 
                      key={image.id}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative flex-shrink-0 ${
                            snapshot.isDragging ? 'z-50' : ''
                          }`}
                        >
                          <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10">
                            {index + 1}
                          </div>
                          <img
                            src={image.url}
                            className="w-28 h-28 object-cover rounded-xl"
                            alt={`Post ${index}`}
                            loading="lazy"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </StepNavigator>
  );
};

export default CropAndOrderPage; 