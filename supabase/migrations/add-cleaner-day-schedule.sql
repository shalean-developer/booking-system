-- Migration: Add day-of-week availability columns to cleaners table
-- Description: Allows admins to set which days of the week cleaners work

-- Add day-of-week availability columns
ALTER TABLE cleaners
  ADD COLUMN IF NOT EXISTS available_monday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_tuesday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_wednesday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_thursday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_friday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_saturday BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_sunday BOOLEAN DEFAULT true;

-- Add index for day availability queries (composite index for efficient filtering)
CREATE INDEX IF NOT EXISTS idx_cleaners_day_availability 
  ON cleaners(available_monday, available_tuesday, available_wednesday, 
              available_thursday, available_friday, available_saturday, available_sunday);

-- Add individual indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cleaners_available_monday ON cleaners(available_monday) WHERE available_monday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_tuesday ON cleaners(available_tuesday) WHERE available_tuesday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_wednesday ON cleaners(available_wednesday) WHERE available_wednesday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_thursday ON cleaners(available_thursday) WHERE available_thursday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_friday ON cleaners(available_friday) WHERE available_friday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_saturday ON cleaners(available_saturday) WHERE available_saturday = true;
CREATE INDEX IF NOT EXISTS idx_cleaners_available_sunday ON cleaners(available_sunday) WHERE available_sunday = true;

-- Add comments for documentation
COMMENT ON COLUMN cleaners.available_monday IS 'Whether cleaner works on Mondays';
COMMENT ON COLUMN cleaners.available_tuesday IS 'Whether cleaner works on Tuesdays';
COMMENT ON COLUMN cleaners.available_wednesday IS 'Whether cleaner works on Wednesdays';
COMMENT ON COLUMN cleaners.available_thursday IS 'Whether cleaner works on Thursdays';
COMMENT ON COLUMN cleaners.available_friday IS 'Whether cleaner works on Fridays';
COMMENT ON COLUMN cleaners.available_saturday IS 'Whether cleaner works on Saturdays';
COMMENT ON COLUMN cleaners.available_sunday IS 'Whether cleaner works on Sundays';

-- Verification query (uncomment to run after migration)
-- SELECT 
--   id, name, 
--   available_monday as mon, 
--   available_tuesday as tue, 
--   available_wednesday as wed, 
--   available_thursday as thu, 
--   available_friday as fri, 
--   available_saturday as sat, 
--   available_sunday as sun
-- FROM cleaners
-- LIMIT 5;

