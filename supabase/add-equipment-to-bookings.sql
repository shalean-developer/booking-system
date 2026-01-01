-- Migration: Add equipment columns to bookings table
-- Purpose: Track if customer requested equipment/supplies and the charge amount
-- Run this in Supabase SQL Editor

-- Add provide_equipment column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'provide_equipment'
  ) THEN
    ALTER TABLE bookings ADD COLUMN provide_equipment BOOLEAN DEFAULT false;
    COMMENT ON COLUMN bookings.provide_equipment IS 'True if customer requested cleaning equipment/supplies (Standard/Airbnb services only)';
    
    RAISE NOTICE 'provide_equipment column added to bookings table';
  ELSE
    RAISE NOTICE 'provide_equipment column already exists in bookings table';
  END IF;
END $$;

-- Add equipment_charge column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'equipment_charge'
  ) THEN
    ALTER TABLE bookings ADD COLUMN equipment_charge DECIMAL(10,2) DEFAULT 0;
    COMMENT ON COLUMN bookings.equipment_charge IS 'Equipment charge amount in Rands (typically R500) at time of booking';
    
    RAISE NOTICE 'equipment_charge column added to bookings table';
  ELSE
    RAISE NOTICE 'equipment_charge column already exists in bookings table';
  END IF;
END $$;

-- Create index for queries filtering by equipment
CREATE INDEX IF NOT EXISTS idx_bookings_provide_equipment ON bookings(provide_equipment) WHERE provide_equipment = true;

