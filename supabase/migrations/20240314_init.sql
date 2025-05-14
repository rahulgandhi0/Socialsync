-- Create instagram_accounts table
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, instagram_user_id)
);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posted_content table
CREATE TABLE IF NOT EXISTS posted_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  instagram_post_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posted_content ENABLE ROW LEVEL SECURITY;

-- Policies for instagram_accounts
CREATE POLICY "Users can view their own Instagram accounts"
  ON instagram_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Instagram accounts"
  ON instagram_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram accounts"
  ON instagram_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts"
  ON scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
  ON scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
  ON scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for posted_content
CREATE POLICY "Users can view their own posted content"
  ON posted_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posted content"
  ON posted_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posted content"
  ON posted_content FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for Instagram images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('instagram-images', 'instagram-images', true);

-- Enable RLS on the bucket
CREATE POLICY "Public access to instagram-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'instagram-images');

CREATE POLICY "Authenticated users can upload instagram images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'instagram-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'instagram-images' 
    AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'instagram-images' 
    AND auth.uid() = owner
  ); 