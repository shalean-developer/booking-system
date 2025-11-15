-- QUICK FIX: Fix the two images that are failing
-- Run this in Supabase SQL Editor NOW

-- Fix 1: Move In/Out Cleaning -> use move-turnover.jpg (NOT service-move-in-out-cleaning.jpg)
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Fix 2: Carpet Cleaning -> use deep-specialty.jpg (NOT service-carpet-cleaning.jpg)
UPDATE services 
SET image_url = '/images/deep-specialty.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- Verify the fixes
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN service_type = 'Move In/Out' AND image_url = '/images/move-turnover.jpg' THEN '✅ FIXED'
    WHEN service_type = 'Carpet' AND image_url = '/images/deep-specialty.jpg' THEN '✅ FIXED'
    ELSE '❌ Still wrong'
  END as status
FROM services
WHERE service_type IN ('Move In/Out', 'Carpet');

