-- Update Service Images to Use Local Images
-- This updates the image_url field in the services table to use local images

-- Update Standard Cleaning
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- Update Deep Cleaning
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- Update Airbnb Cleaning
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- Update Move In/Out Cleaning (using your actual filename)
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Update Carpet Cleaning
UPDATE services 
SET image_url = '/images/service-carpet-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- Verify the updates
SELECT 
  service_type,
  display_name,
  image_url,
  updated_at
FROM services
ORDER BY display_order;

