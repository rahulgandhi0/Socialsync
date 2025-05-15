import { supabase } from '../lib/supabase';
import { addBreadcrumb } from '@sentry/browser';
import { handleError, ErrorMessages } from '../lib/errors';
import { instagramService } from './instagram';

export interface ScheduledPost {
  id: string;
  user_id: string;
  instagram_media_id: string;
  scheduled_time: string;
  status: 'scheduled' | 'processing' | 'published' | 'failed';
  caption: string;
  media_urls: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

class SchedulerService {
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring scheduled posts
   */
  startMonitoring() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.processScheduledPosts().catch(error => {
        handleError(error, { context: 'scheduler_monitoring' });
      });
    }, this.CHECK_INTERVAL);

    addBreadcrumb({
      category: 'scheduler',
      message: 'Started monitoring scheduled posts',
      level: 'info',
    });
  }

  /**
   * Stop monitoring scheduled posts
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;

      addBreadcrumb({
        category: 'scheduler',
        message: 'Stopped monitoring scheduled posts',
        level: 'info',
      });
    }
  }

  /**
   * Process scheduled posts that are due
   */
  private async processScheduledPosts() {
    try {
      const now = new Date();
      
      // Get posts that are due
      const { data: posts, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_time', now.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      if (!posts?.length) return;

      addBreadcrumb({
        category: 'scheduler',
        message: `Processing ${posts.length} scheduled posts`,
        level: 'info',
        data: { postIds: posts.map(p => p.id) },
      });

      // Process each post
      await Promise.all(posts.map(post => this.processPost(post)));
    } catch (error) {
      handleError(error, { context: 'process_scheduled_posts' });
    }
  }

  /**
   * Process a single scheduled post
   */
  private async processPost(post: ScheduledPost) {
    try {
      // Update status to processing
      await this.updatePostStatus(post.id, 'processing');

      // Publish the post
      await instagramService.createPost(post.user_id, {
        caption: post.caption,
        mediaUrls: post.media_urls,
      });

      // Update status to published
      await this.updatePostStatus(post.id, 'published');

      // Track analytics
      await this.trackPostMetrics(post);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ErrorMessages.UNKNOWN_ERROR;
      await this.updatePostStatus(post.id, 'failed', errorMessage);
      handleError(error, { postId: post.id });
    }
  }

  /**
   * Update post status
   */
  private async updatePostStatus(
    postId: string,
    status: ScheduledPost['status'],
    errorMessage?: string
  ) {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          status,
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      addBreadcrumb({
        category: 'scheduler',
        message: `Updated post status: ${status}`,
        level: 'info',
        data: { postId, status, errorMessage },
      });
    } catch (error) {
      handleError(error, { postId, status });
    }
  }

  /**
   * Track post metrics
   */
  private async trackPostMetrics(post: ScheduledPost) {
    try {
      const { error } = await supabase
        .from('post_analytics')
        .insert({
          post_id: post.id,
          user_id: post.user_id,
          scheduled_time: post.scheduled_time,
          publish_time: new Date().toISOString(),
          status: 'published',
          media_count: post.media_urls.length,
        });

      if (error) throw error;
    } catch (error) {
      handleError(error, { postId: post.id });
    }
  }

  /**
   * Get scheduled posts for a user
   */
  async getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, { userId });
    }
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(userId: string, timeRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('post_analytics')
        .select('*')
        .eq('user_id', userId);

      if (timeRange) {
        query = query
          .gte('scheduled_time', timeRange.start.toISOString())
          .lte('scheduled_time', timeRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      throw handleError(error, { userId, timeRange });
    }
  }
}

export const schedulerService = new SchedulerService(); 