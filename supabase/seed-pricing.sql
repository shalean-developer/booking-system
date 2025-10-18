-- Seed pricing_config table with current hardcoded prices
-- This populates the database with the existing pricing from lib/pricing.ts

-- Clear any existing pricing data (for fresh setup)
-- TRUNCATE TABLE pricing_config CASCADE;
-- TRUNCATE TABLE pricing_history CASCADE;

-- Insert Service Base Prices
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES
  -- Standard Cleaning
  ('Standard', 'base', NULL, 250.00, CURRENT_DATE, true, 'Initial pricing - Standard base price'),
  ('Standard', 'bedroom', NULL, 20.00, CURRENT_DATE, true, 'Initial pricing - Standard per bedroom'),
  ('Standard', 'bathroom', NULL, 30.00, CURRENT_DATE, true, 'Initial pricing - Standard per bathroom'),
  
  -- Deep Cleaning
  ('Deep', 'base', NULL, 1200.00, CURRENT_DATE, true, 'Initial pricing - Deep base price'),
  ('Deep', 'bedroom', NULL, 180.00, CURRENT_DATE, true, 'Initial pricing - Deep per bedroom'),
  ('Deep', 'bathroom', NULL, 250.00, CURRENT_DATE, true, 'Initial pricing - Deep per bathroom'),
  
  -- Move In/Out Cleaning
  ('Move In/Out', 'base', NULL, 980.00, CURRENT_DATE, true, 'Initial pricing - Move In/Out base price'),
  ('Move In/Out', 'bedroom', NULL, 160.00, CURRENT_DATE, true, 'Initial pricing - Move In/Out per bedroom'),
  ('Move In/Out', 'bathroom', NULL, 220.00, CURRENT_DATE, true, 'Initial pricing - Move In/Out per bathroom'),
  
  -- Airbnb Cleaning
  ('Airbnb', 'base', NULL, 230.00, CURRENT_DATE, true, 'Initial pricing - Airbnb base price'),
  ('Airbnb', 'bedroom', NULL, 18.00, CURRENT_DATE, true, 'Initial pricing - Airbnb per bedroom'),
  ('Airbnb', 'bathroom', NULL, 26.00, CURRENT_DATE, true, 'Initial pricing - Airbnb per bathroom');

-- Insert Extra Services
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES
  (NULL, 'extra', 'Inside Fridge', 30.00, CURRENT_DATE, true, 'Initial pricing - Inside Fridge cleaning'),
  (NULL, 'extra', 'Inside Oven', 30.00, CURRENT_DATE, true, 'Initial pricing - Inside Oven cleaning'),
  (NULL, 'extra', 'Inside Cabinets', 30.00, CURRENT_DATE, true, 'Initial pricing - Inside Cabinets cleaning'),
  (NULL, 'extra', 'Interior Windows', 40.00, CURRENT_DATE, true, 'Initial pricing - Interior Windows cleaning'),
  (NULL, 'extra', 'Interior Walls', 35.00, CURRENT_DATE, true, 'Initial pricing - Interior Walls cleaning'),
  (NULL, 'extra', 'Ironing', 35.00, CURRENT_DATE, true, 'Initial pricing - Ironing service'),
  (NULL, 'extra', 'Laundry', 40.00, CURRENT_DATE, true, 'Initial pricing - Laundry service');

-- Insert Service Fee (NEW)
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES
  (NULL, 'service_fee', NULL, 50.00, CURRENT_DATE, true, 'Initial service fee - flat rate');

-- Insert Frequency Discounts (NEW) - stored as percentage (e.g., 15.00 = 15%)
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES
  (NULL, 'frequency_discount', 'weekly', 15.00, CURRENT_DATE, true, 'Weekly service discount - 15%'),
  (NULL, 'frequency_discount', 'bi-weekly', 10.00, CURRENT_DATE, true, 'Bi-weekly service discount - 10%'),
  (NULL, 'frequency_discount', 'monthly', 5.00, CURRENT_DATE, true, 'Monthly service discount - 5%');

-- Verify the data
SELECT 
  price_type,
  service_type,
  item_name,
  price,
  is_active
FROM pricing_config
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
    WHEN 'extra' THEN 4
    WHEN 'service_fee' THEN 5
    WHEN 'frequency_discount' THEN 6
  END,
  service_type,
  item_name;

-- Summary of seeded data
SELECT 
  price_type,
  COUNT(*) as count,
  SUM(price) as total_value
FROM pricing_config
WHERE is_active = true
GROUP BY price_type
ORDER BY price_type;

