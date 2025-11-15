-- Add Carpet Cleaning Service
-- This migration adds Carpet Cleaning as a new service type

-- Step 1: Update the constraint in services table to allow 'Carpet' service type
ALTER TABLE services DROP CONSTRAINT IF EXISTS valid_service_type;
ALTER TABLE services ADD CONSTRAINT valid_service_type CHECK (
  service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet')
);

-- Step 2: Update the constraint in pricing_config table to allow 'Carpet' service type
ALTER TABLE pricing_config DROP CONSTRAINT IF EXISTS valid_service_type;
ALTER TABLE pricing_config ADD CONSTRAINT valid_service_type CHECK (
  service_type IS NULL OR 
  service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet')
);

-- Step 3: Insert Carpet Cleaning service metadata
INSERT INTO services (service_type, display_name, icon, image_url, display_order, description, is_active)
VALUES (
  'Carpet',
  'Carpet Cleaning',
  '🧹',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
  5,
  'Professional deep cleaning for carpets and rugs. Removes stains, odors, and deep-seated dirt',
  true
)
ON CONFLICT (service_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 4: Insert Carpet Cleaning pricing
-- Base price for carpet cleaning (per room/area)
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES
  -- Base price for carpet cleaning
  ('Carpet', 'base', NULL, 350.00, CURRENT_DATE, true, 'Initial pricing - Carpet cleaning base price per room'),
  -- Per bedroom rate (if applicable)
  ('Carpet', 'bedroom', NULL, 50.00, CURRENT_DATE, true, 'Initial pricing - Carpet cleaning per additional bedroom'),
  -- Per bathroom rate (if applicable) 
  ('Carpet', 'bathroom', NULL, 0.00, CURRENT_DATE, true, 'Initial pricing - Carpet cleaning bathroom rate (not typically applicable)')
ON CONFLICT DO NOTHING;

-- Verify the data
-- Check services table
SELECT 
  'Services Table' as table_name,
  service_type,
  display_name,
  display_order::text as info,
  is_active
FROM services
WHERE service_type = 'Carpet';

-- Check pricing_config table
SELECT 
  'Pricing Config Table' as table_name,
  service_type,
  price_type as display_name,
  price::text as info,
  is_active
FROM pricing_config
WHERE service_type = 'Carpet'
ORDER BY price_type;

