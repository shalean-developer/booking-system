-- Update ALL service images to use YOUR uploaded images from public/images/
-- Run this SQL in Supabase SQL Editor

-- 1. Standard Cleaning -> service-standard-cleaning.jpg
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- 2. Deep Cleaning -> service-deep-cleaning.jpg  
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- 3. Airbnb Cleaning -> service-airbnb-cleaning.jpg
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- 4. Move In/Out Cleaning -> move-turnover.jpg
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- 5. Carpet Cleaning -> Check if you have this image, otherwise comment out
-- If you don't have service-carpet-cleaning.jpg, you can use deep-specialty.jpg temporarily
-- Or upload a carpet cleaning image first
UPDATE services 
SET image_url = '/images/service-carpet-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- VERIFY: Check what was updated
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url LIKE '/images/%' THEN '✅ Local image'
    WHEN image_url LIKE 'http%' THEN '⚠️ External URL (STILL OLD!)'
    WHEN image_url IS NULL OR image_url = '' THEN '❌ No image'
    ELSE '❓ Unknown'
  END as status
FROM services
ORDER BY display_order;

