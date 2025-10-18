-- ============================================
-- DEBUG: "Database error saving new user"
-- ============================================
-- Run these queries in Supabase SQL Editor to diagnose the issue

-- ============================================
-- QUERY 1: Check All Triggers on auth.users
-- ============================================
-- This will show any triggers that fire when a user signs up
SELECT 
  trigger_name,
  event_manipulation AS event_type,
  action_statement AS trigger_function,
  action_timing AS when_fires
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Expected: Should return 0 rows unless you've added custom triggers
-- If rows appear: One of these triggers might be failing


-- ============================================
-- QUERY 2: Check Database Functions Related to Auth
-- ============================================
-- Find any custom functions that reference auth.users
SELECT 
  routine_name AS function_name,
  routine_type AS type,
  LEFT(routine_definition, 100) AS definition_preview
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
  AND (
    routine_definition ILIKE '%auth.users%'
    OR routine_definition ILIKE '%auth_user_id%'
  )
ORDER BY routine_name;

-- Expected: Should show any custom functions you created
-- If found: Check if these functions have errors


-- ============================================
-- QUERY 3: Check for Edge Functions/Webhooks
-- ============================================
-- Note: This might not work if supabase_functions schema doesn't exist
-- This is for database webhooks, not Edge Functions
SELECT 
  id,
  hook_name,
  events,
  created_at
FROM supabase_functions.hooks
WHERE hook_table_name = 'users'
  AND hook_table_schema = 'auth';

-- Expected: May not exist or return error if no webhooks configured
-- If found: Check webhook URL and response


-- ============================================
-- QUERY 4: Check RLS Policies on Customers Table
-- ============================================
-- Verify RLS policies aren't blocking profile creation
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;

-- Expected: Should show policies from customers-table.sql
-- Check: Policies should allow INSERT for auth context


-- ============================================
-- QUERY 5: Check Customers Table Structure
-- ============================================
-- Verify auth_user_id column exists with correct type
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
  AND column_name IN ('id', 'auth_user_id', 'email')
ORDER BY ordinal_position;

-- Expected: auth_user_id should be UUID and nullable


-- ============================================
-- QUERY 6: Test Customer Table Permissions
-- ============================================
-- Check if anonymous users can insert (needed for guest checkout)
SELECT 
  has_table_privilege('anon', 'customers', 'SELECT') AS can_select,
  has_table_privilege('anon', 'customers', 'INSERT') AS can_insert,
  has_table_privilege('anon', 'customers', 'UPDATE') AS can_update;

-- Expected: can_insert should be true


-- ============================================
-- QUERY 7: Check Auth Users Table Access
-- ============================================
-- Verify your project can access auth.users
SELECT COUNT(*) AS existing_users
FROM auth.users;

-- Expected: Returns count of existing users
-- If error: Permission issue with auth schema


-- ============================================
-- QUERY 8: Check for Foreign Key Constraints
-- ============================================
-- Find any FK constraints that might be blocking
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'customers' OR ccu.table_name = 'users');

-- Expected: auth_user_id references auth.users(id)
-- Check: ON DELETE SET NULL should be configured


-- ============================================
-- QUERY 9: Check for Duplicate Email
-- ============================================
-- See if the email you're trying to signup with already exists
-- REPLACE 'test@example.com' with the email you're testing
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'chitekedzaf@gmail.com';  -- Change this to your test email

-- Expected: 0 rows if email is new
-- If found: User already exists, try different email


-- ============================================
-- QUERY 10: Check Auth Configuration
-- ============================================
-- Check if email provider is properly configured
-- Note: This requires admin access
SELECT 
  instance_id,
  COALESCE(raw_base_config ->> 'GOTRUE_EXTERNAL_EMAIL_ENABLED', 'unknown') AS email_enabled,
  COALESCE(raw_base_config ->> 'GOTRUE_MAILER_AUTOCONFIRM', 'unknown') AS autoconfirm
FROM auth.config;

-- Expected: email_enabled = 'true'


-- ============================================
-- DIAGNOSTIC SUMMARY
-- ============================================
-- Run all queries above and note:
-- 1. Any triggers found in Query 1
-- 2. Any functions found in Query 2
-- 3. RLS policies that might be too restrictive
-- 4. Missing columns or wrong data types
-- 5. Existing users with same email

-- Common Issues:
-- ❌ Trigger on auth.users trying to create profile but failing
-- ❌ RLS policy blocking INSERT from auth context
-- ❌ Missing auth_user_id column
-- ❌ Email already registered
-- ❌ Webhook timing out

