-- Migration: Add equipment_required and equipment_fee columns to bookings table
-- Purpose: Normalize equipment fields for emails, reporting, and downstream integrations.
-- This migration is idempotent and safe to re-run.
-- It does NOT remove or change existing columns like provide_equipment / equipment_charge.

DO $$
BEGIN
  -- equipment_required: mirrors intent of provide_equipment but with clearer naming
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'equipment_required'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN equipment_required BOOLEAN NOT NULL DEFAULT FALSE;

    COMMENT ON COLUMN bookings.equipment_required IS
      'True if customer requested Shalean to provide cleaning equipment/supplies.';
  END IF;
END $$;

DO $$
BEGIN
  -- equipment_fee: monetary value in ZAR at time of booking (not cents)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'equipment_fee'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN equipment_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

    COMMENT ON COLUMN bookings.equipment_fee IS
      'Equipment fee in ZAR at time of booking (e.g. 500.00).';
  END IF;
END $$;

