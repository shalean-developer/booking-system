-- Update Service Images to Use Local Uploaded Images
-- Run this after uploading your images to public/images/

-- Update Standard Cleaning (you have: service-standard-cleaning.jpg)
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- Update Deep Cleaning (you have: service-deep-cleaning.jpg)
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- Update Airbnb Cleaning (you have: service-airbnb-cleaning.jpg)
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- Update Move In/Out Cleaning (upload as: service-move-in-out-cleaning.jpg)
UPDATE services 
SET image_url = '/images/service-move-in-out-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Update Carpet Cleaning (upload as: service-carpet-cleaning.jpg)
UPDATE services 
SET image_url = '/images/service-carpet-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- Verify the updates
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url LIKE '/images/%' THEN '✅ Using local image'
    WHEN image_url LIKE 'http%' THEN '⚠️ Using external URL'
    ELSE '❌ No image set'
  END as image_status
FROM services
ORDER BY display_order;

