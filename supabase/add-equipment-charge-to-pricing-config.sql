-- Migration: Add 'equipment_charge' to pricing_config valid_price_type constraint
-- Purpose: Allow equipment charge price to be stored in pricing_config table
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE pricing_config 
DROP CONSTRAINT IF EXISTS valid_price_type;

-- Recreate the constraint with 'equipment_charge' included
ALTER TABLE pricing_config
ADD CONSTRAINT valid_price_type CHECK (
  price_type IN ('base', 'bedroom', 'bathroom', 'extra', 'service_fee', 'frequency_discount', 'equipment_charge')
);

-- Insert default equipment charge (R500) if it doesn't exist
INSERT INTO pricing_config (service_type, price_type, item_name, price, effective_date, is_active, notes)
VALUES (NULL, 'equipment_charge', 'Equipment & Supplies', 500.00, CURRENT_DATE, true, 'Standard charge for providing cleaning equipment and supplies')
ON CONFLICT DO NOTHING;

