-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
DROP FUNCTION IF EXISTS process_scheduled_posts();
DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- Create scheduled_posts table
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

-- Add indexes
DROP INDEX IF EXISTS idx_scheduled_posts_user_id;
DROP INDEX IF EXISTS idx_scheduled_posts_status;
DROP INDEX IF EXISTS idx_scheduled_posts_scheduled_time;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

-- Enable RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can manage their own scheduled posts" ON scheduled_posts;

CREATE POLICY "Users can manage their own scheduled posts"
ON scheduled_posts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to publish scheduled posts
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void AS $$
DECLARE
    post RECORD;
BEGIN
    -- Get posts that are due for publishing
    FOR post IN 
        SELECT * FROM scheduled_posts 
        WHERE status = 'scheduled' 
        AND scheduled_time <= NOW()
    LOOP
        BEGIN
            -- Update status to prevent duplicate processing
            UPDATE scheduled_posts 
            SET status = 'processing'
            WHERE id = post.id;

            -- Call Instagram API to publish (this will be handled by your application code)
            -- For now, just mark as published
            UPDATE scheduled_posts 
            SET 
                status = 'published',
                updated_at = NOW()
            WHERE id = post.id;

        EXCEPTION WHEN OTHERS THEN
            -- Log error and update status
            UPDATE scheduled_posts 
            SET 
                status = 'failed',
                error_message = SQLERRM,
                updated_at = NOW()
            WHERE id = post.id;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 