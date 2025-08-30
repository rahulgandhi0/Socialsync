-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create instagram_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_business_account_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, instagram_user_id)
);

-- Create scheduled_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_media_id TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'published', 'failed')),
  caption TEXT,
  media_ids TEXT[],
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  publish_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'published', 'failed')),
  media_count INTEGER NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_post_analytics_user_id ON post_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_publish_time ON post_analytics(publish_time);
CREATE INDEX IF NOT EXISTS idx_post_analytics_status ON post_analytics(status);

-- Enable RLS on all tables
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own scheduled posts"
ON scheduled_posts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own instagram accounts"
ON instagram_accounts FOR ALL
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
CREATE OR REPLACE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_post_analytics_updated_at
    BEFORE UPDATE ON post_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for analytics summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS post_analytics_summary AS
SELECT
  user_id,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE status = 'published') as successful_posts,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_posts,
  AVG((metrics->>'engagement_rate')::numeric) as average_engagement_rate,
  SUM((metrics->>'reach')::numeric) as total_reach,
  SUM((metrics->>'impressions')::numeric) as total_impressions,
  EXTRACT(HOUR FROM publish_time) as posting_hour,
  COUNT(*) as posts_in_hour
FROM post_analytics
GROUP BY user_id, EXTRACT(HOUR FROM publish_time);

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_analytics_summary_user_id_hour 
ON post_analytics_summary(user_id, posting_hour);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_post_analytics_summary()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY post_analytics_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
DROP TRIGGER IF EXISTS refresh_post_analytics_summary ON post_analytics;
CREATE TRIGGER refresh_post_analytics_summary
  AFTER INSERT OR UPDATE OR DELETE
  ON post_analytics
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_post_analytics_summary(); 