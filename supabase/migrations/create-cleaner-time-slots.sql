-- Migration: Create cleaner time slots table and auto-booking trigger
-- Description: Track cleaner time slot bookings and automatically mark unavailable when assigned

-- Create cleaner_time_slots table
CREATE TABLE IF NOT EXISTS cleaner_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('booked', 'blocked', 'available')) DEFAULT 'booked',
  duration_hours DECIMAL(3,1) DEFAULT 3.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cleaner_id, date, time_slot)
);

-- Indexes for fast lookups
CREATE INDEX idx_cleaner_time_slots_cleaner ON cleaner_time_slots(cleaner_id);
CREATE INDEX idx_cleaner_time_slots_date ON cleaner_time_slots(date);
CREATE INDEX idx_cleaner_time_slots_status ON cleaner_time_slots(status);
CREATE INDEX idx_cleaner_time_slots_booking ON cleaner_time_slots(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_cleaner_time_slots_cleaner_date ON cleaner_time_slots(cleaner_id, date);

-- Table comment
COMMENT ON TABLE cleaner_time_slots IS 'Track cleaner availability by time slot - auto-populated when bookings are assigned';
COMMENT ON COLUMN cleaner_time_slots.status IS 'booked = has booking, blocked = admin blocked, available = open (not used much)';
COMMENT ON COLUMN cleaner_time_slots.duration_hours IS 'Estimated duration to block additional slots if needed';

-- Function to update cleaner time slots when booking is assigned
CREATE OR REPLACE FUNCTION update_cleaner_time_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- When a cleaner is assigned to a booking (new assignment or changed cleaner)
  IF NEW.cleaner_id IS NOT NULL AND (OLD.cleaner_id IS NULL OR OLD.cleaner_id != NEW.cleaner_id) THEN
    -- Mark time slot as booked for the new cleaner
    INSERT INTO cleaner_time_slots (cleaner_id, booking_id, date, time_slot, status)
    VALUES (NEW.cleaner_id, NEW.id, NEW.booking_date::date, NEW.booking_time::time, 'booked')
    ON CONFLICT (cleaner_id, date, time_slot) 
    DO UPDATE SET 
      booking_id = EXCLUDED.booking_id,
      status = 'booked',
      updated_at = NOW();
    
    -- If cleaner was changed (not just newly assigned), free up the old cleaner's slot
    IF OLD.cleaner_id IS NOT NULL AND OLD.cleaner_id != NEW.cleaner_id THEN
      DELETE FROM cleaner_time_slots 
      WHERE booking_id = OLD.id AND cleaner_id = OLD.cleaner_id;
    END IF;
  END IF;
  
  -- When cleaner is unassigned (set to null)
  IF NEW.cleaner_id IS NULL AND OLD.cleaner_id IS NOT NULL THEN
    -- Free up the time slot
    DELETE FROM cleaner_time_slots 
    WHERE booking_id = OLD.id;
  END IF;
  
  -- When booking is cancelled or completed, free up the slot
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status NOT IN ('cancelled', 'completed') AND NEW.cleaner_id IS NOT NULL THEN
    DELETE FROM cleaner_time_slots 
    WHERE booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_cleaner_time_slot ON bookings;
CREATE TRIGGER trigger_update_cleaner_time_slot
  AFTER INSERT OR UPDATE OF cleaner_id, status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_cleaner_time_slot();

-- Verification queries (uncomment to run after migration)
-- Check time slots table
-- SELECT * FROM cleaner_time_slots ORDER BY date DESC, time_slot LIMIT 10;

-- Check trigger works (create a test booking and see if slot is created)
-- SELECT c.name, cts.date, cts.time_slot, cts.status, b.id as booking_id
-- FROM cleaner_time_slots cts
-- JOIN cleaners c ON c.id = cts.cleaner_id
-- LEFT JOIN bookings b ON b.id = cts.booking_id
-- ORDER BY cts.date DESC, cts.time_slot
-- LIMIT 20;

