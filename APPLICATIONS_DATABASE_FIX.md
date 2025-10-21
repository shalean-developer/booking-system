# Applications Database Error - Fixed

## Problem
The careers application form was failing with the error: **"Failed to save application to database"**

## Root Cause
There was a schema mismatch between the database table and the API route:

- **Database Schema** (`supabase/applications-table.sql`): Column named `reference_contacts`
- **API Route** (`app/api/applications/route.ts`): Was trying to insert as `references`

This mismatch caused the database insert to fail.

## Solution Applied

### 1. Fixed API Route
**File: `app/api/applications/route.ts`**
- Changed `references: body.references || null` to `reference_contacts: body.references || null`
- This ensures the data is inserted into the correct database column

### 2. Fixed Admin Component
**File: `components/admin/applications-section.tsx`**
- Updated interface: Changed `references: string` to `reference_contacts: string`
- Updated display: Changed `viewingApplication.references` to `viewingApplication.reference_contacts`
- This ensures the admin panel correctly reads and displays the reference data

## Files Modified
1. ✅ `app/api/applications/route.ts` - Fixed database insert field name
2. ✅ `components/admin/applications-section.tsx` - Fixed interface and display

## Testing
To verify the fix works:

1. Navigate to `/careers/apply`
2. Fill out the application form with all required fields
3. Submit the application
4. Verify success message appears
5. Check Supabase database to confirm the record was inserted

## Database Setup Reminder
If you haven't already, ensure the applications table exists in your Supabase database:

```bash
# Run this SQL file in your Supabase SQL Editor:
supabase/applications-table.sql
```

## Notes
- The email interface (`lib/email.ts`) still uses `references` as a property name, which is fine since it's just for display in emails
- The frontend form (`app/careers/apply/page.tsx`) doesn't need changes - it already sends `references` in the request body
- The API route correctly maps `body.references` to `reference_contacts` for database insertion

