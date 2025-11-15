-- ============================================
-- FIX STANDARD CLEANING PRICING
-- ============================================
-- This migration fixes incorrect Standard cleaning prices in the database
-- Expected: base R250, bedroom R20, bathroom R30
-- Also fixes service fee if it's R40 (should be R50)
-- ============================================

BEGIN;

-- Step 1: Log current incorrect Standard cleaning prices to history before deactivating
-- (This captures the old incorrect values for audit trail)
INSERT INTO pricing_history (
  pricing_config_id,
  service_type,
  price_type,
  item_name,
  old_price,
  new_price,
  changed_by,
  changed_at,
  change_reason,
  effective_date,
  end_date
)
SELECT 
  id,
  service_type,
  price_type,
  item_name,
  price as old_price,
  NULL as new_price, -- Will be set when new record is created
  created_by,
  NOW(),
  'Deactivated incorrect Standard cleaning prices - fixing to correct values',
  effective_date,
  CURRENT_DATE - INTERVAL '1 day' -- Set end_date to yesterday
FROM pricing_config
WHERE service_type = 'Standard'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true;

-- Step 2: Deactivate current incorrect Standard cleaning prices
UPDATE pricing_config
SET 
  is_active = false,
  end_date = CURRENT_DATE - INTERVAL '1 day',
  updated_at = NOW(),
  notes = COALESCE(notes || ' | ', '') || 'Deactivated - incorrect pricing fixed on ' || CURRENT_DATE
WHERE service_type = 'Standard'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true;

-- Step 3: Insert correct Standard cleaning prices
INSERT INTO pricing_config (
  service_type,
  price_type,
  item_name,
  price,
  effective_date,
  is_active,
  notes
)
VALUES
  ('Standard', 'base', NULL, 250.00, CURRENT_DATE, true, 'Fixed Standard base price - corrected from incorrect value'),
  ('Standard', 'bedroom', NULL, 20.00, CURRENT_DATE, true, 'Fixed Standard bedroom price - corrected from incorrect value'),
  ('Standard', 'bathroom', NULL, 30.00, CURRENT_DATE, true, 'Fixed Standard bathroom price - corrected from incorrect value')
ON CONFLICT DO NOTHING; -- Idempotent: won't insert if already exists

-- Step 4: Log the new correct prices to history
INSERT INTO pricing_history (
  pricing_config_id,
  service_type,
  price_type,
  item_name,
  old_price,
  new_price,
  changed_by,
  changed_at,
  change_reason,
  effective_date
)
SELECT 
  id,
  service_type,
  price_type,
  item_name,
  NULL as old_price, -- New record, no old price
  price as new_price,
  created_by,
  NOW(),
  'Fixed Standard cleaning prices - set to correct values',
  effective_date
FROM pricing_config
WHERE service_type = 'Standard'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
  AND effective_date = CURRENT_DATE;

-- Step 5: Fix service fee if it's incorrect (R40 instead of R50)
-- First, log the old service fee to history if it needs to be changed
INSERT INTO pricing_history (
  pricing_config_id,
  service_type,
  price_type,
  item_name,
  old_price,
  new_price,
  changed_by,
  changed_at,
  change_reason,
  effective_date,
  end_date
)
SELECT 
  id,
  service_type,
  price_type,
  item_name,
  price as old_price,
  50.00 as new_price,
  created_by,
  NOW(),
  'Fixed service fee - corrected from R40 to R50',
  effective_date,
  CURRENT_DATE - INTERVAL '1 day'
FROM pricing_config
WHERE price_type = 'service_fee'
  AND is_active = true
  AND price != 50.00;

-- Deactivate incorrect service fee
UPDATE pricing_config
SET 
  is_active = false,
  end_date = CURRENT_DATE - INTERVAL '1 day',
  updated_at = NOW(),
  notes = COALESCE(notes || ' | ', '') || 'Deactivated - service fee fixed to R50 on ' || CURRENT_DATE
WHERE price_type = 'service_fee'
  AND is_active = true
  AND price != 50.00;

-- Insert correct service fee if it doesn't exist or was incorrect
INSERT INTO pricing_config (
  service_type,
  price_type,
  item_name,
  price,
  effective_date,
  is_active,
  notes
)
VALUES
  (NULL, 'service_fee', NULL, 50.00, CURRENT_DATE, true, 'Fixed service fee - corrected to R50')
ON CONFLICT DO NOTHING; -- Idempotent

-- Log the new correct service fee to history
INSERT INTO pricing_history (
  pricing_config_id,
  service_type,
  price_type,
  item_name,
  old_price,
  new_price,
  changed_by,
  changed_at,
  change_reason,
  effective_date
)
SELECT 
  id,
  service_type,
  price_type,
  item_name,
  NULL as old_price,
  price as new_price,
  created_by,
  NOW(),
  'Fixed service fee - set to R50',
  effective_date
FROM pricing_config
WHERE price_type = 'service_fee'
  AND is_active = true
  AND effective_date = CURRENT_DATE
  AND price = 50.00;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify the fix was successful

