-- Update Bookings Table for Customer Profiles
-- Purpose: Link bookings to customer profiles
-- Run this in Supabase SQL Editor AFTER creating customers table

-- Add customer_id column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Create index for customer lookups (fast query by customer)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);

-- Create composite index for customer booking history
CREATE INDEX IF NOT EXISTS idx_bookings_customer_date ON bookings(customer_id, booking_date DESC);

-- Update column comment
COMMENT ON COLUMN bookings.customer_id IS 'Links to customer profile in customers table (optional for backwards compatibility with existing bookings)';

-- Note: Existing bookings will have NULL customer_id (backwards compatible)
-- New bookings will have customer_id populated automatically via API


