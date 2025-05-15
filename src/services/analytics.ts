import { supabase } from '../lib/supabase';
import { addBreadcrumb } from '@sentry/browser';
import { handleError } from '../lib/errors';

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  user_id: string;
  scheduled_time: string;
  publish_time: string;
  status: 'scheduled' | 'published' | 'failed';
  media_count: number;
  media_urls: string[];
  metrics?: PostMetrics;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_posts: number;
  successful_posts: number;
  failed_posts: number;
  average_engagement_rate: number;
  total_reach: number;
  total_impressions: number;
  best_performing_posts: PostAnalytics[];
  posting_time_distribution: Record<string, number>;
}

class AnalyticsService {
  /**
   * Track post metrics
   */
  async trackPostMetrics(postId: string, metrics: Partial<PostMetrics>) {
    try {
      addBreadcrumb({
        category: 'analytics',
        message: 'Tracking post metrics',
        level: 'info',
        data: { postId, metrics },
      });

      const { error } = await supabase
        .from('post_analytics')
        .update({
          metrics: metrics,
          updated_at: new Date().toISOString(),
        })
        .eq('post_id', postId);

      if (error) throw error;
    } catch (error) {
      throw handleError(error, { postId, metrics });
    }
  }

  /**
   * Get analytics summary for a user
   */
  async getAnalyticsSummary(
    userId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<AnalyticsSummary> {
    try {
      let query = supabase
        .from('post_analytics')
        .select('*')
        .eq('user_id', userId);

      if (timeRange) {
        query = query
          .gte('publish_time', timeRange.start.toISOString())
          .lte('publish_time', timeRange.end.toISOString());
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      const summary: AnalyticsSummary = {
        total_posts: posts.length,
        successful_posts: posts.filter(p => p.status === 'published').length,
        failed_posts: posts.filter(p => p.status === 'failed').length,
        average_engagement_rate: this.calculateAverageEngagement(posts),
        total_reach: this.calculateTotalReach(posts),
        total_impressions: this.calculateTotalImpressions(posts),
        best_performing_posts: this.getBestPerformingPosts(posts),
        posting_time_distribution: this.getPostingTimeDistribution(posts),
      };

      return summary;
    } catch (error) {
      throw handleError(error, { userId, timeRange });
    }
  }

  /**
   * Calculate average engagement rate
   */
  private calculateAverageEngagement(posts: PostAnalytics[]): number {
    const postsWithMetrics = posts.filter(p => p.metrics?.engagement_rate);
    if (!postsWithMetrics.length) return 0;

    const totalEngagement = postsWithMetrics.reduce(
      (sum, post) => sum + (post.metrics?.engagement_rate || 0),
      0
    );

    return totalEngagement / postsWithMetrics.length;
  }

  /**
   * Calculate total reach
   */
  private calculateTotalReach(posts: PostAnalytics[]): number {
    return posts.reduce((sum, post) => sum + (post.metrics?.reach || 0), 0);
  }

  /**
   * Calculate total impressions
   */
  private calculateTotalImpressions(posts: PostAnalytics[]): number {
    return posts.reduce((sum, post) => sum + (post.metrics?.impressions || 0), 0);
  }

  /**
   * Get best performing posts
   */
  private getBestPerformingPosts(posts: PostAnalytics[]): PostAnalytics[] {
    return [...posts]
      .filter(p => p.metrics?.engagement_rate)
      .sort((a, b) => (b.metrics?.engagement_rate || 0) - (a.metrics?.engagement_rate || 0))
      .slice(0, 5);
  }

  /**
   * Get posting time distribution
   */
  private getPostingTimeDistribution(posts: PostAnalytics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    posts.forEach(post => {
      const hour = new Date(post.publish_time).getHours();
      distribution[hour] = (distribution[hour] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get detailed analytics for a specific post
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, { postId });
    }
  }

  /**
   * Get analytics for multiple posts
   */
  async getPostsAnalytics(postIds: string[]): Promise<PostAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('post_analytics')
        .select('*')
        .in('post_id', postIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, { postIds });
    }
  }
}

export const analyticsService = new AnalyticsService(); 