-- FINAL FIX: Update images to match your ACTUAL filenames
-- Run this in Supabase SQL Editor

-- Fix Move In/Out Cleaning (you have: move-turnover.jpg)
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Fix Carpet Cleaning (you have: deep-specialty.jpg, NOT service-carpet-cleaning.jpg)
UPDATE services 
SET image_url = '/images/deep-specialty.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- Verify all images are correct
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN service_type = 'Standard' AND image_url = '/images/service-standard-cleaning.jpg' THEN '✅'
    WHEN service_type = 'Deep' AND image_url = '/images/service-deep-cleaning.jpg' THEN '✅'
    WHEN service_type = 'Airbnb' AND image_url = '/images/service-airbnb-cleaning.jpg' THEN '✅'
    WHEN service_type = 'Move In/Out' AND image_url = '/images/move-turnover.jpg' THEN '✅'
    WHEN service_type = 'Carpet' AND image_url = '/images/deep-specialty.jpg' THEN '✅'
    ELSE '❌ WRONG'
  END as status
FROM services
ORDER BY display_order;

