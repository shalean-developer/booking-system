-- ============================================
-- FIX TEAM BOOKING CONSTRAINT
-- ============================================
-- Allow 'team' as a valid cleaner_id value for team bookings
-- ============================================

-- Drop the existing constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS valid_cleaner;

-- Add updated constraint that allows 'team'
ALTER TABLE bookings 
ADD CONSTRAINT valid_cleaner CHECK (
  cleaner_id IS NULL OR
  cleaner_id = 'manual' OR
  cleaner_id = 'team' OR
  cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- Verify constraint is updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'valid_cleaner';

