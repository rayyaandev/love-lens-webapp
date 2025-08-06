-- Love Lens Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create booths table
CREATE TABLE booths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  email TEXT NOT NULL,
  booth_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guest_submissions table
CREATE TABLE guest_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  guest_name TEXT,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'video')),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_booths_user_id ON booths(user_id);
CREATE INDEX idx_booths_booth_code ON booths(booth_code);
CREATE INDEX idx_guest_submissions_booth_id ON guest_submissions(booth_id);
CREATE INDEX idx_guest_submissions_created_at ON guest_submissions(created_at DESC);
CREATE INDEX idx_guest_submissions_is_approved ON guest_submissions(is_approved);

-- Create RLS (Row Level Security) policies
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_submissions ENABLE ROW LEVEL SECURITY;

-- Booth policies
CREATE POLICY "Users can view their own booth" ON booths
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own booth" ON booths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booth" ON booths
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view booth information" ON booths
  FOR SELECT USING (true);

-- Guest submissions policies
CREATE POLICY "Booth owners can view all submissions" ON guest_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booths 
      WHERE booths.id = guest_submissions.booth_id 
      AND booths.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert submissions" ON guest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Booth owners can update submissions" ON guest_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM booths 
      WHERE booths.id = guest_submissions.booth_id 
      AND booths.user_id = auth.uid()
    )
  );

CREATE POLICY "Booth owners can delete submissions" ON guest_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM booths 
      WHERE booths.id = guest_submissions.booth_id 
      AND booths.user_id = auth.uid()
    )
  );

-- Public submissions can be viewed if booth is public
CREATE POLICY "Public submissions can be viewed" ON guest_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booths 
      WHERE booths.id = guest_submissions.booth_id 
      AND booths.is_public = true
      AND guest_submissions.is_approved = true
      AND guest_submissions.media_url IS NOT NULL
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_booths_updated_at 
  BEFORE UPDATE ON booths 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for guest media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guest-media', 'guest-media', true);

-- Storage policies for guest media
CREATE POLICY "Public access to guest media" ON storage.objects
  FOR SELECT USING (bucket_id = 'guest-media');

CREATE POLICY "Anyone can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'guest-media');

CREATE POLICY "Booth owners can delete media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'guest-media' 
    AND EXISTS (
      SELECT 1 FROM booths 
      WHERE booths.user_id = auth.uid()
    )
  ); 