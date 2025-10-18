-- Add Admin Role to Customers Table
-- Purpose: Enable role-based access control for admin features
-- Run this in Supabase SQL Editor

-- Add role column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Add constraint to ensure only valid roles
ALTER TABLE customers ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin'));

-- Create index for fast admin checks
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);

-- Add comment
COMMENT ON COLUMN customers.role IS 'User role: customer (default) or admin';

-- Optional: Promote first user to admin (update with your admin email)
-- UPDATE customers SET role = 'admin' WHERE email = 'your-admin-email@example.com';

