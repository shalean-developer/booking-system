-- IMMEDIATE FIX: Update Service Images to Use Your Uploaded Images
-- Run this SQL in Supabase to replace Unsplash URLs with your local images

-- Step 1: Update Standard Cleaning
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Standard';

-- Step 2: Update Deep Cleaning  
UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Deep';

-- Step 3: Update Airbnb Cleaning
UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Airbnb';

-- Step 4: Update Move In/Out Cleaning (using your actual filename)
UPDATE services 
SET image_url = '/images/move-turnover.jpg',
    updated_at = NOW()
WHERE service_type = 'Move In/Out';

-- Step 5: Update Carpet Cleaning
-- NOTE: You don't have this image yet. Upload it as service-carpet-cleaning.jpg
-- For now, keeping existing image or you can upload one
UPDATE services 
SET image_url = '/images/service-carpet-cleaning.jpg',
    updated_at = NOW()
WHERE service_type = 'Carpet';

-- Step 6: Verify what's in the database now
SELECT 
  service_type,
  display_name,
  image_url,
  CASE 
    WHEN image_url LIKE '/images/%' THEN '✅ Local image'
    WHEN image_url LIKE 'http%' THEN '⚠️ External URL (needs update)'
    WHEN image_url IS NULL OR image_url = '' THEN '❌ No image'
    ELSE '❓ Unknown'
  END as status
FROM services
ORDER BY display_order;

