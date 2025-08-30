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
  user_id: string;
  instagram_account_id: string;
  instagram_post_id: string;
  media_url: string;
  media_urls?: string[];
  caption?: string;
  hashtags?: string[];
  posted_at: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  profile_visits: number;
  website_clicks: number;
  engagement_rate: number;
  best_performing_hour?: number;
  day_of_week?: number;
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

      // Calculate engagement rate if we have reach data
      const engagement_rate = metrics.reach && metrics.reach > 0 
        ? ((metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.saves || 0)) / metrics.reach * 100
        : 0;

      const { error } = await supabase
        .from('posted_content')
        .update({
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          reach: metrics.reach,
          impressions: metrics.impressions,
          engagement_rate: engagement_rate,
          metrics: metrics, // Keep the full metrics object as well
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

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
        .from('posted_content')
        .select('*')
        .eq('user_id', userId);

      if (timeRange) {
        query = query
          .gte('posted_at', timeRange.start.toISOString())
          .lte('posted_at', timeRange.end.toISOString());
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      const summary: AnalyticsSummary = {
        total_posts: posts.length,
        successful_posts: posts.length, // All posts in posted_content are successful
        failed_posts: 0, // Failed posts wouldn't be in posted_content
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
    const postsWithMetrics = posts.filter(p => p.engagement_rate);
    if (!postsWithMetrics.length) return 0;

    const totalEngagement = postsWithMetrics.reduce(
      (sum, post) => sum + (post.engagement_rate || 0),
      0
    );

    return totalEngagement / postsWithMetrics.length;
  }

  /**
   * Calculate total reach
   */
  private calculateTotalReach(posts: PostAnalytics[]): number {
    return posts.reduce((sum, post) => sum + (post.reach || 0), 0);
  }

  /**
   * Calculate total impressions
   */
  private calculateTotalImpressions(posts: PostAnalytics[]): number {
    return posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
  }

  /**
   * Get best performing posts
   */
  private getBestPerformingPosts(posts: PostAnalytics[]): PostAnalytics[] {
    return [...posts]
      .filter(p => p.engagement_rate)
      .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
      .slice(0, 5);
  }

  /**
   * Get posting time distribution
   */
  private getPostingTimeDistribution(posts: PostAnalytics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    posts.forEach(post => {
      const hour = new Date(post.posted_at).getHours();
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
        .from('posted_content')
        .select('*')
        .eq('id', postId)
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
        .from('posted_content')
        .select('*')
        .in('id', postIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, { postIds });
    }
  }
}

export const analyticsService = new AnalyticsService(); 