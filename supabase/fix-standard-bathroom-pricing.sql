-- Fix incorrect Standard bathroom pricing in database
-- Issue: Standard bathroom price is R2000 instead of R30

-- Step 1: Find the incorrect pricing record
SELECT 
  id,
  service_type,
  price_type,
  price,
  effective_date,
  end_date,
  is_active
FROM pricing_config
WHERE service_type = 'Standard' 
  AND price_type = 'bathroom'
  AND is_active = true
ORDER BY effective_date DESC;

-- Step 2: Deactivate the incorrect record(s)
-- This will set is_active = false and end_date = today
UPDATE pricing_config
SET 
  is_active = false,
  end_date = CURRENT_DATE,
  updated_at = NOW()
WHERE service_type = 'Standard' 
  AND price_type = 'bathroom'
  AND price > 100  -- Only deactivate if price is suspiciously high (> R100)
  AND is_active = true;

-- Step 3: Insert correct Standard bathroom pricing
INSERT INTO pricing_config (
  service_type,
  price_type,
  price,
  effective_date,
  is_active
) VALUES (
  'Standard',
  'bathroom',
  30.00,
  CURRENT_DATE,
  true
)
ON CONFLICT DO NOTHING;

-- Step 4: Verify the fix
SELECT 
  service_type,
  price_type,
  price,
  effective_date,
  is_active
FROM pricing_config
WHERE service_type = 'Standard' 
  AND price_type = 'bathroom'
  AND is_active = true
ORDER BY effective_date DESC;

-- Step 5: Clear any pricing cache (if using application-level caching)
-- Note: The application will automatically clear cache on next fetch

-- Optional: Fix other Standard service pricing if needed
-- Check if base and bedroom prices are correct
SELECT 
  service_type,
  price_type,
  price,
  effective_date,
  is_active
FROM pricing_config
WHERE service_type = 'Standard' 
  AND is_active = true
ORDER BY price_type, effective_date DESC;

-- If base price is wrong (should be R250):
-- UPDATE pricing_config
-- SET is_active = false, end_date = CURRENT_DATE, updated_at = NOW()
-- WHERE service_type = 'Standard' AND price_type = 'base' AND price != 250 AND is_active = true;
-- 
-- INSERT INTO pricing_config (service_type, price_type, price, effective_date, is_active)
-- VALUES ('Standard', 'base', 250.00, CURRENT_DATE, true);

-- If bedroom price is wrong (should be R20):
-- UPDATE pricing_config
-- SET is_active = false, end_date = CURRENT_DATE, updated_at = NOW()
-- WHERE service_type = 'Standard' AND price_type = 'bedroom' AND price != 20 AND is_active = true;
-- 
-- INSERT INTO pricing_config (service_type, price_type, price, effective_date, is_active)
-- VALUES ('Standard', 'bedroom', 20.00, CURRENT_DATE, true);

