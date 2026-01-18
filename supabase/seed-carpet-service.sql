-- Seed Carpet Cleaning Service
-- This script safely adds Carpet Cleaning service if it doesn't exist
-- Can be run multiple times safely (idempotent)

-- Step 1: Update the constraint in services table to allow 'Carpet' service type (if needed)
DO $$
BEGIN
  -- Check if constraint exists and needs updating
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_service_type' 
    AND table_name = 'services'
  ) THEN
    -- Drop and recreate constraint to include Carpet
    ALTER TABLE services DROP CONSTRAINT IF EXISTS valid_service_type;
    ALTER TABLE services ADD CONSTRAINT valid_service_type CHECK (
      service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet')
    );
    RAISE NOTICE 'Updated services table constraint to include Carpet';
  END IF;
END $$;

-- Step 2: Update the constraint in pricing_config table to allow 'Carpet' service type (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_service_type' 
    AND table_name = 'pricing_config'
  ) THEN
    ALTER TABLE pricing_config DROP CONSTRAINT IF EXISTS valid_service_type;
    ALTER TABLE pricing_config ADD CONSTRAINT valid_service_type CHECK (
      service_type IS NULL OR 
      service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet')
    );
    RAISE NOTICE 'Updated pricing_config table constraint to include Carpet';
  END IF;
END $$;

-- Step 3: Insert or Update Carpet Cleaning service metadata
INSERT INTO services (service_type, display_name, icon, image_url, display_order, description, is_active)
VALUES (
  'Carpet',
  'Carpet Cleaning',
  '🧹',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
  5,
  'Deep extraction & refreshing',
  true
)
ON CONFLICT (service_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 4: Insert Carpet Cleaning pricing (only if it doesn't exist)
-- Base price for carpet cleaning
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
SELECT 'Carpet', 'base', NULL, 150.00, CURRENT_DATE, true, 'Base price for carpet cleaning service'
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_config 
  WHERE service_type = 'Carpet' 
  AND price_type = 'base' 
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Per fitted carpet room rate
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
SELECT 'Carpet', 'bedroom', NULL, 300.00, CURRENT_DATE, true, 'Price per fitted carpet room'
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_config 
  WHERE service_type = 'Carpet' 
  AND price_type = 'bedroom' 
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Per loose carpet/rug rate
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
SELECT 'Carpet', 'bathroom', NULL, 200.00, CURRENT_DATE, true, 'Price per loose carpet/rug'
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_config 
  WHERE service_type = 'Carpet' 
  AND price_type = 'bathroom' 
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Property move fee (extra person charge)
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
SELECT 'Carpet', 'extra', 'property_move', 250.00, CURRENT_DATE, true, 'Extra charge when property needs to be moved (extra person)'
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_config 
  WHERE service_type = 'Carpet' 
  AND price_type = 'extra' 
  AND item_name = 'property_move'
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Step 5: Ensure service_scheduling_limits entry exists for Carpet
INSERT INTO service_scheduling_limits (service_type, max_bookings_per_date, uses_teams, surge_pricing_enabled, surge_threshold, surge_percentage)
SELECT 'Carpet', 10, false, false, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM service_scheduling_limits WHERE service_type = 'Carpet'
)
ON CONFLICT (service_type) DO UPDATE SET
  max_bookings_per_date = EXCLUDED.max_bookings_per_date,
  uses_teams = EXCLUDED.uses_teams,
  surge_pricing_enabled = EXCLUDED.surge_pricing_enabled,
  surge_threshold = EXCLUDED.surge_threshold,
  surge_percentage = EXCLUDED.surge_percentage,
  updated_at = NOW();

-- Step 6: Verify the data was inserted correctly
DO $$
DECLARE
  service_count INTEGER;
  pricing_count INTEGER;
  limits_count INTEGER;
BEGIN
  -- Check services table
  SELECT COUNT(*) INTO service_count
  FROM services
  WHERE service_type = 'Carpet' AND is_active = true;
  
  -- Check pricing_config table
  SELECT COUNT(*) INTO pricing_count
  FROM pricing_config
  WHERE service_type = 'Carpet' 
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  -- Check service_scheduling_limits table
  SELECT COUNT(*) INTO limits_count
  FROM service_scheduling_limits
  WHERE service_type = 'Carpet';
  
  RAISE NOTICE '=== Carpet Service Seed Results ===';
  RAISE NOTICE 'Services entry: %', CASE WHEN service_count > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Pricing entries: % (expected 4)', pricing_count;
  RAISE NOTICE 'Scheduling limits entry: %', CASE WHEN limits_count > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  
  IF service_count = 0 THEN
    RAISE EXCEPTION 'Carpet service was not created. Please check the error messages above.';
  END IF;
  
  IF pricing_count < 4 THEN
    RAISE WARNING 'Expected 4 pricing entries for Carpet, found %. Some pricing may be missing.', pricing_count;
  END IF;
END $$;

-- Display final verification
SELECT 
  '✅ Carpet Service Seed Complete' as status,
  (SELECT COUNT(*) FROM services WHERE service_type = 'Carpet' AND is_active = true) as services_count,
  (SELECT COUNT(*) FROM pricing_config WHERE service_type = 'Carpet' AND is_active = true) as pricing_count,
  (SELECT COUNT(*) FROM service_scheduling_limits WHERE service_type = 'Carpet') as limits_count;
