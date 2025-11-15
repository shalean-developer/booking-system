-- Check what image URLs are currently in the database
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url LIKE '/images/%' THEN '✅ Local image'
    WHEN image_url LIKE 'http%' THEN '⚠️ External URL (OLD - needs update)'
    WHEN image_url IS NULL OR image_url = '' THEN '❌ No image'
    ELSE '❓ Unknown'
  END as status
FROM services
ORDER BY display_order;

