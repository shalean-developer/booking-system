-- Verification script: Check if cleaners table has auth fields
-- Run this in Supabase SQL Editor to verify the migration status

-- 1. Check which columns exist in cleaners table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cleaners'
ORDER BY ordinal_position;

-- 2. Specifically check for auth-related columns
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaners' AND column_name = 'password_hash'
  ) THEN '✓ password_hash exists' ELSE '✗ password_hash MISSING' END as password_hash_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaners' AND column_name = 'auth_provider'
  ) THEN '✓ auth_provider exists' ELSE '✗ auth_provider MISSING' END as auth_provider_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaners' AND column_name = 'otp_code'
  ) THEN '✓ otp_code exists' ELSE '✗ otp_code MISSING' END as otp_code_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaners' AND column_name = 'is_available'
  ) THEN '✓ is_available exists' ELSE '✗ is_available MISSING' END as is_available_status;

-- 3. Check if phone unique constraint exists
SELECT 
  conname as constraint_name,
  CASE 
    WHEN conname = 'cleaners_phone_unique' THEN '✓ Phone unique constraint exists'
    ELSE 'Other constraint'
  END as status
FROM pg_constraint 
WHERE conrelid = 'cleaners'::regclass 
  AND contype = 'u';

-- If you see "MISSING" statuses above, run the cleaners-auth.sql migration:
-- Copy and paste the contents of supabase/migrations/cleaners-auth.sql into SQL Editor

