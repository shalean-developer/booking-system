-- ============================================
-- CREATE BOOKING ACTIVITIES TABLE
-- ============================================
-- This migration creates a table to track cleaner activities
-- when they change booking status, particularly for admin dashboard notifications
-- ============================================

-- Create booking_activities table
CREATE TABLE IF NOT EXISTS booking_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  cleaner_name TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'status_change',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE booking_activities IS 'Tracks cleaner activities when they change booking status for admin dashboard notifications';
COMMENT ON COLUMN booking_activities.booking_id IS 'Reference to the booking that was changed';
COMMENT ON COLUMN booking_activities.cleaner_id IS 'Reference to the cleaner who performed the action';
COMMENT ON COLUMN booking_activities.cleaner_name IS 'Denormalized cleaner name for quick display without joins';
COMMENT ON COLUMN booking_activities.old_status IS 'Previous booking status';
COMMENT ON COLUMN booking_activities.new_status IS 'New booking status after change';
COMMENT ON COLUMN booking_activities.action_type IS 'Type of action (e.g., status_change)';
COMMENT ON COLUMN booking_activities.created_at IS 'Timestamp when the activity occurred';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_activities_created_at ON booking_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_activities_booking_id ON booking_activities(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activities_cleaner_id ON booking_activities(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_booking_activities_action_type ON booking_activities(action_type);

-- Enable RLS (Row Level Security)
ALTER TABLE booking_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (read-only for admins)
CREATE POLICY "Admins can view booking activities" ON booking_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.auth_user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Verify table creation
SELECT 
  'booking_activities table created' as status,
  COUNT(*) as existing_rows
FROM booking_activities;

