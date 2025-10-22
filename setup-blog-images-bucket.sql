-- Blog Images Storage Bucket Setup
-- Run this script in your Supabase SQL Editor

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload blog images
CREATE POLICY "Allow authenticated uploads for blog images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Storage Policy: Allow public read access to blog images
CREATE POLICY "Allow public read access to blog images" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');

-- Storage Policy: Allow authenticated users to delete blog images
CREATE POLICY "Allow authenticated delete for blog images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Storage Policy: Allow authenticated users to update blog images
CREATE POLICY "Allow authenticated update for blog images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. blog-images bucket stores blog post images.';

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'blog-images';
