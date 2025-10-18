-- Customer Profiles Table
-- Purpose: Store customer information separately from bookings
-- Enables profile reuse and better customer management
-- Run this in Supabase SQL Editor

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,           -- Unique identifier (case-insensitive)
  phone TEXT,                            -- Secondary identifier
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_line1 TEXT,
  address_suburb TEXT,
  address_city TEXT,
  total_bookings INTEGER DEFAULT 0,     -- Track customer loyalty
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_lower ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_total_bookings ON customers(total_bookings DESC);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Public can check if profile exists (for autofill on Contact form)
CREATE POLICY "Public can check customer by email" ON customers
  FOR SELECT USING (true);

-- Public can create new profiles (when booking for first time)
CREATE POLICY "Public can create customer profiles" ON customers
  FOR INSERT WITH CHECK (true);

-- Public can update profiles (when customer updates their info)
CREATE POLICY "Public can update customer profiles" ON customers
  FOR UPDATE USING (true);

-- Add table and column comments
COMMENT ON TABLE customers IS 'Customer profiles for returning customer management and autofill';
COMMENT ON COLUMN customers.id IS 'Unique UUID for customer profile';
COMMENT ON COLUMN customers.email IS 'Unique email address - primary identifier (case-insensitive)';
COMMENT ON COLUMN customers.phone IS 'Customer phone number - secondary identifier';
COMMENT ON COLUMN customers.total_bookings IS 'Counter for customer loyalty tracking and analytics';
COMMENT ON COLUMN customers.address_line1 IS 'Last used street address (autofill convenience)';
COMMENT ON COLUMN customers.address_suburb IS 'Last used suburb (autofill convenience)';
COMMENT ON COLUMN customers.address_city IS 'Last used city (autofill convenience)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


