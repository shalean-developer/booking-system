-- Verify Services Setup
-- Run this to check if everything is configured correctly

-- 1. Check if services table exists and has data
SELECT 
  '✅ Services Table Status' as check_type,
  COUNT(*) as total_services,
  COUNT(*) FILTER (WHERE is_active = true) as active_services
FROM services;

-- 2. List all services
SELECT 
  service_type,
  display_name,
  icon,
  display_order,
  is_active,
  CASE 
    WHEN image_url IS NULL OR image_url = '' THEN '⚠️ Missing image'
    ELSE '✅ Has image'
  END as image_status
FROM services
ORDER BY display_order;

-- 3. Check pricing for each service
SELECT 
  s.service_type,
  s.display_name,
  s.display_order,
  s.is_active as service_active,
  COUNT(pc.id) FILTER (WHERE pc.price_type = 'base') as base_price_count,
  COUNT(pc.id) FILTER (WHERE pc.price_type = 'bedroom') as bedroom_price_count,
  COUNT(pc.id) FILTER (WHERE pc.price_type = 'bathroom') as bathroom_price_count,
  MAX(pc.price) FILTER (WHERE pc.price_type = 'base' AND pc.is_active = true) as base_price,
  CASE 
    WHEN COUNT(pc.id) FILTER (WHERE pc.price_type = 'base' AND pc.is_active = true) = 0 THEN '❌ Missing base price'
    ELSE '✅ Has pricing'
  END as pricing_status
FROM services s
LEFT JOIN pricing_config pc ON pc.service_type = s.service_type 
WHERE s.is_active = true
GROUP BY s.service_type, s.display_name, s.display_order, s.is_active
ORDER BY s.display_order;

-- 4. Check RLS policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual LIKE '%is_active%' THEN '✅ Public read policy'
    WHEN qual LIKE '%auth.uid%' THEN '✅ Admin policy'
    ELSE '⚠️ Check policy'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'services'
ORDER BY policyname;

-- 5. Test query (simulates what the API does)
SELECT 
  s.service_type,
  s.display_name,
  s.icon,
  s.image_url,
  s.display_order,
  pc_base.price as base_price
FROM services s
LEFT JOIN pricing_config pc_base ON pc_base.service_type = s.service_type 
  AND pc_base.price_type = 'base' 
  AND pc_base.is_active = true
WHERE s.is_active = true
ORDER BY s.display_order;

