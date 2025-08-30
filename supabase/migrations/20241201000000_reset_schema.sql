-- Complete database schema reset for Socialsync
-- This migration resets the entire schema to ensure compatibility with new Supabase workflow

-- Drop existing tables and dependencies if they exist
DROP TRIGGER IF EXISTS refresh_post_analytics_summary ON post_analytics;
DROP FUNCTION IF EXISTS refresh_post_analytics_summary() CASCADE;
DROP MATERIALIZED VIEW IF EXISTS post_analytics_summary;
DROP TRIGGER IF EXISTS update_post_analytics_updated_at ON post_analytics;
DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop tables in dependency order
DROP TABLE IF EXISTS post_analytics CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;
DROP TABLE IF EXISTS instagram_accounts CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create instagram_accounts table
CREATE TABLE instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_business_account_id TEXT,
  instagram_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business')),
  profile_picture_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, instagram_user_id)
);

-- Create scheduled_posts table
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  instagram_media_id TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  post_type TEXT DEFAULT 'carousel' CHECK (post_type IN ('single', 'carousel', 'reel', 'story')),
  caption TEXT,
  media_urls TEXT[] NOT NULL,
  media_ids TEXT[],
  hashtags TEXT[],
  location_id TEXT,
  location_name TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  published_at TIMESTAMP WITH TIME ZONE,
  instagram_post_id TEXT,
  instagram_permalink TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_analytics table
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_post_id TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  publish_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'published', 'failed')),
  media_count INTEGER NOT NULL DEFAULT 1,
  
  -- Instagram Insights Metrics (stored as JSONB for flexibility)
  metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Common metrics extracted for easier querying
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Time-based analytics
  best_performing_hour INTEGER,
  day_of_week INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table for Ticketmaster integration
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticketmaster_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  ticket_url TEXT,
  price_range JSONB,
  categories TEXT[],
  genre TEXT,
  subgenre TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  preferred_posting_times TIME[],
  auto_hashtags TEXT[],
  default_caption_template TEXT,
  notification_settings JSONB DEFAULT '{
    "post_published": true,
    "post_failed": true,
    "weekly_analytics": true,
    "monthly_report": true
  }'::jsonb,
  instagram_business_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX idx_instagram_accounts_active ON instagram_accounts(user_id, is_active);
CREATE INDEX idx_instagram_accounts_instagram_user_id ON instagram_accounts(instagram_user_id);

CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_account_id ON scheduled_posts(instagram_account_id);
CREATE INDEX idx_scheduled_posts_user_status ON scheduled_posts(user_id, status);

CREATE INDEX idx_post_analytics_user_id ON post_analytics(user_id);
CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_publish_time ON post_analytics(publish_time);
CREATE INDEX idx_post_analytics_status ON post_analytics(status);
CREATE INDEX idx_post_analytics_engagement ON post_analytics(engagement_rate DESC);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_ticketmaster_id ON events(ticketmaster_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_selected ON events(user_id, is_selected);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS on all tables
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies

-- Instagram Accounts Policies
CREATE POLICY "Users can manage their own instagram accounts"
ON instagram_accounts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Scheduled Posts Policies
CREATE POLICY "Users can manage their own scheduled posts"
ON scheduled_posts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Post Analytics Policies
CREATE POLICY "Users can view their own analytics"
ON post_analytics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
ON post_analytics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
ON post_analytics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Users can manage their own events"
ON events FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can manage their own preferences"
ON user_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_instagram_accounts_updated_at
    BEFORE UPDATE ON instagram_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_analytics_updated_at
    BEFORE UPDATE ON post_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create enhanced materialized view for analytics summaries
CREATE MATERIALIZED VIEW post_analytics_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', publish_time) as month,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE status = 'published') as successful_posts,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_posts,
  ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
  SUM(reach) as total_reach,
  SUM(impressions) as total_impressions,
  SUM(likes) as total_likes,
  SUM(comments) as total_comments,
  SUM(shares) as total_shares,
  SUM(saves) as total_saves,
  EXTRACT(HOUR FROM publish_time) as posting_hour,
  COUNT(*) as posts_in_hour,
  
  -- Best performing metrics
  MAX(engagement_rate) as best_engagement_rate,
  MAX(reach) as best_reach,
  MAX(impressions) as best_impressions
FROM post_analytics
WHERE status = 'published'
GROUP BY user_id, DATE_TRUNC('month', publish_time), EXTRACT(HOUR FROM publish_time);

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_post_analytics_summary_unique 
ON post_analytics_summary(user_id, month, posting_hour);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_post_analytics_summary()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY post_analytics_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_post_analytics_summary
  AFTER INSERT OR UPDATE OR DELETE
  ON post_analytics
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_post_analytics_summary();

-- Create function to handle Instagram token refresh
CREATE OR REPLACE FUNCTION refresh_instagram_token(
  account_id UUID,
  new_access_token TEXT,
  new_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE instagram_accounts 
  SET 
    access_token = new_access_token,
    token_expires_at = new_expires_at,
    last_sync_at = NOW(),
    updated_at = NOW()
  WHERE id = account_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(
  user_uuid UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
  total_posts BIGINT,
  successful_posts BIGINT,
  failed_posts BIGINT,
  avg_engagement_rate NUMERIC,
  total_reach BIGINT,
  total_impressions BIGINT,
  best_performing_hour INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE pa.status = 'published') as successful_posts,
    COUNT(*) FILTER (WHERE pa.status = 'failed') as failed_posts,
    ROUND(AVG(pa.engagement_rate), 2) as avg_engagement_rate,
    COALESCE(SUM(pa.reach), 0) as total_reach,
    COALESCE(SUM(pa.impressions), 0) as total_impressions,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM pa.publish_time)) as best_performing_hour
  FROM post_analytics pa
  WHERE pa.user_id = user_uuid 
    AND pa.publish_time >= start_date 
    AND pa.publish_time <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Initial data refresh
REFRESH MATERIALIZED VIEW post_analytics_summary;
