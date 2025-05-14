import axios from 'axios';

// Constants for Instagram API
const INSTAGRAM_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${INSTAGRAM_API_VERSION}`;

const REQUIRED_PERMISSIONS = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_show_list'
];

/**
 * Handles publishing content to Instagram
 * Required permissions:
 * - instagram_basic: Access basic Instagram account information
 * - instagram_content_publish: Permission to publish content to Instagram
 * - pages_read_engagement: Read access to Page's content
 * - pages_show_list: Read access to Pages the user manages
 */
class InstagramPublisher {
  constructor() {
    this.businessAccountId = import.meta.env.VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.accessToken = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
    this.igUsername = import.meta.env.VITE_INSTAGRAM_USERNAME;
    
    if (!this.businessAccountId || !this.accessToken) {
      throw new Error('Instagram API configuration is missing. Please check environment variables.');
    }
  }

  /**
   * Validates the access token and permissions
   * @returns {Promise<void>}
   * @throws {Error} If permissions are missing
   */
  async validatePermissions() {
    try {
      console.log('Validating access token and permissions...');
      
      // ✅ 1. Verify token via debug_token
      const tokenCheck = await axios.get(`${BASE_URL}/debug_token`, {
        params: {
          input_token: this.accessToken,
          access_token: this.accessToken,
        },
      });

      const tokenData = tokenCheck.data.data;
      console.log('Token debug data:', {
        ...tokenData,
        access_token: '***' // Hide the token in logs
      });

      if (!tokenData.is_valid) throw new Error('Access token is invalid');

      const missingPermissions = REQUIRED_PERMISSIONS.filter(p => !tokenData.scopes.includes(p));
      if (missingPermissions.length > 0) {
        throw new Error(`Missing required permissions: ${missingPermissions.join(', ')}`);
      }

      console.log('Permissions verified:', tokenData.scopes);

      // ✅ 2. Get user ID from the token data
      const userId = tokenData.user_id;
      console.log('User ID from token:', userId);
      
      if (!userId) {
        console.error('Token data structure:', tokenData);
        throw new Error('Could not determine user ID from access token');
      }

      // ✅ 3. Fetch list of Pages the user manages using the user ID
      console.log(`Fetching pages for user ID: ${userId}`);
      const pagesRes = await axios.get(`${BASE_URL}/${userId}/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'name,access_token,instagram_business_account{id,username}'
        },
      });

      const pages = pagesRes.data.data;
      console.log('Pages response:', {
        count: pages?.length,
        pages: pages?.map(p => ({
          name: p.name,
          hasIG: !!p.instagram_business_account,
          igUsername: p.instagram_business_account?.username
        }))
      });

      if (!pages || pages.length === 0) {
        throw new Error('No managed Facebook Pages found.');
      }

      // ✅ 4. Find the page with the correct Instagram username
      const matchedPage = pages.find(
        p => p.instagram_business_account?.username === this.igUsername
      );

      if (!matchedPage) {
        console.error('No page found with Instagram username match. Available:',
          pages.map(p => ({
            name: p.name,
            hasIG: !!p.instagram_business_account,
            igUsername: p.instagram_business_account?.username
          })));
        throw new Error(`No page found linked to IG account @${this.igUsername}`);
      }

      console.log('Found matching page:', {
        name: matchedPage.name,
        igUsername: matchedPage.instagram_business_account.username,
        igId: matchedPage.instagram_business_account.id
      });

      // ✅ 5. Warn if configured ID differs from IG ID discovered
      if (matchedPage.instagram_business_account.id !== this.businessAccountId) {
        console.warn('Mismatch in IG business account ID:', {
          configured: this.businessAccountId,
          found: matchedPage.instagram_business_account.id
        });
      }

      this.pageAccessToken = matchedPage.access_token;
      return matchedPage.instagram_business_account.id;
    } catch (error) {
      console.error('Permission validation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(
        `Failed to validate permissions: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Creates a media container for a single image
   * @param {string} imageUrl - Public URL of the image
   * @param {string} caption - Caption for the post
   * @param {Date} [scheduledTime] - Optional scheduled publish time
   * @returns {Promise<string>} Creation ID for the container
   */
  async createMediaContainer(imageUrl, caption, scheduledTime = null) {
    try {
      console.log('Creating media container for URL:', imageUrl);
      
      const params = {
        image_url: imageUrl,
        media_type: 'IMAGE',
        caption,
        access_token: this.accessToken
      };

      // Add scheduled publish time if provided
      if (scheduledTime) {
        params.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
      }

      console.log('Sending container creation request with params:', {
        ...params,
        access_token: '***' // Hide token in logs
      });

      const response = await axios.post(`${BASE_URL}/${this.businessAccountId}/media`, params);
      console.log('Container creation response:', response.data);
      
      return response.data.id;
    } catch (error) {
      console.error('Error creating media container:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to create media container: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Creates a carousel container for multiple images
   * @param {string[]} imageUrls - Array of public image URLs
   * @returns {Promise<string[]>} Array of child media IDs
   */
  async createCarouselContainers(imageUrls) {
    try {
      // Validate input
      if (!imageUrls || imageUrls.length < 2) {
        throw new Error("Carousel needs at least 2 images");
      }

      console.log('Creating carousel containers with URLs:', imageUrls);

      // Create containers sequentially to avoid rate limits
      const containerIds = [];
      for (const url of imageUrls) {
        const params = {
          image_url: url,
          media_type: 'IMAGE',
          is_carousel_item: true,
          access_token: this.accessToken
        };

        console.log('Creating container with params:', {
          ...params,
          access_token: '***' // Hide token in logs
        });

        try {
          const response = await axios.post(
            `${BASE_URL}/${this.businessAccountId}/media`,
            params
          );
          
          console.log('Container creation response:', response.data);
          
          const containerId = response.data.id;
          
          // Wait for container to be ready
          let status;
          for (let attempt = 0; attempt < 5; attempt++) {
            status = await this.checkContainerStatus(containerId);
            if (status === 'FINISHED') break;
            if (status === 'ERROR') {
              throw new Error(`Container ${containerId} failed to process`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          if (status !== 'FINISHED') {
            throw new Error(`Container ${containerId} did not finish processing in time`);
          }
          
          containerIds.push(containerId);
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Full error response:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: url,
            trace: error.response?.data?.error?.fbtrace_id
          });
          throw error;
        }
      }

      console.log('All carousel containers created successfully:', containerIds);
      return containerIds;
    } catch (error) {
      console.error('Error creating carousel containers:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        trace: error.response?.data?.error?.fbtrace_id
      });
      throw new Error(`Failed to create carousel containers: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Checks the status of a media container
   * @param {string} containerId - The container ID to check
   * @returns {Promise<string>} The status of the container
   */
  async checkContainerStatus(containerId) {
    try {
      console.log('Checking container status for ID:', containerId);
      
      const response = await axios.get(`${BASE_URL}/${containerId}`, {
        params: {
          fields: 'status_code,status',
          access_token: this.accessToken
        }
      });

      console.log('Container status response:', response.data);
      return response.data.status_code;
    } catch (error) {
      console.error('Error checking container status:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to check container status: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Waits for a container to be ready for publishing
   * @param {string} containerId - The container ID to check
   * @returns {Promise<void>}
   */
  async waitForContainerReady(containerId) {
    const maxAttempts = 5; // Maximum 5 minutes as per API recommendation
    const delayMs = 60000; // Check once per minute

    console.log(`Waiting for container ${containerId} to be ready...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkContainerStatus(containerId);
      console.log(`Container ${containerId} status (attempt ${attempt + 1}/${maxAttempts}):`, status);
      
      switch (status) {
        case 'FINISHED':
          console.log(`Container ${containerId} is ready for publishing`);
          return;
        case 'PUBLISHED':
          console.log(`Container ${containerId} is already published`);
          return;
        case 'ERROR':
          throw new Error(`Container ${containerId} failed to process`);
        case 'EXPIRED':
          throw new Error(`Container ${containerId} has expired`);
        default:
          if (attempt === maxAttempts - 1) {
            throw new Error(`Timeout waiting for container ${containerId} to be ready`);
          }
          console.log(`Waiting ${delayMs/1000} seconds before next status check...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Creates a carousel post with multiple images
   * @param {string[]} childMediaIds - Array of child media IDs
   * @param {string} caption - Caption for the post
   * @param {Date} [scheduledTime] - Optional scheduled publish time
   * @returns {Promise<string>} Creation ID for the carousel
   */
  async createCarousel(childMediaIds, caption, scheduledTime = null) {
    try {
      // Check #3: Validate minimum number of images
      if (!childMediaIds || childMediaIds.length < 2) {
        throw new Error("Carousel needs at least 2 images");
      }

      // Check #2: Verify all child IDs are valid and FINISHED
      console.log('Verifying child media IDs:', childMediaIds);
      for (const id of childMediaIds) {
        try {
          const status = await this.checkContainerStatus(id);
          console.log(`Status for media ${id}:`, status);
          
          if (status !== 'FINISHED') {
            console.error(`Child media ${id} not ready. Status: ${status}`);
            throw new Error(`Media container ${id} is not ready (status: ${status})`);
          }
        } catch (error) {
          console.error('Error checking media status:', {
            mediaId: id,
            error: error.response?.data || error.message
          });
          throw new Error(`Failed to verify media ${id}: ${error.response?.data?.error?.message || error.message}`);
        }
      }

      // Additional safety delay after all containers are verified
      console.log('All containers verified, waiting additional 3 seconds for stability...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check #1: Ensure children is a comma-separated string
      const childrenString = childMediaIds.join(',');
      
      // Prepare carousel payload
      const params = {
        media_type: 'CAROUSEL',
        children: childrenString,
        caption,
        access_token: this.accessToken
      };

      if (scheduledTime) {
        params.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
      }

      // Check #4: Log payload before posting
      console.log('Creating carousel with payload:', {
        ...params,
        access_token: '***' // Hide token in logs
      });

      // Make the API call
      const response = await axios.post(`${BASE_URL}/${this.businessAccountId}/media`, params);
      console.log('Carousel creation response:', response.data);

      // Wait for carousel container to be ready
      const carouselId = response.data.id;
      await this.waitForContainerReady(carouselId);

      return carouselId;
    } catch (error) {
      // Check #5: Detailed error logging
      console.error('Full error response:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `${BASE_URL}/${this.businessAccountId}/media`,
        trace: error.response?.data?.error?.fbtrace_id
      });
      
      throw new Error(`Failed to create carousel: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publishes a container to Instagram
   * @param {string} creationId - The creation ID from createMediaContainer or createCarousel
   * @returns {Promise<string>} The ID of the published media
   */
  async publishMedia(creationId) {
    try {
      console.log('Publishing media with creation ID:', creationId);
      
      const response = await axios.post(`${BASE_URL}/${this.businessAccountId}/media_publish`, {
        creation_id: creationId,
        access_token: this.accessToken
      });

      console.log('Publish response:', response.data);
      return response.data.id;
    } catch (error) {
      console.error('Error publishing media:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to publish media: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publishes content to Instagram
   * @param {Object[]} images - Array of image objects with URLs
   * @param {string} caption - Caption for the post
   * @param {Date} [scheduledTime] - Optional scheduled publish time
   * @returns {Promise<string>} ID of the published post
   */
  async publish(images, caption, scheduledTime = null) {
    try {
      // Validate permissions before publishing
      await this.validatePermissions();

      let creationId;

      if (images.length === 1) {
        // Single image post
        creationId = await this.createMediaContainer(images[0].url, caption, scheduledTime);
      } else {
        // Carousel post
        console.log('Creating carousel containers for images:', images.map(img => img.url));
        const childMediaIds = await this.createCarouselContainers(images.map(img => img.url));
        
        // Wait for all containers to be ready
        console.log('Waiting for all containers to be ready:', childMediaIds);
        await Promise.all(childMediaIds.map(id => this.waitForContainerReady(id)));
        
        creationId = await this.createCarousel(childMediaIds, caption, scheduledTime);
      }

      // Wait for the final container to be ready
      console.log('Waiting for final container to be ready:', creationId);
      await this.waitForContainerReady(creationId);

      // For scheduled posts, we don't need to publish immediately
      if (!scheduledTime) {
        console.log('Publishing media immediately:', creationId);
        const mediaId = await this.publishMedia(creationId);
        return mediaId;
      }

      console.log('Post scheduled successfully:', creationId);
      return creationId; // Return the creation ID for scheduled posts
    } catch (error) {
      console.error('Error publishing to Instagram:', error);
      throw error;
    }
  }
}

export default new InstagramPublisher(); 