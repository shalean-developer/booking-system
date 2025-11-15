-- COMPLETE FIX: Update ALL service images to match your actual filenames
-- Run this in Supabase SQL Editor to fix all images at once

-- 1. Standard Cleaning -> service-standard-cleaning.jpg ✅
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- 2. Deep Cleaning -> service-deep-cleaning.jpg ✅
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- 3. Airbnb Cleaning -> service-airbnb-cleaning.jpg ✅
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- 4. Move In/Out Cleaning -> move-turnover.jpg ✅ (FIXED: was service-move-in-out-cleaning.jpg)
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- 5. Carpet Cleaning -> deep-specialty.jpg (temporary until you upload service-carpet-cleaning.jpg)
UPDATE services 
SET image_url = '/images/deep-specialty.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- VERIFY: Check all images are correct
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url = '/images/service-standard-cleaning.jpg' AND service_type = 'Standard' THEN '✅ Correct'
    WHEN image_url = '/images/service-deep-cleaning.jpg' AND service_type = 'Deep' THEN '✅ Correct'
    WHEN image_url = '/images/service-airbnb-cleaning.jpg' AND service_type = 'Airbnb' THEN '✅ Correct'
    WHEN image_url = '/images/move-turnover.jpg' AND service_type = 'Move In/Out' THEN '✅ Correct'
    WHEN image_url = '/images/deep-specialty.jpg' AND service_type = 'Carpet' THEN '✅ Correct (temp)'
    WHEN image_url LIKE '/images/%' THEN '⚠️ Wrong filename'
    WHEN image_url LIKE 'http%' THEN '⚠️ External URL'
    ELSE '❌ No image'
  END as status
FROM services
ORDER BY display_order;

