-- ============================================
-- CREATE BOOKING TEAMS SYSTEM
-- ============================================
-- This migration creates tables for team-based bookings
-- Used for Deep cleaning and Move In/Out services
-- ============================================

-- Add requires_team column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT false;

COMMENT ON COLUMN bookings.requires_team IS 'True if booking requires team assignment (Deep/Move In/Out services)';

-- Create booking_teams table
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
COMMENT ON COLUMN booking_teams.team_name IS 'Selected team name (Team A, B, or C)';
COMMENT ON COLUMN booking_teams.supervisor_id IS 'Cleaner assigned as team supervisor';

-- Create booking_team_members table
CREATE TABLE IF NOT EXISTS booking_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_team_id UUID NOT NULL REFERENCES booking_teams(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  earnings INTEGER NOT NULL DEFAULT 25000, -- R250 in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_team_id, cleaner_id) -- One cleaner per team per booking
);

COMMENT ON TABLE booking_team_members IS 'Individual cleaners assigned to booking teams';
COMMENT ON COLUMN booking_team_members.earnings IS 'Fixed R250 (25000 cents) per cleaner for team bookings';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_teams_booking ON booking_teams(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_teams_supervisor ON booking_teams(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_booking_team_members_team ON booking_team_members(booking_team_id);
CREATE INDEX IF NOT EXISTS idx_booking_team_members_cleaner ON booking_team_members(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requires_team ON bookings(requires_team);

-- Enable RLS
ALTER TABLE booking_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage booking teams" ON booking_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@shalean.co.za',
        'admin@shalean.com'
      )
    )
  );

CREATE POLICY "Admins can manage team members" ON booking_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@shalean.co.za',
        'admin@shalean.com'
      )
    )
  );

-- Function to calculate total team earnings
CREATE OR REPLACE FUNCTION calculate_team_earnings(team_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(earnings), 0)
    FROM booking_team_members
    WHERE booking_team_id = team_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get team member count
CREATE OR REPLACE FUNCTION get_team_member_count(team_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM booking_team_members
    WHERE booking_team_id = team_id
  );
END;
$$ LANGUAGE plpgsql;

-- Update trigger to set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_teams_updated_at
  BEFORE UPDATE ON booking_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables created
SELECT 
  'Tables Created' as status,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('booking_teams', 'booking_team_members')
  AND table_schema = 'public';

-- Show table structure
\d booking_teams;
\d booking_team_members;
