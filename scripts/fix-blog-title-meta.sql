-- =====================================================
-- FIX BLOG POST TITLE: Remove Full Template from meta_title
-- =====================================================
-- This script fixes the "10 Essential Deep Cleaning Tips" blog post
-- by removing or updating the meta_title that contains the full template
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, check the current meta_title for the post
SELECT 
  id,
  slug,
  title,
  meta_title,
  LENGTH(meta_title) as meta_title_length,
  CASE 
    WHEN meta_title LIKE '% | Shalean Cleaning Services%' THEN 'Has full template'
    WHEN LENGTH(meta_title) > 70 THEN 'Too long'
    ELSE 'OK'
  END as status
FROM blog_posts
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

-- Update the meta_title to use shortest template or clear it
-- Option 1: Clear meta_title (let code generate it with shortest template)
UPDATE blog_posts
SET 
  meta_title = NULL,
  updated_at = NOW()
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home'
  AND (meta_title LIKE '% | Shalean Cleaning Services%' OR LENGTH(meta_title) > 70);

-- Option 2: Set meta_title to use shortest template (uncomment if preferred)
-- UPDATE blog_posts
-- SET 
--   meta_title = '10 Essential Deep Cleaning Tips for Every Home | Shalean',
--   updated_at = NOW()
-- WHERE slug = '10-essential-deep-cleaning-tips-for-every-home'
--   AND (meta_title LIKE '% | Shalean Cleaning Services%' OR LENGTH(meta_title) > 70);

-- Verify the update
SELECT 
  id,
  slug,
  title,
  meta_title,
  LENGTH(COALESCE(meta_title, title)) as title_length,
  'Updated successfully' as status
FROM blog_posts
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

