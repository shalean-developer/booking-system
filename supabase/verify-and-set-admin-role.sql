-- Verify and Set Admin Role for User
-- Run this in Supabase SQL Editor to check and fix admin access

-- ============================================
-- STEP 1: Check if role column exists
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND column_name = 'role';

-- If the above returns no rows, you need to add the role column first:
-- (Uncomment and run the lines below)

-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
-- ALTER TABLE customers ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin'));
-- CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);
-- COMMENT ON COLUMN customers.role IS 'User role: customer (default) or admin';


-- ============================================
-- STEP 2: Check current user's role
-- ============================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  auth_user_id,
  created_at
FROM customers
WHERE email = 'chitekedzaf@gmail.com';

-- Expected: You should see role = 'admin'
-- If role = 'customer' or NULL, continue to Step 3


-- ============================================
-- STEP 3: Set user as admin
-- ============================================
-- Uncomment and run this to promote the user to admin:

-- UPDATE customers 
-- SET role = 'admin' 
-- WHERE email = 'chitekedzaf@gmail.com';


-- ============================================
-- STEP 4: Verify the change
-- ============================================
-- Run this to confirm the update worked:

-- SELECT 
--   email,
--   role,
--   CASE 
--     WHEN role = 'admin' THEN '✅ Admin access granted'
--     ELSE '❌ Still needs admin role'
--   END as status
-- FROM customers
-- WHERE email = 'chitekedzaf@gmail.com';


-- ============================================
-- BONUS: List all admin users
-- ============================================
-- To see all users with admin access:

-- SELECT 
--   id,
--   email,
--   first_name,
--   last_name,
--   role,
--   created_at
-- FROM customers
-- WHERE role = 'admin'
-- ORDER BY created_at DESC;


-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If the user doesn't exist in customers table at all:
-- SELECT email FROM auth.users WHERE email = 'chitekedzaf@gmail.com';
-- (If this returns a row, the auth user exists but has no customer profile)

-- To create a customer profile for an existing auth user:
-- INSERT INTO customers (
--   email, 
--   first_name, 
--   last_name, 
--   phone, 
--   role, 
--   auth_user_id
-- )
-- SELECT 
--   email,
--   raw_user_meta_data->>'first_name' as first_name,
--   raw_user_meta_data->>'last_name' as last_name,
--   raw_user_meta_data->>'phone' as phone,
--   'admin' as role,
--   id as auth_user_id
-- FROM auth.users
-- WHERE email = 'chitekedzaf@gmail.com'
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';

