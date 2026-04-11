-- Allow minimum booking floor in pricing_config
ALTER TABLE pricing_config
DROP CONSTRAINT IF EXISTS valid_price_type;

ALTER TABLE pricing_config
ADD CONSTRAINT valid_price_type CHECK (
  price_type IN (
    'base',
    'bedroom',
    'bathroom',
    'extra',
    'service_fee',
    'frequency_discount',
    'equipment_charge',
    'minimum_booking'
  )
);
