-- ============================================
-- ADD CLEANER EXPERIENCE TRACKING
-- ============================================
-- This migration adds hire_date to cleaners table and creates
-- helper functions for experience-based commission calculation
-- ============================================

-- Add hire_date to cleaners table
ALTER TABLE cleaners 
ADD COLUMN IF NOT EXISTS hire_date DATE;

COMMENT ON COLUMN cleaners.hire_date IS 'Date when cleaner was hired/started working';

-- Set default hire_date for existing cleaners (use created_at)
UPDATE cleaners
SET hire_date = created_at::DATE
WHERE hire_date IS NULL;

-- Helper function to calculate experience months
CREATE OR REPLACE FUNCTION get_cleaner_experience_months(cleaner_hire_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, cleaner_hire_date)) * 12 
       + EXTRACT(MONTH FROM AGE(CURRENT_DATE, cleaner_hire_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to get commission rate
CREATE OR REPLACE FUNCTION get_cleaner_commission_rate(cleaner_hire_date DATE)
RETURNS NUMERIC AS $$
DECLARE
  experience_months INTEGER;
BEGIN
  experience_months := get_cleaner_experience_months(cleaner_hire_date);
  
  IF experience_months >= 4 THEN
    RETURN 0.70; -- 70% for 4+ months
  ELSE
    RETURN 0.60; -- 60% for less than 4 months
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verify the functions work
SELECT 
  name,
  hire_date,
  get_cleaner_experience_months(hire_date) as experience_months,
  get_cleaner_commission_rate(hire_date) as commission_rate,
  CASE 
    WHEN get_cleaner_commission_rate(hire_date) >= 0.70 THEN 'Experienced (70%)'
    ELSE 'New (60%)'
  END as experience_level
FROM cleaners
ORDER BY hire_date;

