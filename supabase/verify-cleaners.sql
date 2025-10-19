-- Database Verification Script for Cleaners
-- Run this in Supabase SQL Editor to check current state

-- 1. Check if unique constraint exists on phone column
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE 
    WHEN contype = 'u' THEN 'Unique constraint exists'
    ELSE 'No unique constraint'
  END as status
FROM pg_constraint 
WHERE conrelid = 'cleaners'::regclass 
  AND conname = 'cleaners_phone_unique';

-- 2. Check all cleaners with their authentication settings
SELECT 
  id,
  name,
  phone,
  email,
  auth_provider,
  is_active,
  is_available,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password auth enabled'
    ELSE 'No password hash'
  END as password_status,
  CASE 
    WHEN otp_code IS NOT NULL THEN 'OTP pending'
    ELSE 'No OTP'
  END as otp_status,
  created_at
FROM cleaners
ORDER BY created_at DESC;

-- 3. Check specifically for test cleaners
SELECT 
  id,
  name,
  phone,
  auth_provider,
  is_active,
  is_available,
  password_hash IS NOT NULL as has_password,
  rating,
  areas
FROM cleaners
WHERE phone IN ('+27123456789', '+27987654321', '+27555123456')
ORDER BY name;

-- 4. Check for any duplicate phone numbers
SELECT 
  phone, 
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names
FROM cleaners 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;

-- 5. Check table structure for auth fields
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cleaners'
  AND column_name IN ('password_hash', 'auth_provider', 'otp_code', 'otp_expires_at', 'is_active', 'is_available')
ORDER BY column_name;

-- 6. Summary
SELECT 
  COUNT(*) as total_cleaners,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as cleaners_with_passwords,
  COUNT(CASE WHEN auth_provider = 'password' OR auth_provider = 'both' THEN 1 END) as password_auth_enabled,
  COUNT(CASE WHEN auth_provider = 'otp' OR auth_provider = 'both' THEN 1 END) as otp_auth_enabled,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_cleaners,
  COUNT(CASE WHEN is_available = true THEN 1 END) as available_cleaners
FROM cleaners;
