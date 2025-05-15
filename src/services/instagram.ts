import { supabase } from '../lib/supabase';
import axios from 'axios';
import { addBreadcrumb } from '@sentry/browser';
import {
  handleError,
  ErrorMessages,
  MediaError,
  AuthenticationError,
  ValidationError,
  withRetry,
  checkRateLimit
} from '../lib/errors';

interface MediaUploadResponse {
  id: string;
  status_code: number;
}

interface PostCreationResponse {
  id: string;
  status_code: number;
  status_url?: string;
}

interface PostScheduleOptions {
  scheduledTime?: Date;
  caption: string;
  mediaUrls: string[];
}

interface MediaValidationResult {
  isValid: boolean;
  error?: string;
}

class InstagramService {
  private readonly GRAPH_API_VERSION = 'v19.0';
  private readonly BASE_URL = `https://graph.facebook.com/${this.GRAPH_API_VERSION}`;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png'];
  private readonly MIN_IMAGE_WIDTH = 320;
  private readonly MAX_IMAGE_WIDTH = 1440;
  private readonly MIN_IMAGE_HEIGHT = 320;
  private readonly MAX_IMAGE_HEIGHT = 1440;
  private readonly MAX_CAPTION_LENGTH = 2200;
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms
  private readonly MAX_REQUESTS_PER_HOUR = 200;

  /**
   * Get Instagram credentials for the current user
   */
  private async getInstagramCredentials(userId: string) {
    try {
      const { data: account, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!account) throw new AuthenticationError('No Instagram account connected');

      return {
        accessToken: account.access_token,
        businessAccountId: account.instagram_business_account_id,
      };
    } catch (error) {
      throw handleError(error, { userId });
    }
  }

  /**
   * Upload media to Instagram
   */
  private async uploadMedia(
    businessAccountId: string,
    accessToken: string,
    mediaUrl: string,
    retryCount = 0
  ): Promise<string> {
    try {
      // Check rate limit
      if (!checkRateLimit('upload', this.MAX_REQUESTS_PER_HOUR, this.RATE_LIMIT_WINDOW)) {
        throw new Error(ErrorMessages.RATE_LIMIT_EXCEEDED);
      }

      addBreadcrumb({
        category: 'instagram',
        message: `Uploading media to Instagram: ${mediaUrl}`,
        level: 'info',
      });

      const response = await withRetry(() => 
        axios.post(
          `${this.BASE_URL}/${businessAccountId}/media`,
          {
            image_url: mediaUrl,
            is_carousel_item: true,
          },
          {
            params: { access_token: accessToken },
          }
        )
      );

      const { id }: MediaUploadResponse = response.data;

      // Check media upload status
      const statusResponse = await this.checkMediaStatus(id, accessToken);
      if (statusResponse.status_code !== 200) {
        throw new MediaError(`Media upload failed: ${statusResponse.status_code}`, {
          mediaId: id,
          statusCode: statusResponse.status_code,
        });
      }

      return id;
    } catch (error) {
      throw handleError(error, {
        businessAccountId,
        mediaUrl,
        retryCount,
      });
    }
  }

  /**
   * Check media upload status
   */
  private async checkMediaStatus(
    mediaId: string,
    accessToken: string,
    retryCount = 0
  ): Promise<MediaUploadResponse> {
    try {
      if (!checkRateLimit('status', this.MAX_REQUESTS_PER_HOUR, this.RATE_LIMIT_WINDOW)) {
        throw new Error(ErrorMessages.RATE_LIMIT_EXCEEDED);
      }

      const response = await withRetry(() =>
        axios.get(`${this.BASE_URL}/${mediaId}`, {
          params: { access_token: accessToken },
        })
      );

      return response.data;
    } catch (error) {
      throw handleError(error, {
        mediaId,
        retryCount,
      });
    }
  }

  /**
   * Create a carousel post
   */
  private async createCarouselPost(
    businessAccountId: string,
    accessToken: string,
    mediaIds: string[],
    caption: string,
    scheduledTime?: Date
  ): Promise<PostCreationResponse> {
    try {
      if (!checkRateLimit('create', this.MAX_REQUESTS_PER_HOUR, this.RATE_LIMIT_WINDOW)) {
        throw new Error(ErrorMessages.RATE_LIMIT_EXCEEDED);
      }

      addBreadcrumb({
        category: 'instagram',
        message: `Creating carousel post with ${mediaIds.length} items`,
        level: 'info',
      });

      const params: any = {
        media_type: 'CAROUSEL',
        children: mediaIds,
        caption,
      };

      if (scheduledTime) {
        params.published = false;
        params.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
      }

      const response = await withRetry(() =>
        axios.post(
          `${this.BASE_URL}/${businessAccountId}/media`,
          params,
          {
            params: { access_token: accessToken },
          }
        )
      );

      return response.data;
    } catch (error) {
      throw handleError(error, {
        businessAccountId,
        mediaCount: mediaIds.length,
        isScheduled: !!scheduledTime,
      });
    }
  }

