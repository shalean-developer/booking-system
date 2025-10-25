-- ============================================
-- ADD REQUIRES_TEAM COLUMN TO BOOKINGS
-- ============================================
-- Add the requires_team column that was missing from the bookings table
-- ============================================

-- Add requires_team column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN bookings.requires_team IS 'True if booking requires team assignment (Deep/Move In/Out services)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_requires_team ON bookings(requires_team);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'requires_team';

-- Show sample of existing bookings (should all be false initially)
SELECT 
  id, 
  service_type, 
  requires_team,
  cleaner_id,
  created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
