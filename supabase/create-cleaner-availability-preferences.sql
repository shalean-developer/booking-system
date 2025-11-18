-- ============================================
-- Cleaner Availability Preferences - Phase 8
-- ============================================
-- Advanced availability management for cleaners
-- ============================================

-- Step 1: Create cleaner_availability_preferences table
CREATE TABLE IF NOT EXISTS cleaner_availability_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  
  -- Time slot preferences
  preferred_start_time TIME, -- e.g., '08:00:00'
  preferred_end_time TIME,   -- e.g., '17:00:00'
  preferred_days_of_week INTEGER[] DEFAULT '{}', -- [1,2,3,4,5] for Mon-Fri
  
  -- Blocked dates/times
  blocked_dates DATE[] DEFAULT '{}', -- Array of specific dates to block
  blocked_time_slots JSONB DEFAULT '[]', -- [{date: '2025-01-15', start: '10:00', end: '12:00'}]
  
  -- Availability templates
  availability_template TEXT, -- e.g., 'weekdays_8am_5pm', 'flexible'
  
  -- Auto-decline settings
  auto_decline_outside_availability BOOLEAN DEFAULT false,
  auto_decline_below_min_value BOOLEAN DEFAULT false,
  min_booking_value_cents INTEGER, -- Minimum booking value in cents
  
  -- Booking preferences
  preferred_service_types TEXT[] DEFAULT '{}', -- ['Standard', 'Deep']
  max_distance_km INTEGER, -- Maximum distance in kilometers
  auto_accept_rules JSONB DEFAULT '{}', -- {min_rating: 4.5, preferred_customers: []}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cleaner_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_cleaner_availability_preferences_cleaner_id 
  ON cleaner_availability_preferences(cleaner_id);

-- Step 3: Enable Row Level Security
ALTER TABLE cleaner_availability_preferences ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies
-- Note: Since cleaners use phone/password auth, API will use service role client

-- Policy: Allow service role to manage all preferences (for API)
CREATE POLICY "Service role can manage availability preferences" 
  ON cleaner_availability_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleaner_availability_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger
CREATE TRIGGER trigger_update_cleaner_availability_preferences_updated_at
  BEFORE UPDATE ON cleaner_availability_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_availability_preferences_updated_at();

COMMENT ON TABLE cleaner_availability_preferences IS 'Advanced availability and booking preferences for cleaners';
COMMENT ON COLUMN cleaner_availability_preferences.preferred_days_of_week IS 'Array of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN cleaner_availability_preferences.blocked_time_slots IS 'JSON array of blocked time slots: [{"date": "2025-01-15", "start": "10:00", "end": "12:00"}]';
COMMENT ON COLUMN cleaner_availability_preferences.auto_accept_rules IS 'JSON object with auto-accept conditions';

