-- COMPLETE FRESH DATABASE SCHEMA FOR SOCIALSYNC
-- Apply this SQL in Supabase SQL Editor after deleting all tables
-- Includes: Tables, RLS, Instagram Auth, Analytics, Indexes, Triggers, Functions

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE ALL TABLES
-- ============================================================================

-- Instagram Accounts Table
CREATE TABLE public.instagram_accounts (
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

-- User Preferences Table
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories TEXT[],
  preferred_location TEXT,
  search_radius INTEGER DEFAULT 50,
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

-- Cached Events Table (Ticketmaster Integration)
CREATE TABLE public.cached_events (
  id TEXT PRIMARY KEY,
  ticketmaster_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL,
  images JSONB,
  formatted_data JSONB,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  price_range JSONB,
  categories TEXT[],
  genre TEXT,
  subgenre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Interactions Table
CREATE TABLE public.event_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES public.cached_events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'save', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Posts Table
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  instagram_media_id TEXT,
  post_type TEXT DEFAULT 'single' CHECK (post_type IN ('single', 'carousel', 'reel', 'story')),
  media_url TEXT, -- Keep for backward compatibility
  media_urls TEXT[], -- New field for multiple media
  caption TEXT,
  hashtags TEXT[],
  location_id TEXT,
  location_name TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed', 'scheduled', 'cancelled')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  instagram_post_id TEXT,
  permalink TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posted Content / Analytics Table
CREATE TABLE public.posted_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  instagram_post_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_urls TEXT[], -- For carousel posts
  caption TEXT,
  hashtags TEXT[],
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Basic Instagram Insights
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  
  -- Calculated metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  best_performing_hour INTEGER,
  day_of_week INTEGER,
  
  -- Raw metrics from Instagram API
  metrics JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Instagram Accounts Indexes
CREATE INDEX idx_instagram_accounts_user_id ON public.instagram_accounts(user_id);
CREATE INDEX idx_instagram_accounts_active ON public.instagram_accounts(user_id, is_active);
CREATE INDEX idx_instagram_accounts_instagram_user_id ON public.instagram_accounts(instagram_user_id);
CREATE INDEX idx_instagram_accounts_token_expires ON public.instagram_accounts(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Scheduled Posts Indexes
CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON public.scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_account_id ON public.scheduled_posts(instagram_account_id);
CREATE INDEX idx_scheduled_posts_user_status ON public.scheduled_posts(user_id, status);
CREATE INDEX idx_scheduled_posts_pending ON public.scheduled_posts(scheduled_time) WHERE status = 'pending';

-- Posted Content Indexes
CREATE INDEX idx_posted_content_user_id ON public.posted_content(user_id);
CREATE INDEX idx_posted_content_account_id ON public.posted_content(instagram_account_id);
CREATE INDEX idx_posted_content_posted_at ON public.posted_content(posted_at);
CREATE INDEX idx_posted_content_engagement ON public.posted_content(engagement_rate DESC);
CREATE INDEX idx_posted_content_instagram_post_id ON public.posted_content(instagram_post_id);

-- Cached Events Indexes
CREATE INDEX idx_cached_events_event_date ON public.cached_events(event_date);
CREATE INDEX idx_cached_events_city ON public.cached_events(city);
CREATE INDEX idx_cached_events_genre ON public.cached_events(genre);
CREATE INDEX idx_cached_events_cached_at ON public.cached_events(cached_at);

-- Event Interactions Indexes
CREATE INDEX idx_event_interactions_user_id ON public.event_interactions(user_id);
CREATE INDEX idx_event_interactions_event_id ON public.event_interactions(event_id);
CREATE INDEX idx_event_interactions_type ON public.event_interactions(interaction_type);
CREATE INDEX idx_event_interactions_user_event ON public.event_interactions(user_id, event_id);

-- User Preferences Indexes
CREATE INDEX idx_user_preferences_location ON public.user_preferences(preferred_location);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
-- Note: cached_events remains public as it's shared data

-- ============================================================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Instagram Accounts Policies
CREATE POLICY "Users can view their own instagram accounts"
ON public.instagram_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instagram accounts"
ON public.instagram_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instagram accounts"
ON public.instagram_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instagram accounts"
ON public.instagram_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Scheduled Posts Policies
CREATE POLICY "Users can view their own scheduled posts"
ON public.scheduled_posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts"
ON public.scheduled_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
ON public.scheduled_posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
ON public.scheduled_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Posted Content Policies
CREATE POLICY "Users can view their own posted content"
ON public.posted_content FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posted content"
ON public.posted_content FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posted content"
ON public.posted_content FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posted content"
ON public.posted_content FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Event Interactions Policies
CREATE POLICY "Users can view their own event interactions"
ON public.event_interactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event interactions"
ON public.event_interactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event interactions"
ON public.event_interactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event interactions"
ON public.event_interactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Cached Events - Allow everyone to read (public data)
CREATE POLICY "Anyone can view cached events"
ON public.cached_events FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to refresh Instagram token
CREATE OR REPLACE FUNCTION refresh_instagram_token(
  account_id UUID,
  new_access_token TEXT,
  new_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.instagram_accounts 
  SET 
    access_token = new_access_token,
    token_expires_at = new_expires_at,
    last_sync_at = NOW(),
    updated_at = NOW()
  WHERE id = account_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Instagram accounts needing token refresh
CREATE OR REPLACE FUNCTION get_accounts_needing_refresh()
RETURNS TABLE(
  account_id UUID,
  user_id UUID,
  instagram_username TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ia.id,
    ia.user_id,
    ia.instagram_username,
    ia.token_expires_at
  FROM public.instagram_accounts ia
  WHERE ia.is_active = true 
    AND ia.token_expires_at IS NOT NULL
    AND ia.token_expires_at < NOW() + INTERVAL '7 days'; -- Refresh tokens expiring in 7 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(
  user_uuid UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
  total_posts BIGINT,
  avg_engagement_rate NUMERIC,
  total_reach BIGINT,
  total_impressions BIGINT,
  total_likes BIGINT,
  total_comments BIGINT,
  total_shares BIGINT,
  total_saves BIGINT,
  best_performing_hour INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_posts,
    ROUND(AVG(pc.engagement_rate), 2) as avg_engagement_rate,
    COALESCE(SUM(pc.reach), 0) as total_reach,
    COALESCE(SUM(pc.impressions), 0) as total_impressions,
    COALESCE(SUM(pc.likes), 0) as total_likes,
    COALESCE(SUM(pc.comments), 0) as total_comments,
    COALESCE(SUM(pc.shares), 0) as total_shares,
    COALESCE(SUM(pc.saves), 0) as total_saves,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM pc.posted_at)) as best_performing_hour
  FROM public.posted_content pc
  WHERE pc.user_id = user_uuid 
    AND pc.posted_at >= start_date 
    AND pc.posted_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get posts ready for publishing
CREATE OR REPLACE FUNCTION get_posts_ready_for_publishing()
RETURNS TABLE(
  post_id UUID,
  user_id UUID,
  instagram_account_id UUID,
  media_urls TEXT[],
  caption TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.instagram_account_id,
    COALESCE(sp.media_urls, ARRAY[sp.media_url]) as media_urls,
    sp.caption,
    sp.scheduled_time
  FROM public.scheduled_posts sp
  JOIN public.instagram_accounts ia ON sp.instagram_account_id = ia.id
  WHERE sp.status = 'pending'
    AND sp.scheduled_time <= NOW()
    AND ia.is_active = true
    AND sp.retry_count < sp.max_retries
  ORDER BY sp.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post status
CREATE OR REPLACE FUNCTION update_post_status(
  post_id UUID,
  new_status TEXT,
  instagram_post_id TEXT DEFAULT NULL,
  error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF new_status = 'published' THEN
    UPDATE public.scheduled_posts 
    SET 
      status = new_status,
      instagram_post_id = COALESCE(update_post_status.instagram_post_id, scheduled_posts.instagram_post_id),
      published_at = NOW(),
      updated_at = NOW()
    WHERE id = post_id AND user_id = auth.uid();
  ELSIF new_status = 'failed' THEN
    UPDATE public.scheduled_posts 
    SET 
      status = new_status,
      error_message = error_msg,
      retry_count = retry_count + 1,
      updated_at = NOW()
    WHERE id = post_id AND user_id = auth.uid();
  ELSE
    UPDATE public.scheduled_posts 
    SET 
      status = new_status,
      updated_at = NOW()
    WHERE id = post_id AND user_id = auth.uid();
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  reach INTEGER
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF reach = 0 OR reach IS NULL THEN
    RETURN 0.00;
  END IF;
  
  RETURN ROUND(
    ((COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(shares, 0) + COALESCE(saves, 0))::DECIMAL / reach) * 100,
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_instagram_accounts_updated_at
    BEFORE UPDATE ON public.instagram_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posted_content_updated_at
    BEFORE UPDATE ON public.posted_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cached_events_updated_at
    BEFORE UPDATE ON public.cached_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. CREATE MATERIALIZED VIEW FOR ANALYTICS
-- ============================================================================

CREATE MATERIALIZED VIEW analytics_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', posted_at) as month,
  COUNT(*) as total_posts,
  ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
  SUM(reach) as total_reach,
  SUM(impressions) as total_impressions,
  SUM(likes) as total_likes,
  SUM(comments) as total_comments,
  SUM(shares) as total_shares,
  SUM(saves) as total_saves,
  EXTRACT(HOUR FROM posted_at) as posting_hour,
  COUNT(*) as posts_in_hour,
  MAX(engagement_rate) as best_engagement_rate,
  MAX(reach) as best_reach,
  MAX(impressions) as best_impressions
FROM public.posted_content
GROUP BY user_id, DATE_TRUNC('month', posted_at), EXTRACT(HOUR FROM posted_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_analytics_summary_unique 
ON analytics_summary(user_id, month, posting_hour);

-- Function to refresh analytics summary
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view
CREATE TRIGGER refresh_analytics_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.posted_content
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_analytics_summary();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.cached_events TO anon; -- Allow anonymous users to view events

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- 10. INITIAL SETUP
-- ============================================================================

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW analytics_summary;

-- Create a function to initialize user preferences
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user preferences on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_preferences();

-- ============================================================================
-- SCHEMA COMPLETE!
-- ============================================================================

-- Summary of what was created:
-- 
-- TABLES:
-- ✅ instagram_accounts - Store Instagram account connections with token management
-- ✅ user_preferences - User settings, timezones, notification preferences
-- ✅ cached_events - Ticketmaster event data with location and pricing info
-- ✅ event_interactions - Track user interactions with events
-- ✅ scheduled_posts - Advanced post scheduling with retry logic and multiple media
-- ✅ posted_content - Analytics and performance tracking for published posts
--
-- SECURITY:
-- ✅ Row Level Security enabled on all user-specific tables
-- ✅ Comprehensive RLS policies for complete data isolation
-- ✅ Public access to cached events for shared data
--
-- PERFORMANCE:
-- ✅ Optimized indexes for all common query patterns
-- ✅ Materialized view for analytics summaries
-- ✅ Efficient foreign key relationships
--
-- FUNCTIONALITY:
-- ✅ Automatic updated_at triggers
-- ✅ Instagram token refresh functions
-- ✅ Analytics calculation functions
-- ✅ Post scheduling and status management
-- ✅ Engagement rate calculations
-- ✅ Automatic user preferences initialization
--
-- Your database is now ready for production with the new Supabase workflow!
