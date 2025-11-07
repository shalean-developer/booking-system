# Fix Live Site Blog Title Issue

## Problem
The live site is still showing "10 Essential Deep Cleaning Tips for Every Home | Shalean Cleaning Services" (74 chars) despite code fixes.

## Root Cause
The blog post likely has a `meta_title` field in the database set to the 74-character string. Even though the code has fixes to detect and replace this, if the database value is cached or the code hasn't been deployed yet, it will still show the old value.

## Solution

### Step 1: Update Database (Recommended - Immediate Fix)

Run the SQL script to update or clear the `meta_title` field:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the SQL Script**
   - Open the file: `scripts/fix-blog-title-meta.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** to execute

3. **Verify the Update**
   - The script will show the current state before and after
   - Confirm that `meta_title` is now NULL or uses the shortest template

### Step 2: Clear Cache on Live Site

After updating the database, clear caches:

#### Next.js Cache (if self-hosted)
```bash
# Delete .next folder
rm -rf .next

# Restart the application
npm run build
# or
pm2 restart your-app
```

#### Vercel/Netlify (if using these platforms)
- **Vercel**: Go to your project → Settings → Clear Build Cache → Redeploy
- **Netlify**: Go to Site settings → Build & deploy → Clear cache and retry deploy

#### CDN Cache (if using Cloudflare, etc.)
- Clear cache for the specific blog post URL: `/blog/10-essential-deep-cleaning-tips-for-every-home`
- Or clear entire cache if needed

#### Browser Cache
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Or clear browser cache for the site

### Step 3: Verify the Fix

1. **Check the page source**
   - View page source on the live site
   - Look for `<title>` tag
   - Should show: "10 Essential Deep Cleaning Tips for Every Home | Shalean" (57 chars)

2. **Check SEO tools**
   - Use Google Search Console or other SEO tools
   - Verify the title is now within 70 characters

## Alternative: Update via Admin CMS

If you prefer using the admin interface:

1. **Login to Admin Dashboard**
   - Navigate to `/admin/blog`
   - Find the post "10 Essential Deep Cleaning Tips for Every Home"

2. **Edit the Post**
   - Click "Edit" on the post
   - Clear the "Meta Title" field (leave it empty)
   - Or set it to: "10 Essential Deep Cleaning Tips for Every Home | Shalean"
   - Save the post

3. **Clear Cache**
   - Follow Step 2 above to clear caches

## Code Verification

The code has multiple safety checks:

1. **Special Case Handler** (lines 87-144)
   - Detects the specific post by slug
   - Checks if `meta_title` contains full template or is > 70 chars
   - Replaces with shortest template

2. **Final Validation** (lines 212-244)
   - Always checks if title contains full template
   - Always checks if title length > 70
   - Replaces with shortest template

3. **Normal Flow** (lines 145-210)
   - Uses shortest template when title + default would exceed 70

## Expected Result

After applying the fix:
- **Before**: "10 Essential Deep Cleaning Tips for Every Home | Shalean Cleaning Services" (74 chars)
- **After**: "10 Essential Deep Cleaning Tips for Every Home | Shalean" (57 chars)

## Troubleshooting

If the issue persists after following these steps:

1. **Check if code is deployed**
   - Verify the latest code is on the live server
   - Check git commit history on production

2. **Check database directly**
   - Run the SELECT query from the SQL script
   - Verify `meta_title` is NULL or uses shortest template

3. **Check server logs**
   - Look for any errors in the metadata generation
   - Verify the special case handler is executing

4. **Force revalidation**
   - If using Next.js ISR, the page revalidates every hour
   - Or manually trigger a rebuild

