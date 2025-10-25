-- ============================================
-- COMPLETE TEAM FUNCTIONALITY SETUP
-- ============================================
-- This migration creates the complete team booking system
-- and fixes existing data to work with team assignments
-- ============================================

-- 1. Add missing columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT false;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments
COMMENT ON COLUMN bookings.requires_team IS 'True if booking requires team assignment (Deep/Move In/Out services)';
COMMENT ON COLUMN bookings.updated_at IS 'Timestamp when the booking was last updated';

-- 2. Create booking_teams table
CREATE TABLE IF NOT EXISTS booking_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL CHECK (team_name IN ('Team A', 'Team B', 'Team C')),
  supervisor_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id) -- One team per booking
);

COMMENT ON TABLE booking_teams IS 'Team assignments for bookings that require multiple cleaners';

-- 3. Create booking_team_members table
CREATE TABLE IF NOT EXISTS booking_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_team_id UUID NOT NULL REFERENCES booking_teams(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  earnings INTEGER NOT NULL DEFAULT 25000, -- R250 in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_team_id, cleaner_id) -- One cleaner per team per booking
);

COMMENT ON TABLE booking_team_members IS 'Individual cleaners assigned to booking teams';

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_requires_team ON bookings(requires_team);
CREATE INDEX IF NOT EXISTS idx_bookings_updated_at ON bookings(updated_at);
CREATE INDEX IF NOT EXISTS idx_booking_teams_booking ON booking_teams(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_teams_team_name ON booking_teams(team_name);
CREATE INDEX IF NOT EXISTS idx_booking_team_members_team ON booking_team_members(booking_team_id);
CREATE INDEX IF NOT EXISTS idx_booking_team_members_cleaner ON booking_team_members(cleaner_id);

-- 5. Fix existing bookings data
UPDATE bookings 
SET requires_team = false
WHERE service_type IN ('Standard', 'Airbnb')
  AND (requires_team IS NULL OR requires_team = true);

UPDATE bookings 
SET requires_team = true
WHERE service_type IN ('Deep', 'Move In/Out')
  AND (requires_team IS NULL OR requires_team = false);

-- 6. Verify setup
SELECT 
  'bookings' as table_name,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN requires_team = true THEN 1 END) as team_bookings,
  COUNT(CASE WHEN requires_team = false THEN 1 END) as individual_bookings
FROM bookings
UNION ALL
SELECT 
  'booking_teams' as table_name,
  COUNT(*) as total_teams,
  0 as team_bookings,
  0 as individual_bookings
FROM booking_teams;

-- 7. Show sample of updated bookings
SELECT 
  id,
  service_type,
  requires_team,
  cleaner_id,
  customer_name,
  booking_date
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;