-- Verify Standard Cleaning Prices
SELECT 
  '✅ Standard Cleaning Prices Verification' as verification,
  price_type,
  price as current_price,
  CASE price_type
    WHEN 'base' THEN 250.00
    WHEN 'bedroom' THEN 20.00
    WHEN 'bathroom' THEN 30.00
  END as expected_price,
  CASE 
    WHEN price_type = 'base' AND price = 250.00 THEN '✅ CORRECT'
    WHEN price_type = 'bedroom' AND price = 20.00 THEN '✅ CORRECT'
    WHEN price_type = 'bathroom' AND price = 30.00 THEN '✅ CORRECT'
    ELSE '❌ STILL INCORRECT'
  END as status
FROM pricing_config
WHERE service_type = 'Standard'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
  END;

-- Verify Service Fee
SELECT 
  '✅ Service Fee Verification' as verification,
  price as current_price,
  50.00 as expected_price,
  CASE 
    WHEN price = 50.00 THEN '✅ CORRECT'
    ELSE '❌ STILL INCORRECT'
  END as status
FROM pricing_config
WHERE price_type = 'service_fee'
  AND is_active = true;

-- Verify All Service Types (to ensure we didn't break anything)
SELECT 
  '✅ All Service Types Overview' as verification,
  service_type,
  price_type,
  price,
  is_active,
  effective_date
FROM pricing_config
WHERE service_type IS NOT NULL
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
ORDER BY 
  service_type,
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
  END;

-- Verify Deep Cleaning Prices
SELECT 
  '✅ Deep Cleaning Prices Verification' as verification,
  price_type,
  price as current_price,
  CASE price_type
    WHEN 'base' THEN 1200.00
    WHEN 'bedroom' THEN 180.00
    WHEN 'bathroom' THEN 250.00
  END as expected_price,
  CASE 
    WHEN price_type = 'base' AND price = 1200.00 THEN '✅ CORRECT'
    WHEN price_type = 'bedroom' AND price = 180.00 THEN '✅ CORRECT'
    WHEN price_type = 'bathroom' AND price = 250.00 THEN '✅ CORRECT'
    ELSE '❌ INCORRECT'
  END as status
FROM pricing_config
WHERE service_type = 'Deep'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
  END;

-- Verify Move In/Out Cleaning Prices
SELECT 
  '✅ Move In/Out Cleaning Prices Verification' as verification,
  price_type,
  price as current_price,
  CASE price_type
    WHEN 'base' THEN 980.00
    WHEN 'bedroom' THEN 160.00
    WHEN 'bathroom' THEN 220.00
  END as expected_price,
  CASE 
    WHEN price_type = 'base' AND price = 980.00 THEN '✅ CORRECT'
    WHEN price_type = 'bedroom' AND price = 160.00 THEN '✅ CORRECT'
    WHEN price_type = 'bathroom' AND price = 220.00 THEN '✅ CORRECT'
    ELSE '❌ INCORRECT'
  END as status
FROM pricing_config
WHERE service_type = 'Move In/Out'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
  END;

-- Verify Airbnb Cleaning Prices
SELECT 
  '✅ Airbnb Cleaning Prices Verification' as verification,
  price_type,
  price as current_price,
  CASE price_type
    WHEN 'base' THEN 230.00
    WHEN 'bedroom' THEN 18.00
    WHEN 'bathroom' THEN 26.00
  END as expected_price,
  CASE 
    WHEN price_type = 'base' AND price = 230.00 THEN '✅ CORRECT'
    WHEN price_type = 'bedroom' AND price = 18.00 THEN '✅ CORRECT'
    WHEN price_type = 'bathroom' AND price = 26.00 THEN '✅ CORRECT'
    ELSE '❌ INCORRECT'
  END as status
FROM pricing_config
WHERE service_type = 'Airbnb'
  AND price_type IN ('base', 'bedroom', 'bathroom')
  AND is_active = true
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
  END;

-- Expected values summary:
-- Standard: base R250, bedroom R20, bathroom R30 ✅
-- Deep: base R1200, bedroom R180, bathroom R250 ✅
-- Move In/Out: base R980, bedroom R160, bathroom R220 ✅
-- Airbnb: base R230, bedroom R18, bathroom R26 ✅

-- Summary of changes
SELECT 
  '📊 Summary' as summary,
  COUNT(*) FILTER (WHERE service_type = 'Standard' AND is_active = true) as standard_active_records,
  COUNT(*) FILTER (WHERE price_type = 'service_fee' AND is_active = true AND price = 50.00) as service_fee_correct,
  COUNT(*) FILTER (WHERE service_type = 'Standard' AND is_active = false) as standard_deactivated_records
FROM pricing_config
WHERE (service_type = 'Standard' OR price_type = 'service_fee');

-- Show recent pricing history entries for Standard cleaning
SELECT 
  '📜 Recent Pricing History' as history,
  service_type,
  price_type,
  old_price,
  new_price,
  change_reason,
  changed_at
FROM pricing_history
WHERE service_type = 'Standard'
  OR (price_type = 'service_fee' AND changed_at >= CURRENT_DATE - INTERVAL '1 day')
ORDER BY changed_at DESC
LIMIT 10;

