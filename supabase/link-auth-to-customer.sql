-- ============================================
-- MANUAL FIX: Link Auth User to Customer Profile
-- ============================================
-- Issue: Customer profile exists but auth_user_id is NULL
-- Result: No autofill during booking for logged-in users

-- ============================================
-- STEP 1: Find the auth user
-- ============================================
SELECT 
  id AS auth_user_id,
  email,
  created_at AS signed_up_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'chitekedzaf@gmail.com';

-- Expected: Should return 1 row with user ID

-- ============================================
-- STEP 2: Find the customer profile
-- ============================================
SELECT 
  id AS customer_id,
  email,
  auth_user_id,
  first_name,
  last_name,
  total_bookings,
  created_at
FROM customers 
WHERE email ILIKE 'chitekedzaf@gmail.com';

-- Expected: Should return 1 row with NULL auth_user_id

-- ============================================
-- STEP 3: Link them together
-- ============================================
-- This updates the customer profile with the auth user ID
UPDATE customers
SET auth_user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'chitekedzaf@gmail.com'
)
WHERE email ILIKE 'chitekedzaf@gmail.com'
  AND auth_user_id IS NULL;

-- Expected: UPDATE 1 (if successful)

-- ============================================
-- STEP 4: Verify the link
-- ============================================
SELECT 
  c.id AS customer_id,
  c.email AS customer_email,
  c.auth_user_id,
  a.email AS auth_email,
  c.first_name,
  c.last_name,
  c.total_bookings
FROM customers c
LEFT JOIN auth.users a ON c.auth_user_id = a.id
WHERE c.email ILIKE 'chitekedzaf@gmail.com';

-- Expected: auth_user_id should be populated, auth_email should match

-- ============================================
-- STEP 5: Check all unlinked profiles (Optional)
-- ============================================
-- Find other customers who have auth accounts but aren't linked
SELECT 
  c.id AS customer_id,
  c.email,
  c.auth_user_id AS current_auth_link,
  a.id AS auth_user_exists,
  c.total_bookings
FROM customers c
LEFT JOIN auth.users a ON LOWER(c.email) = LOWER(a.email)
WHERE c.auth_user_id IS NULL 
  AND a.id IS NOT NULL
ORDER BY c.created_at DESC;

-- This shows customers who signed up AND have bookings, but aren't linked

-- ============================================
-- STEP 6: Bulk link all matching profiles (Optional)
-- ============================================
-- ⚠️ Only run this if you want to link ALL matching profiles
-- Uncomment to use:

/*
UPDATE customers c
SET auth_user_id = a.id
FROM auth.users a
WHERE LOWER(c.email) = LOWER(a.email)
  AND c.auth_user_id IS NULL;
*/

-- ============================================
-- RESULT
-- ============================================
-- After running Step 3:
-- ✅ Your profile is linked to auth
-- ✅ Next time you start booking, you'll see autofill
-- ✅ Contact details will be pre-filled
-- ✅ Faster checkout for logged-in users

-- ============================================
-- TESTING
-- ============================================
-- 1. Login at: http://localhost:3002/login
-- 2. Start new booking: http://localhost:3002/booking/service/select
-- 3. Reach "Contact & Address" step
-- 4. Should see: "We found your saved information" with autofill button
-- 5. Click autofill → Details should populate ✅

