-- Service Scheduling Limits Table
-- Purpose: Store scheduling limits and surge pricing configuration per service type
-- This table controls how many bookings are allowed per date for each service type

CREATE TABLE IF NOT EXISTS service_scheduling_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL UNIQUE,
  max_bookings_per_date INTEGER NOT NULL DEFAULT 20,
  uses_teams BOOLEAN NOT NULL DEFAULT false,
  surge_pricing_enabled BOOLEAN NOT NULL DEFAULT false,
  surge_threshold INTEGER, -- Number of bookings before surge pricing kicks in
  surge_percentage DECIMAL(5,2), -- Price increase percentage (e.g., 10.00 for 10%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_service_type CHECK (
    service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet')
  )
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_scheduling_limits_service_type ON service_scheduling_limits(service_type);

-- Insert default limits for each service type
INSERT INTO service_scheduling_limits (service_type, max_bookings_per_date, uses_teams, surge_pricing_enabled, surge_threshold, surge_percentage)
VALUES
  ('Deep', 3, true, false, NULL, NULL),
  ('Move In/Out', 3, true, false, NULL, NULL),
  ('Standard', 100, false, true, 70, 10.00),
  ('Airbnb', 100, false, true, 70, 10.00),
  ('Carpet', 10, false, false, NULL, NULL)
ON CONFLICT (service_type) DO UPDATE SET
  max_bookings_per_date = EXCLUDED.max_bookings_per_date,
  uses_teams = EXCLUDED.uses_teams,
  surge_pricing_enabled = EXCLUDED.surge_pricing_enabled,
  surge_threshold = EXCLUDED.surge_threshold,
  surge_percentage = EXCLUDED.surge_percentage,
  updated_at = NOW();

-- Add comments for documentation
COMMENT ON TABLE service_scheduling_limits IS 'Stores scheduling limits and surge pricing configuration per service type';
COMMENT ON COLUMN service_scheduling_limits.service_type IS 'Service type: Standard, Deep, Move In/Out, Airbnb, or Carpet';
COMMENT ON COLUMN service_scheduling_limits.max_bookings_per_date IS 'Maximum number of bookings allowed per date for this service';
COMMENT ON COLUMN service_scheduling_limits.uses_teams IS 'Whether this service uses team-based slots (Team A, B, C)';
COMMENT ON COLUMN service_scheduling_limits.surge_pricing_enabled IS 'Whether surge pricing is enabled for this service';
COMMENT ON COLUMN service_scheduling_limits.surge_threshold IS 'Number of bookings before surge pricing kicks in (e.g., 70)';
COMMENT ON COLUMN service_scheduling_limits.surge_percentage IS 'Price increase percentage when surge is active (e.g., 10.00 for 10%)';

