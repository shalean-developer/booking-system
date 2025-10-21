-- ============================================
-- Customer Review System - Quick Setup Script
-- ============================================
-- Run this script in your Supabase SQL Editor to set up the complete review system
-- 
-- What this script does:
-- 1. Creates cleaner_reviews table
-- 2. Updates bookings table with review tracking fields
-- 3. Sets up Row Level Security policies
-- 4. Creates triggers for automatic rating updates
-- 5. Creates indexes for performance
--
-- Note: Storage bucket 'review-photos' must be created manually via Supabase Dashboard
-- ============================================

-- Step 1: Create cleaner_reviews table
CREATE TABLE IF NOT EXISTS cleaner_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER NOT NULL CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  review_text TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add review tracking fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_review_id UUID REFERENCES cleaner_reviews(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_cleaner_id ON cleaner_reviews(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_customer_id ON cleaner_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_booking_id ON cleaner_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_created_at ON cleaner_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_reviewed ON bookings(customer_reviewed) WHERE customer_reviewed = false;

-- Step 4: Enable Row Level Security
ALTER TABLE cleaner_reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Customers can view their own reviews" ON cleaner_reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON cleaner_reviews;
DROP POLICY IF EXISTS "Customers can insert reviews for their bookings" ON cleaner_reviews;

-- Step 6: Create RLS Policies

-- Policy: Customers can view their own reviews
CREATE POLICY "Customers can view their own reviews" ON cleaner_reviews
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON cleaner_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Customers can insert reviews for their own bookings
CREATE POLICY "Customers can insert reviews for their bookings" ON cleaner_reviews
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
    AND booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.customer_id = cleaner_reviews.customer_id
      AND b.status = 'completed'
      AND b.customer_reviewed = false
    )
  );

-- Step 7: Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleaner_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running script)
DROP TRIGGER IF EXISTS cleaner_reviews_updated_at ON cleaner_reviews;

-- Create trigger
CREATE TRIGGER cleaner_reviews_updated_at
  BEFORE UPDATE ON cleaner_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_reviews_updated_at();

-- Step 8: Create trigger function to auto-update cleaner rating
CREATE OR REPLACE FUNCTION update_cleaner_rating_on_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the cleaner's average rating based on all their reviews
  UPDATE cleaners
  SET rating = (
    SELECT ROUND(AVG(overall_rating)::numeric, 1)
    FROM cleaner_reviews
    WHERE cleaner_id = NEW.cleaner_id
  )
  WHERE id = NEW.cleaner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running script)
DROP TRIGGER IF EXISTS update_cleaner_rating_after_review ON cleaner_reviews;

-- Create trigger
CREATE TRIGGER update_cleaner_rating_after_review
  AFTER INSERT ON cleaner_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_rating_on_review();

-- Step 9: Add helpful comments
COMMENT ON TABLE cleaner_reviews IS 'Customer reviews and ratings for cleaners after job completion';
COMMENT ON COLUMN cleaner_reviews.overall_rating IS 'Overall rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.quality_rating IS 'Quality of work rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.punctuality_rating IS 'Punctuality rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.professionalism_rating IS 'Professionalism rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.photos IS 'Array of photo URLs from storage';

-- ============================================
-- Setup Complete! ✅
-- ============================================
-- 
-- Next Steps:
-- 1. Create storage bucket 'review-photos' in Supabase Dashboard
--    - Go to Storage → Create bucket
--    - Name: review-photos
--    - Set as Public
--
-- 2. Add storage policies (run below if not auto-created):
-- ============================================

-- Storage Policy: Allow authenticated uploads
-- CREATE POLICY "Authenticated users can upload review photos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'review-photos');

-- Storage Policy: Allow public read
-- CREATE POLICY "Public can view review photos"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'review-photos');

-- Storage Policy: Allow users to delete their own photos
-- CREATE POLICY "Users can delete their own review photos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'review-photos' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- ============================================
-- Verification Queries
-- ============================================

-- Check if table was created successfully
SELECT 'cleaner_reviews table' as check, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaner_reviews') 
       THEN '✅ Created' ELSE '❌ Not found' END as status;

-- Check if bookings columns were added
SELECT 'customer_reviewed column' as check,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_reviewed')
       THEN '✅ Added' ELSE '❌ Not found' END as status;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'cleaner_reviews'
ORDER BY policyname;

-- Count existing reviews
SELECT COUNT(*) as total_reviews FROM cleaner_reviews;

-- ============================================
-- Test Query: Get all reviews with details
-- ============================================

-- SELECT 
--   cr.id,
--   cr.overall_rating,
--   cr.quality_rating,
--   cr.punctuality_rating,
--   cr.professionalism_rating,
--   cr.review_text,
--   cr.created_at,
--   c.first_name || ' ' || c.last_name as customer_name,
--   cl.name as cleaner_name,
--   b.booking_date,
--   b.service_type
-- FROM cleaner_reviews cr
-- JOIN customers c ON cr.customer_id = c.id
-- JOIN cleaners cl ON cr.cleaner_id = cl.id
-- JOIN bookings b ON cr.booking_id = b.id
-- ORDER BY cr.created_at DESC;


