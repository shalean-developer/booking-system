# Review Photos Storage Setup Guide

## Overview

This guide helps you set up the Supabase storage bucket for customer review photos. The review system works without photos, but enabling photo uploads provides a better user experience.

## Quick Start

The review system is designed to work gracefully even without the storage bucket configured. If you're getting "Bucket not found" errors, follow the setup steps below.

---

## Method 1: Supabase Dashboard Setup (Recommended)

### Step 1: Create Storage Bucket

1. **Navigate to Storage**:
   - Go to your Supabase project dashboard
   - Click on "Storage" in the left sidebar
   - Click on "Buckets" tab

2. **Create New Bucket**:
   - Click "Create a new bucket"
   - **Bucket name**: `review-photos`
   - **Public bucket**: ✅ Check this (allows public read access for viewing photos)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: Leave default or add `image/jpeg,image/jpg,image/png,image/webp`
   - Click "Create bucket"

### Step 2: Configure Storage Policies

1. **Select the Bucket**:
   - Click on the `review-photos` bucket you just created

2. **Add Policies**:
   - Click on "Policies" tab
   - Click "New Policy"

3. **Policy 1: Allow Authenticated Uploads**
   ```sql
   CREATE POLICY "Authenticated users can upload review photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'review-photos');
   ```

4. **Policy 2: Allow Public Read**
   ```sql
   CREATE POLICY "Public can view review photos"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'review-photos');
   ```

5. **Policy 3: Allow Users to Delete Their Own Photos**
   ```sql
   CREATE POLICY "Users can delete their own review photos"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'review-photos' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### Step 3: Verify Setup

1. **Test Upload**:
   - Go to Storage → review-photos bucket
   - Try uploading a test image file
   - Verify it appears in the bucket

2. **Test Public Access**:
   - Click on the uploaded file
   - Copy the public URL
   - Open in a new tab to verify it's accessible

3. **Test Review Submission**:
   - Try submitting a review with photos
   - Verify photos are uploaded and visible

---

## Method 2: SQL-based Setup

If you prefer using SQL commands, run these in your Supabase SQL Editor:

### Create Bucket

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Add Storage Policies

```sql
-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-photos');

-- Policy 2: Allow public read access
CREATE POLICY "Public can view review photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

-- Policy 3: Allow users to delete their own photos
CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Troubleshooting

### "Bucket not found" Error

**Symptoms**: Console shows "Bucket not found" when uploading photos

**Solution**: Follow the setup steps above to create the `review-photos` bucket

### Photos Not Uploading

**Check**:
1. Bucket exists and is public
2. Storage policies are correctly configured
3. User is authenticated
4. File size is under 5MB
5. File type is supported (JPEG, PNG, WebP)

### Photos Not Visible

**Check**:
1. Bucket is set to public
2. "Public can view review photos" policy exists
3. Photo URLs are being generated correctly

### Permission Denied Errors

**Check**:
1. User is logged in (authenticated)
2. Upload policy exists and is active
3. User has proper permissions in Supabase

---

## File Structure

Photos are stored with this structure:
```
review-photos/
  └── {booking_id}/
      ├── {booking_id}-{timestamp}-0.jpg
      ├── {booking_id}-{timestamp}-1.jpg
      └── ...
```

**Example**:
```
review-photos/
  └── BK-12345/
      ├── BK-12345-1703123456789-0.jpg
      └── BK-12345-1703123456789-1.jpg
```

---

## Security Considerations

1. **File Size Limits**: 5MB per file prevents abuse
2. **MIME Type Restrictions**: Only image files allowed
3. **User Isolation**: Photos are organized by booking ID
4. **Public Read**: Photos are publicly viewable (for review display)
5. **Authenticated Upload**: Only logged-in users can upload

---

## Testing Checklist

- [ ] Bucket created successfully
- [ ] Bucket is set to public
- [ ] All three storage policies are active
- [ ] Test photo upload works via dashboard
- [ ] Test photo upload works via review form
- [ ] Photos are publicly accessible via URL
- [ ] Review submission with photos completes successfully
- [ ] Review submission without photos still works

---

## Need Help?

If you're still experiencing issues:

1. Check the Supabase logs for detailed error messages
2. Verify your environment variables are correct
3. Ensure your Supabase project has the latest migrations applied
4. Test with a simple image file first

For additional support, refer to the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage).
