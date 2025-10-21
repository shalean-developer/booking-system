-- Customer Review System Migration
-- Adds support for customers to review cleaners after job completion

-- Create cleaner_reviews table
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

-- Add customer review fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_review_id UUID REFERENCES cleaner_reviews(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_cleaner_id ON cleaner_reviews(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_customer_id ON cleaner_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_booking_id ON cleaner_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_created_at ON cleaner_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_reviewed ON bookings(customer_reviewed) WHERE customer_reviewed = false;

-- Enable Row Level Security
ALTER TABLE cleaner_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cleaner_reviews

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

-- Policy: No updates or deletes (reviews are permanent)
-- No update/delete policies = not allowed

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleaner_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleaner_reviews_updated_at
  BEFORE UPDATE ON cleaner_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_reviews_updated_at();

-- Create trigger to update cleaner average rating when review is added
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

CREATE TRIGGER update_cleaner_rating_after_review
  AFTER INSERT ON cleaner_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_rating_on_review();

-- Create storage bucket for review photos (run via Supabase dashboard or use supabase CLI)
-- This is a reference SQL - actual bucket creation should be done via Supabase dashboard:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create bucket named "review-photos"
-- 3. Set to public: true (for reading)
-- 4. Add policy: authenticated users can upload

-- Note: Storage bucket creation SQL (for reference, may need to be done via dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('review-photos', 'review-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos (if creating programmatically)
-- CREATE POLICY "Authenticated users can upload review photos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'review-photos');

-- CREATE POLICY "Public can view review photos"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'review-photos');

-- CREATE POLICY "Users can delete their own review photos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'review-photos' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

COMMENT ON TABLE cleaner_reviews IS 'Customer reviews and ratings for cleaners after job completion';
COMMENT ON COLUMN cleaner_reviews.overall_rating IS 'Overall rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.quality_rating IS 'Quality of work rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.punctuality_rating IS 'Punctuality rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.professionalism_rating IS 'Professionalism rating from 1-5 stars';
COMMENT ON COLUMN cleaner_reviews.photos IS 'Array of photo URLs from storage';

