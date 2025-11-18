-- ============================================
-- Booking Messages System - Phase 7
-- ============================================
-- Creates in-app messaging between cleaners and customers per booking
-- ============================================

-- Step 1: Create booking_messages table
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('cleaner', 'customer')),
  sender_id UUID NOT NULL, -- cleaner_id or customer_id depending on sender_type
  message_text TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}', -- Array of file URLs
  read_at TIMESTAMPTZ, -- When the recipient read the message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_created_at ON booking_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender ON booking_messages(sender_type, sender_id);

-- Step 3: Enable Row Level Security
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies
-- Note: Since cleaners use phone/password auth (not Supabase Auth), 
-- we'll handle authentication in API layer using service role client.
-- These policies provide basic structure but API will enforce access control.

-- Policy: Allow service role to manage all messages (for API)
CREATE POLICY "Service role can manage messages" ON booking_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users (customers) to view their messages
-- This will work for customers using Supabase Auth
CREATE POLICY "Customers can view their messages" ON booking_messages
  FOR SELECT
  USING (
    sender_type = 'customer'
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_messages.booking_id
      AND (
        bookings.customer_id = auth.uid()
        OR bookings.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Step 5: Add message count tracking to bookings (optional, for quick unread count)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS unread_messages_count INTEGER DEFAULT 0;

-- Step 6: Create function to update unread count (can be called via trigger or API)
CREATE OR REPLACE FUNCTION update_booking_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update unread count for the booking
  UPDATE bookings
  SET unread_messages_count = (
    SELECT COUNT(*)
    FROM booking_messages
    WHERE booking_messages.booking_id = NEW.booking_id
    AND booking_messages.read_at IS NULL
    AND (
      (NEW.sender_type = 'cleaner' AND booking_messages.sender_type = 'customer')
      OR (NEW.sender_type = 'customer' AND booking_messages.sender_type = 'cleaner')
    )
  )
  WHERE bookings.id = NEW.booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-update unread count
CREATE TRIGGER trigger_update_unread_count
AFTER INSERT OR UPDATE ON booking_messages
FOR EACH ROW
EXECUTE FUNCTION update_booking_unread_count();

-- Step 8: Add cleaner_response field to cleaner_reviews for review responses
ALTER TABLE cleaner_reviews
ADD COLUMN IF NOT EXISTS cleaner_response TEXT,
ADD COLUMN IF NOT EXISTS cleaner_response_at TIMESTAMPTZ;

-- Step 9: Create index for cleaner responses
CREATE INDEX IF NOT EXISTS idx_cleaner_reviews_cleaner_response ON cleaner_reviews(cleaner_id, cleaner_response_at DESC NULLS LAST);

-- Step 10: Add RLS policy for cleaners to respond to reviews
-- (Note: This assumes cleaners can already view their reviews via existing policies)
-- We'll handle response updates via API with service role client

COMMENT ON TABLE booking_messages IS 'In-app messaging between cleaners and customers per booking';
COMMENT ON COLUMN booking_messages.sender_type IS 'Either "cleaner" or "customer"';
COMMENT ON COLUMN booking_messages.attachments IS 'Array of file URLs (photos, documents)';
COMMENT ON COLUMN cleaner_reviews.cleaner_response IS 'Cleaner response to customer review';

