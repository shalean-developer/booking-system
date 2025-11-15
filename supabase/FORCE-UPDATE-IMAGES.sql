-- FORCE UPDATE: Replace ALL external URLs with your local images
-- This will update ALL services regardless of current value

-- 1. Standard Cleaning
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- 2. Deep Cleaning  
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- 3. Airbnb Cleaning
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- 4. Move In/Out Cleaning
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- 5. Carpet Cleaning 
-- If you have service-carpet-cleaning.jpg, use that. Otherwise use deep-specialty.jpg temporarily
UPDATE services 
SET image_url = '/images/deep-specialty.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';
-- If you upload service-carpet-cleaning.jpg, change the line above to:
-- SET image_url = '/images/service-carpet-cleaning.jpg',

-- VERIFY: Show what's in database NOW
SELECT 
  service_type,
  display_name,
  image_url,
  updated_at,
  CASE 
    WHEN image_url LIKE '/images/%' THEN '✅ Local image'
    WHEN image_url LIKE 'http%' THEN '⚠️ EXTERNAL URL - Still old!'
    WHEN image_url IS NULL OR image_url = '' THEN '❌ No image'
    ELSE '❓ Unknown'
  END as status
FROM services
ORDER BY display_order;

