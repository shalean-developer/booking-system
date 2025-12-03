-- Add notes column to bookings table
-- Purpose: Fix error "Could not find the 'notes' column of 'bookings' in the schema cache"
-- Date: January 2025

-- Add notes column if it doesn't exist
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bookings.notes IS 'Optional notes for the booking';

-- Verification query (uncomment to verify)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings' AND column_name = 'notes';

