-- Company-only amounts: excluded from cleaner earnings pool (integer cents).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS equipment_cost INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_cleaner_fee INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN bookings.equipment_cost IS 'Equipment/supplies charge to company (cents); excluded from cleaner commission pool';
COMMENT ON COLUMN bookings.extra_cleaner_fee IS 'Extra cleaner labor increment Standard/Airbnb (cents); excluded from cleaner pool';

-- Backfill equipment from normalized equipment_fee (ZAR) where present
UPDATE bookings
SET equipment_cost = ROUND(COALESCE(equipment_fee, 0)::numeric * 100)::integer
WHERE COALESCE(equipment_fee, 0) > 0
  AND equipment_cost = 0;
