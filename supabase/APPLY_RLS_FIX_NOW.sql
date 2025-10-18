-- ============================================
-- APPLY RLS FIX NOW - Run this entire script
-- ============================================
-- This will fix the "new row violates row-level security policy" error
-- Safe to run multiple times - drops existing policies first

-- Step 1: Drop ALL existing policies (no error if they don't exist)
DO $$ 
BEGIN
    -- Drop pricing_config policies
    DROP POLICY IF EXISTS "Public can view active pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can view all pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can insert pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can update pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can delete pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;
    DROP POLICY IF EXISTS "Admins can manage all pricing" ON pricing_config;
    
    -- Drop pricing_history policies
    DROP POLICY IF EXISTS "Admins can view pricing history" ON pricing_history;
    DROP POLICY IF EXISTS "Allow trigger inserts to pricing history" ON pricing_history;
    
    RAISE NOTICE 'Step 1: Dropped existing policies';
END $$;

-- Step 2: Create new policies with correct RLS rules

-- Public can SELECT active pricing (for booking flow)
CREATE POLICY "Public can view active pricing" ON pricing_config
  FOR SELECT USING (
    is_active = true 
    AND effective_date <= CURRENT_DATE 
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
  );

-- Admins can SELECT all pricing (for admin dashboard)
CREATE POLICY "Admins can view all pricing" ON pricing_config
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admins can INSERT new pricing (WITH CHECK clause required!)
CREATE POLICY "Admins can insert pricing" ON pricing_config
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admins can UPDATE pricing (both USING and WITH CHECK required)
CREATE POLICY "Admins can update pricing" ON pricing_config
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admins can DELETE pricing
CREATE POLICY "Admins can delete pricing" ON pricing_config
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admins can SELECT pricing history
CREATE POLICY "Admins can view pricing history" ON pricing_history
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Allow database triggers to INSERT into pricing_history (for audit trail)
CREATE POLICY "Allow trigger inserts to pricing history" ON pricing_history
  FOR INSERT 
  WITH CHECK (true);

-- Step 3: Verify the fix
DO $$ 
BEGIN
    RAISE NOTICE '✅ Step 2: Created new RLS policies successfully!';
    RAISE NOTICE '✅ You can now save prices in the admin dashboard';
END $$;

-- Show all policies to confirm
SELECT 
    'pricing_config' as table_name,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'pricing_config'
UNION ALL
SELECT 
    'pricing_history' as table_name,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'pricing_history'
ORDER BY table_name, operation;

