-- Fix Blog Posts RLS for Admin Access
-- This script creates the necessary RLS policies so admins can manage blog posts

-- Step 1: Ensure the is_admin() function exists (should already exist from quotes fix)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Return false if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the user's role from customers table
  SELECT role INTO user_role
  FROM customers
  WHERE auth_user_id = auth.uid();
  
  -- Return true if role is 'admin'
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop ALL existing policies on blog_posts table to avoid conflicts
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all existing policies on blog_posts table
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'blog_posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON blog_posts', policy_record.policyname);
  END LOOP;
END $$;

-- Step 3: Create new admin-specific policies

-- Allow admins to SELECT (view) all blog posts
CREATE POLICY "Admins can view all blog_posts" ON blog_posts
  FOR SELECT
  USING (is_admin());

-- Allow admins to INSERT (create) blog posts
CREATE POLICY "Admins can insert blog_posts" ON blog_posts
  FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to UPDATE blog posts
CREATE POLICY "Admins can update all blog_posts" ON blog_posts
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to DELETE blog posts
CREATE POLICY "Admins can delete blog_posts" ON blog_posts
  FOR DELETE
  USING (is_admin());

-- Step 4: Create public policies for published posts (for the frontend blog)
CREATE POLICY "Public can view published blog_posts" ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Step 5: Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'blog_posts'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Admins can delete blog_posts" (DELETE)
-- 2. "Admins can insert blog_posts" (INSERT)
-- 3. "Admins can update all blog_posts" (UPDATE)
-- 4. "Admins can view all blog_posts" (SELECT)
-- 5. "Public can view published blog_posts" (SELECT)