  /**
   * Publish a post
   */
  private async publishPost(
    businessAccountId: string,
    accessToken: string,
    mediaId: string,
    retryCount = 0
  ): Promise<string> {
    try {
      addBreadcrumb({
        category: 'instagram',
        message: `Publishing post: ${mediaId}`,
        level: 'info',
      });

      const response = await axios.post(
        `${this.BASE_URL}/${businessAccountId}/media_publish`,
        {
          creation_id: mediaId,
        },
        {
          params: { access_token: accessToken },
        }
      );

      return response.data.id;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.publishPost(businessAccountId, accessToken, mediaId, retryCount + 1);
      }
      throw handleError(error, {
        businessAccountId,
        mediaId,
      });
    }
  }

  /**
   * Validate media before upload
   */
  private async validateMedia(mediaUrl: string): Promise<MediaValidationResult> {
    try {
      // Fetch image metadata
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      
      // Check file size
      if (blob.size > this.MAX_IMAGE_SIZE) {
        return {
          isValid: false,
          error: `Image size exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
        };
      }

      // Check file type
      if (!this.SUPPORTED_FORMATS.includes(blob.type)) {
        return {
          isValid: false,
          error: `Unsupported image format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`
        };
      }

      // Check image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = mediaUrl;
      });

      if (img.width < this.MIN_IMAGE_WIDTH || img.width > this.MAX_IMAGE_WIDTH ||
          img.height < this.MIN_IMAGE_HEIGHT || img.height > this.MAX_IMAGE_HEIGHT) {
        return {
          isValid: false,
          error: `Image dimensions must be between ${this.MIN_IMAGE_WIDTH}x${this.MIN_IMAGE_HEIGHT} and ${this.MAX_IMAGE_WIDTH}x${this.MAX_IMAGE_HEIGHT}`
        };
      }

      return { isValid: true };
    } catch (error) {
      throw handleError(error, {
        mediaUrl,
      });
    }
  }

  /**
   * Create a single image post
   */
  private async createSinglePost(
    businessAccountId: string,
    accessToken: string,
    mediaUrl: string,
    caption: string,
    scheduledTime?: Date
  ): Promise<PostCreationResponse> {
    try {
      addBreadcrumb({
        category: 'instagram',
        message: `Creating single image post`,
        level: 'info',
      });

      const params: any = {
        media_type: 'IMAGE',
        image_url: mediaUrl,
        caption,
      };

      if (scheduledTime) {
        params.published = false;
        params.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
      }

      const response = await axios.post(
        `${this.BASE_URL}/${businessAccountId}/media`,
        params,
        {
          params: { access_token: accessToken },
        }
      );

      return response.data;
    } catch (error) {
      throw handleError(error, {
        businessAccountId,
        mediaUrl,
      });
    }
  }

  /**
   * Create a post (single image or carousel)
   */
  async createPost(userId: string, options: PostScheduleOptions): Promise<string> {
    try {
      addBreadcrumb({
        category: 'instagram',
        message: 'Starting post creation process',
        level: 'info',
      });

      // Validate caption length
      if (options.caption.length > this.MAX_CAPTION_LENGTH) {
        throw new Error(`Caption exceeds maximum length of ${this.MAX_CAPTION_LENGTH} characters`);
      }

      // Get Instagram credentials
      const { accessToken, businessAccountId } = await this.getInstagramCredentials(userId);

      // Validate all media files
      for (const mediaUrl of options.mediaUrls) {
        const validationResult = await this.validateMedia(mediaUrl);
        if (!validationResult.isValid) {
          throw new ValidationError(validationResult.error || ErrorMessages.INVALID_MEDIA);
        }
      }

      let post;
      if (options.mediaUrls.length === 1) {
        // Single image post
        post = await this.createSinglePost(
          businessAccountId,
          accessToken,
          options.mediaUrls[0],
          options.caption,
          options.scheduledTime
        );
      } else {
        // Upload all media files for carousel
        const mediaIds = await Promise.all(
          options.mediaUrls.map(url => this.uploadMedia(businessAccountId, accessToken, url))
        );

        // Create carousel post
        post = await this.createCarouselPost(
          businessAccountId,
          accessToken,
          mediaIds,
          options.caption,
          options.scheduledTime
        );
      }

      // If not scheduled, publish immediately
      if (!options.scheduledTime) {
        return this.publishPost(businessAccountId, accessToken, post.id);
      }

      // Store scheduled post in database
      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: userId,
        instagram_media_id: post.id,
        scheduled_time: options.scheduledTime.toISOString(),
        status: 'scheduled',
        caption: options.caption,
        media_urls: options.mediaUrls,
      });

      if (error) throw error;

      return post.id;
    } catch (error) {
      throw handleError(error, {
        userId,
        options,
      });
    }
  }

  /**
   * Delete a scheduled post
   */
  async deleteScheduledPost(userId: string, postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .match({ user_id: userId, instagram_media_id: postId });

      if (error) throw error;
    } catch (error) {
      throw handleError(error, {
        userId,
        postId,
      });
    }
  }

  /**
   * Get all scheduled posts for a user
   */
  async getScheduledPosts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, {
        userId,
      });
    }
  }
}

export const instagramService = new InstagramService(); 