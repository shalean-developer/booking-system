-- ============================================
-- DIAGNOSE PRICING ISSUE
-- ============================================
-- This script checks current pricing values in the database
-- and compares them against expected values from lib/pricing.ts
-- ============================================

-- Expected values from lib/pricing.ts:
-- Standard: base R250, bedroom R20, bathroom R30
-- Deep: base R1200, bedroom R180, bathroom R250
-- Move In/Out: base R980, bedroom R160, bathroom R220
-- Airbnb: base R230, bedroom R18, bathroom R26
-- Service Fee: R50

-- Check Standard Cleaning Prices
SELECT 
  'Standard Cleaning Prices' as section,
  price_type,
  price as current_price,
  CASE price_type
    WHEN 'base' THEN 250.00
    WHEN 'bedroom' THEN 20.00
    WHEN 'bathroom' THEN 30.00
  END as expected_price,
  CASE 
    WHEN price_type = 'base' AND price != 250.00 THEN '❌ INCORRECT'
    WHEN price_type = 'bedroom' AND price != 20.00 THEN '❌ INCORRECT'
    WHEN price_type = 'bathroom' AND price != 30.00 THEN '❌ INCORRECT'
    ELSE '✅ CORRECT'
  END as status,
  is_active,
  effective_date,
  end_date
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

-- Check Service Fee
SELECT 
  'Service Fee' as section,
  price as current_price,
  50.00 as expected_price,
  CASE 
    WHEN price != 50.00 THEN '❌ INCORRECT'
    ELSE '✅ CORRECT'
  END as status,
  is_active,
  effective_date,
  end_date
FROM pricing_config
WHERE price_type = 'service_fee'
  AND is_active = true;

-- Check All Service Types for Comparison
SELECT 
  'All Service Types Overview' as section,
  service_type,
  price_type,
  price,
  is_active
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

-- Summary: Count active pricing records by type
SELECT 
  'Summary' as section,
  price_type,
  COUNT(*) as active_records,
  CASE 
    WHEN price_type = 'base' THEN COUNT(*) FILTER (WHERE service_type = 'Standard')
    WHEN price_type = 'bedroom' THEN COUNT(*) FILTER (WHERE service_type = 'Standard')
    WHEN price_type = 'bathroom' THEN COUNT(*) FILTER (WHERE service_type = 'Standard')
    WHEN price_type = 'service_fee' THEN COUNT(*)
    ELSE 0
  END as standard_count
FROM pricing_config
WHERE is_active = true
  AND (
    (price_type IN ('base', 'bedroom', 'bathroom') AND service_type = 'Standard')
    OR price_type = 'service_fee'
  )
GROUP BY price_type
ORDER BY price_type;

-- Check for potential issues: Standard prices matching Deep prices
SELECT 
  '⚠️ POTENTIAL ISSUE DETECTED' as warning,
  'Standard prices matching Deep prices' as issue,
  pc1.price_type,
  pc1.price as standard_price,
  pc2.price as deep_price,
  CASE 
    WHEN pc1.price = pc2.price THEN '❌ MATCH - This is likely the problem!'
    ELSE '✅ Different'
  END as status
FROM pricing_config pc1
JOIN pricing_config pc2 
  ON pc1.price_type = pc2.price_type
WHERE pc1.service_type = 'Standard'
  AND pc2.service_type = 'Deep'
  AND pc1.is_active = true
  AND pc2.is_active = true
  AND pc1.price_type IN ('base', 'bedroom', 'bathroom');

