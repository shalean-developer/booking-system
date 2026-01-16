-- ============================================
-- ADD CLEANER COMPLETION RATE (RELIABILITY)
-- ============================================
-- This migration adds completion_rate to cleaners table and creates
-- triggers to automatically update it when bookings change
-- ============================================

-- Step 1: Add completion_rate column to cleaners table
ALTER TABLE cleaners 
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5, 2) DEFAULT 0.00;

COMMENT ON COLUMN cleaners.completion_rate IS 'Percentage of completed bookings (0-100). Calculated as (completed / total) * 100';

-- Step 2: Create function to calculate completion rate for a cleaner
-- Note: cleaner_id in bookings is TEXT (can be UUID string or 'manual')
CREATE OR REPLACE FUNCTION calculate_cleaner_completion_rate(cleaner_uuid UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  total_bookings INTEGER;
  completed_bookings INTEGER;
  completion_rate DECIMAL(5, 2);
  cleaner_id_text TEXT;
BEGIN
  -- Convert UUID to TEXT for matching with bookings.cleaner_id
  cleaner_id_text := cleaner_uuid::TEXT;
  
  -- Get total bookings for this cleaner (exclude cancelled)
  SELECT COUNT(*) INTO total_bookings
  FROM bookings
  WHERE cleaner_id = cleaner_id_text
    AND status != 'cancelled';
  
  -- If no bookings, return 0
  IF total_bookings = 0 THEN
    RETURN 0.00;
  END IF;
  
  -- Get completed bookings
  SELECT COUNT(*) INTO completed_bookings
  FROM bookings
  WHERE cleaner_id = cleaner_id_text
    AND status = 'completed';
  
  -- Calculate completion rate as percentage
  completion_rate := ROUND((completed_bookings::DECIMAL / total_bookings::DECIMAL) * 100, 2);
  
  RETURN completion_rate;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to update completion rate for a cleaner
CREATE OR REPLACE FUNCTION update_cleaner_completion_rate()
RETURNS TRIGGER AS $$
DECLARE
  affected_cleaner_id_text TEXT;
  affected_cleaner_id_uuid UUID;
BEGIN
  -- Get the cleaner_id from the booking (either NEW or OLD)
  -- cleaner_id in bookings is TEXT (can be UUID string or 'manual')
  IF TG_OP = 'DELETE' THEN
    affected_cleaner_id_text := OLD.cleaner_id;
  ELSE
    affected_cleaner_id_text := NEW.cleaner_id;
  END IF;
  
  -- Only update if cleaner_id is valid (not NULL, not 'manual', and is a valid UUID)
  IF affected_cleaner_id_text IS NOT NULL 
     AND affected_cleaner_id_text != 'manual'
     AND affected_cleaner_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    
    -- Convert TEXT to UUID
    BEGIN
      affected_cleaner_id_uuid := affected_cleaner_id_text::UUID;
      
      -- Update the cleaner's completion_rate
      UPDATE cleaners
      SET completion_rate = calculate_cleaner_completion_rate(affected_cleaner_id_uuid),
          updated_at = NOW()
      WHERE id = affected_cleaner_id_uuid;
    EXCEPTION WHEN OTHERS THEN
      -- If UUID conversion fails, skip this update
      NULL;
    END;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create triggers to update completion_rate when bookings change
-- Trigger for INSERT
DROP TRIGGER IF EXISTS update_cleaner_completion_rate_on_insert ON bookings;
CREATE TRIGGER update_cleaner_completion_rate_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.cleaner_id IS NOT NULL AND NEW.cleaner_id != 'manual')
  EXECUTE FUNCTION update_cleaner_completion_rate();

-- Trigger for UPDATE (when status or cleaner_id changes)
DROP TRIGGER IF EXISTS update_cleaner_completion_rate_on_update ON bookings;
CREATE TRIGGER update_cleaner_completion_rate_on_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (
    (OLD.status IS DISTINCT FROM NEW.status) OR
    (OLD.cleaner_id IS DISTINCT FROM NEW.cleaner_id)
  )
  EXECUTE FUNCTION update_cleaner_completion_rate();

-- Trigger for DELETE
DROP TRIGGER IF EXISTS update_cleaner_completion_rate_on_delete ON bookings;
CREATE TRIGGER update_cleaner_completion_rate_on_delete
  AFTER DELETE ON bookings
  FOR EACH ROW
  WHEN (OLD.cleaner_id IS NOT NULL AND OLD.cleaner_id != 'manual')
  EXECUTE FUNCTION update_cleaner_completion_rate();

-- Step 5: Backfill completion_rate for existing cleaners
UPDATE cleaners c
SET completion_rate = calculate_cleaner_completion_rate(c.id),
    updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM bookings b 
  WHERE b.cleaner_id = c.id::TEXT 
    AND b.status != 'cancelled'
);

-- Step 6: Create index for performance (if querying by completion_rate)
CREATE INDEX IF NOT EXISTS idx_cleaners_completion_rate 
ON cleaners(completion_rate) 
WHERE completion_rate IS NOT NULL;

-- Step 7: Add helpful comments
COMMENT ON FUNCTION calculate_cleaner_completion_rate IS 'Calculates completion rate (0-100) for a cleaner based on their bookings';
COMMENT ON FUNCTION update_cleaner_completion_rate IS 'Trigger function to update cleaner completion_rate when bookings change';

-- ============================================
-- Migration Complete! ✅
-- ============================================
-- 
-- What this migration does:
-- 1. Adds completion_rate column to cleaners table
-- 2. Creates function to calculate completion rate
-- 3. Creates triggers to auto-update completion_rate when bookings change
-- 4. Backfills existing data
-- 5. Creates index for performance
--
-- The completion_rate will now be automatically maintained whenever:
-- - A booking is assigned to a cleaner (INSERT)
-- - A booking status changes (UPDATE)
-- - A booking is deleted (DELETE)
-- ============================================
