-- Diagnostic query to check services and pricing data
-- Run this to see what's in your database

-- Check services table
SELECT 
  'Services Table' as source,
  service_type,
  display_name,
  icon,
  image_url,
  display_order,
  is_active,
  created_at
FROM services
ORDER BY display_order;

-- Check pricing_config table for services
SELECT 
  'Pricing Config Table' as source,
  service_type,
  price_type,
  price,
  is_active,
  effective_date,
  end_date
FROM pricing_config
WHERE service_type IS NOT NULL
ORDER BY service_type, price_type;

-- Check if services have matching pricing
SELECT 
  s.service_type,
  s.display_name,
  s.is_active as service_active,
  COUNT(pc.id) as pricing_records_count,
  BOOL_OR(pc.is_active) as has_active_pricing
FROM services s
LEFT JOIN pricing_config pc ON pc.service_type = s.service_type 
  AND pc.price_type = 'base'
  AND pc.is_active = true
WHERE s.is_active = true
GROUP BY s.service_type, s.display_name, s.is_active
ORDER BY s.display_order;

