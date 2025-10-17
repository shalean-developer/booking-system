# Supabase Setup Guide

This guide will help you set up Supabase for the cleaner selection feature in your booking system.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `shalean-booking-system`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" tab
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 3. Create Database Tables

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the contents of `supabase/schema.sql` from this project
4. Click "Run" to execute the SQL

This will create:
- `cleaners` table with all necessary fields
- `bookings` table for storing booking data
- Proper indexes for performance
- Row Level Security (RLS) policies

## 4. Add Sample Data (Optional)

1. In the SQL Editor, create another new query
2. Copy and paste the contents of `supabase/seed.sql` from this project
3. Click "Run" to insert sample cleaner data

This adds 15 sample cleaners across different South African cities with:
- Various names and photos
- Different ratings and experience levels
- Multiple service areas
- Different specialties

## 5. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from step 2.

## 6. Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the booking flow:
   ```
   http://localhost:3000/booking/service/select
   ```

3. Complete steps 1-3 and reach the "Select Cleaner" step
4. You should see available cleaners displayed

## 7. Verify Database Setup

In your Supabase dashboard:

1. Go to "Table Editor"
2. You should see:
   - `cleaners` table with sample data
   - `bookings` table (empty initially)

3. Click on `cleaners` table to see the sample cleaners
4. Verify the data looks correct

## Troubleshooting

### "Failed to fetch cleaners" Error

**Check:**
1. Environment variables are set correctly
2. Supabase URL and key are valid
3. Database tables were created successfully
4. RLS policies allow public access

### No Cleaners Showing

**Possible causes:**
1. No cleaners in your selected city
2. All cleaners are booked for the selected date
3. Database connection issues

**To debug:**
1. Check browser console for errors
2. Verify sample data was inserted
3. Try different cities/dates

### Database Connection Issues

**Check:**
1. Project URL is correct (no trailing slash)
2. Anon key is complete and valid
3. Project is not paused (free tier limitation)
4. Network connectivity

### RLS Policy Issues

If you get permission errors:
1. Go to "Authentication" → "Policies" in Supabase
2. Verify the policies from `schema.sql` were created
3. Check that public access is enabled for reading cleaners

## Security Notes

- The `anon` key is safe to use in frontend code
- RLS policies ensure only authorized data access
- Never expose your service role key in frontend code
- All user data is properly isolated

## Production Deployment

For production:
1. Use the same Supabase project or create a new one
2. Add the same environment variables to your hosting platform
3. Consider upgrading from free tier for better performance
4. Set up proper backup schedules

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
