-- FIX: Update Move In/Out Cleaning to use the correct filename
-- Your file is named: move-turnover.jpg (NOT service-move-in-out-cleaning.jpg)

UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Verify the fix
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url = '/images/move-turnover.jpg' THEN '✅ Correct filename'
    WHEN image_url LIKE '/images/%' THEN '⚠️ Wrong filename'
    WHEN image_url LIKE 'http%' THEN '⚠️ External URL'
    ELSE '❌ No image'
  END as status
FROM services
WHERE service_type = 'Move In/Out';

