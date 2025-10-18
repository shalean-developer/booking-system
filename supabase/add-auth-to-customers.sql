-- Add Supabase Auth Integration to Customer Profiles
-- Purpose: Link customer profiles to authenticated users (optional)
-- Maintains guest checkout - auth_user_id is nullable
-- Run this in Supabase SQL Editor AFTER creating customers table

-- Add auth_user_id column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for fast auth user lookups
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- Create unique constraint: one profile per auth user
-- (Auth users can only have one customer profile)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_unique 
  ON customers(auth_user_id) 
  WHERE auth_user_id IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN customers.auth_user_id IS 'Links customer profile to Supabase Auth user if authenticated (NULL for guest checkout - maintains guest booking support)';

-- Note: Existing customers will have NULL auth_user_id (guest profiles)
-- When authenticated user books, profile gets linked to their auth account
-- Guest checkout continues to work perfectly (auth_user_id stays NULL)

