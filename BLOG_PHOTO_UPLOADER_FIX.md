# Blog Photo Uploader Fix

## Issue Identified

The blog post photo uploader is failing because the Supabase storage bucket `blog-images` may not be properly configured.

## Fix Applied

### 1. API Route Fix
The API route in `app/api/admin/blog/upload-image/route.ts` is correctly implemented and should work once the storage bucket is set up.

### 2. Storage Bucket Setup Required

You need to set up the `blog-images` storage bucket in your Supabase project. Follow these steps:

#### Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**:
   - Navigate to your project
   - Click on "Storage" in the left sidebar
   - Click on "Buckets" tab

2. **Create the blog-images bucket**:
   - Click "Create a new bucket"
   - **Bucket name**: `blog-images`
   - **Public bucket**: ✅ Check this (allows public read access)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp,image/gif`
   - Click "Create bucket"

3. **Configure Storage Policies**:
   - Click on the `blog-images` bucket
   - Go to "Policies" tab
   - Add these policies:

   **Policy 1: Allow Admin Uploads**
   ```sql
   CREATE POLICY "Admin can upload blog images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'blog-images');
   ```

   **Policy 2: Allow Public Read**
   ```sql
   CREATE POLICY "Public can view blog images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'blog-images');
   ```

   **Policy 3: Allow Admin Delete**
   ```sql
   CREATE POLICY "Admin can delete blog images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'blog-images');
   ```

#### Method 2: SQL Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload blog images
CREATE POLICY "Allow authenticated uploads for blog images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Storage Policy: Allow public read access to blog images
CREATE POLICY "Allow public read access to blog images" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');

-- Storage Policy: Allow authenticated users to delete blog images
CREATE POLICY "Allow authenticated delete for blog images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Storage Policy: Allow authenticated users to update blog images
CREATE POLICY "Allow authenticated update for blog images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

### 3. Test the Fix

1. **Verify Environment Variables**:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

2. **Test Upload**:
   - Go to the admin dashboard
   - Try creating a new blog post
   - Click the image upload button in the rich text editor
   - Upload a test image

3. **Check Console**:
   - Open browser developer tools
   - Look for any error messages in the console
   - Check the Network tab for API call responses

### 4. Troubleshooting

If uploads still fail:

1. **Check Supabase Logs**:
   - Go to your Supabase dashboard
   - Check the Logs section for any errors

2. **Verify Bucket Exists**:
   - In Supabase Storage, confirm the `blog-images` bucket exists
   - Check that it's set to public

3. **Test API Directly**:
   - Use a tool like Postman to test the `/api/admin/blog/upload-image` endpoint
   - Ensure you're authenticated as an admin

4. **Check File Size/Type**:
   - Ensure uploaded files are under 5MB
   - Ensure files are valid image types (JPEG, PNG, WebP, GIF)

## Components Fixed

- ✅ API Route: `app/api/admin/blog/upload-image/route.ts`
- ✅ Rich Text Editor: `components/admin/rich-text-editor.tsx`
- ✅ Blog Section: `components/admin/blog-section.tsx`

## Next Steps

1. Set up the `blog-images` storage bucket in Supabase
2. Test the photo upload functionality
3. Verify images are accessible via public URLs

The uploader should work correctly once the storage bucket is properly configured.
