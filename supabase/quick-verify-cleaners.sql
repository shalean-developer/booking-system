-- Quick Cleaner Verification
-- Run this to check if test cleaners exist with passwords

-- Check for test cleaners specifically
SELECT 
  id,
  name,
  phone,
  auth_provider,
  is_active,
  is_available,
  password_hash IS NOT NULL as has_password,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Ready for login'
    ELSE 'Missing password hash'
  END as login_status
FROM cleaners
WHERE phone IN ('+27123456789', '+27987654321', '+27555123456')
ORDER BY name;

-- If no results above, run the test-cleaner-setup.sql file
