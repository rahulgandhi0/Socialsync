-- Create cached_events table
CREATE TABLE cached_events (
  id TEXT PRIMARY KEY,
  ticketmaster_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL,
  images JSONB,
  formatted_data JSONB,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories TEXT[],
  preferred_location TEXT,
  search_radius INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_interactions table
CREATE TABLE event_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES cached_events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'save', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_cached_events_cached_at ON cached_events(cached_at);
CREATE INDEX idx_cached_events_interaction_count ON cached_events(interaction_count DESC);
CREATE INDEX idx_event_interactions_user_id ON event_interactions(user_id);
CREATE INDEX idx_event_interactions_event_id ON event_interactions(event_id);
CREATE INDEX idx_event_interactions_type ON event_interactions(interaction_type);

-- Enable Row Level Security (RLS)
ALTER TABLE cached_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Cached events are readable by all authenticated users
CREATE POLICY "Cached events are readable by all authenticated users"
ON cached_events FOR SELECT
TO authenticated
USING (true);

-- User preferences are only accessible by the owner
CREATE POLICY "Users can manage their own preferences"
ON user_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Event interactions are only accessible by the owner
CREATE POLICY "Users can manage their own event interactions"
ON event_interactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to increment event interaction count
CREATE OR REPLACE FUNCTION increment_event_interaction_count(event_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO cached_events (id, interaction_count)
  VALUES (event_id, 1)
  ON CONFLICT (id) DO UPDATE
  SET interaction_count = cached_events.interaction_count + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_cached_events_updated_at
    BEFORE UPDATE ON cached_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to clean up old cached events
CREATE OR REPLACE FUNCTION cleanup_old_cached_events()
RETURNS void AS $$
BEGIN
  -- Delete events older than 24 hours with low interaction count
  DELETE FROM cached_events
  WHERE cached_at < NOW() - INTERVAL '24 hours'
    AND interaction_count < 5;
  
  -- Keep events with high interaction count but refresh them if needed
  UPDATE cached_events
  SET cached_at = NOW()
  WHERE cached_at < NOW() - INTERVAL '24 hours'
    AND interaction_count >= 5;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old cached events
SELECT cron.schedule(
  'cleanup-cached-events',
  '0 */4 * * *', -- Run every 4 hours
  'SELECT cleanup_old_cached_events();'
); 