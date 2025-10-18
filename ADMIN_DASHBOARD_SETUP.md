# Admin Dashboard Setup Guide

## Overview

A comprehensive admin dashboard has been implemented with full CRUD capabilities for managing bookings, customers, cleaners, and job applications. The dashboard features role-based access control to ensure only authorized users can access admin features.

## Implementation Summary

### Database Changes
- ✅ Added `role` column to `customers` table (customer/admin)
- ✅ Created index on role column for fast admin checks
- ✅ SQL migration: `supabase/add-admin-role.sql`

### API Endpoints Created
All endpoints require admin authentication:

1. **`/api/admin/stats`** (GET)
   - Dashboard statistics and metrics
   - Revenue, bookings, customers, cleaners, applications counts

2. **`/api/admin/bookings`** (GET, POST, PUT, DELETE)
   - Full CRUD for bookings
   - Pagination, search, and filtering

3. **`/api/admin/customers`** (GET)
   - View all customers
   - Search and pagination

4. **`/api/admin/cleaners`** (GET, POST, PUT, DELETE)
   - Full CRUD for cleaners
   - Toggle active/inactive status

5. **`/api/admin/applications`** (GET, PUT)
   - Review job applications
   - Approve/reject with automatic cleaner profile creation

### UI Components Created

#### Main Dashboard
- **`app/admin/page.tsx`** - Protected admin dashboard with tab navigation

#### Admin Sections
- **`components/admin/stats-section.tsx`** - Overview metrics and charts
- **`components/admin/bookings-section.tsx`** - Bookings management table
- **`components/admin/customers-section.tsx`** - Customers list
- **`components/admin/cleaners-section.tsx`** - Cleaners management with add/edit
- **`components/admin/applications-section.tsx`** - Applications review

#### UI Components
- **`components/ui/table.tsx`** - Reusable table component

### Helper Functions
- **`lib/supabase-server.ts`**
  - `isAdmin()` - Check if user has admin role
  - `getAuthUserWithProfile()` - Get user with customer profile

### Header Updates
- **`components/header.tsx`**
  - Admin panel link (Shield icon) shown only to admin users
  - Separated Dashboard and Logout buttons

## Setup Instructions

### Step 1: Run Database Migration

Run the SQL migration in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and paste contents of: supabase/add-admin-role.sql
# Execute the SQL
```

### Step 2: Promote Your First Admin User

After running the migration, promote a user to admin:

```sql
-- Option 1: Promote by email
UPDATE customers 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Option 2: Promote by auth_user_id (if you know it)
UPDATE customers 
SET role = 'admin' 
WHERE auth_user_id = 'your-auth-user-id';

-- Verify the update
SELECT email, role FROM customers WHERE role = 'admin';
```

### Step 3: Test Admin Access

1. **Login** with the admin account
2. **Navigate** to the Admin Dashboard (Shield icon in header)
3. **Verify** you can access all sections

## Features

### 📊 Dashboard (Overview)
- Total revenue and recent revenue (30 days)
- Booking counts by status (pending, confirmed, completed)
- Total customers
- Active cleaners count
- Pending applications

### 📅 Bookings Management
- View all bookings with pagination
- Search by customer name, email, or booking ID
- Filter by status and service type
- Update booking status (pending → confirmed → completed)
- Delete bookings with confirmation
- View full booking details

### 👥 Customers List
- View all registered customers
- Search by name, email, or phone
- See customer booking history count
- View customer roles (admin/customer)
- Pagination support

### 🧹 Cleaners Management
- View all cleaners (active and inactive)
- Add new cleaner profiles
- Edit cleaner details:
  - Name, email, phone
  - Photo URL
  - Bio and years of experience
  - Service areas (comma-separated)
  - Specialties
  - Active/inactive status
- Delete cleaners with confirmation
- Toggle show/hide inactive cleaners

### 📝 Applications Review
- View all job applications
- Filter by status (pending, reviewing, interviewed, accepted, rejected)
- View full application details:
  - Contact information
  - Cover letter
  - Work experience
  - Certifications
  - Availability
  - References
  - Background check consent
- Approve applications:
  - Automatically creates cleaner profile
  - Updates application status to "accepted"
- Reject applications
- Pagination support

## Security Features

✅ **Role-Based Access Control**
- All admin routes check authentication + admin role
- Non-admin users see "Access Denied"
- Guest users redirected to login

✅ **Database Security**
- RLS policies remain in place
- Admin checks happen server-side
- No client-side bypass possible

✅ **Action Logging**
- All admin actions logged to console
- Audit trail for debugging and compliance

✅ **Confirmation Dialogs**
- Delete operations require confirmation
- Prevents accidental data loss

## Admin Workflow Examples

### Approving a Job Application

1. Navigate to **Applications** tab
2. Click **View** (eye icon) to see full application
3. Review candidate details, cover letter, experience
4. Click **Accept & Create Cleaner** button
5. System automatically:
   - Updates application status to "accepted"
   - Creates cleaner profile with basic info
   - Returns success message
6. Navigate to **Cleaners** tab to complete cleaner profile

### Managing Bookings

1. Navigate to **Bookings** tab
2. Search for specific booking or filter by status
3. Click **Edit** (pencil icon) to update status
4. Select new status from dropdown
5. Click **Update** to save changes
6. Optionally **Delete** booking if needed

### Adding a New Cleaner

1. Navigate to **Cleaners** tab
2. Click **Add Cleaner** button
3. Fill in required information:
   - Name (required)
   - Contact details
   - Photo URL
   - Bio
   - Years of experience
   - Service areas (e.g., "Sandton, Rosebank, Midrand")
   - Specialties (e.g., "Deep cleaning, Move-in/out")
4. Toggle **Active** checkbox
5. Click **Create**

## Troubleshooting

### "Access Denied" Error

**Problem:** User can login but sees "Access Denied" on admin page

**Solution:**
```sql
-- Check if user has customer profile
SELECT * FROM customers WHERE email = 'user@example.com';

-- If profile exists, promote to admin
UPDATE customers SET role = 'admin' WHERE email = 'user@example.com';

-- If no profile exists, create one
INSERT INTO customers (email, first_name, last_name, role, auth_user_id)
VALUES (
  'user@example.com',
  'Admin',
  'User',
  'admin',
  'auth-user-id-here'
);
```

### Admin Link Not Showing in Header

**Problem:** Admin user doesn't see Shield icon

**Solution:**
1. Clear browser cache and refresh
2. Logout and login again
3. Verify role in database:
```sql
SELECT email, role FROM customers WHERE email = 'user@example.com';
```

### API Returns 403 Forbidden

**Problem:** Admin API calls return 403 error

**Solution:**
- Verify user is logged in
- Check role in database
- Verify `auth_user_id` links auth account to customer profile:
```sql
SELECT c.email, c.role, c.auth_user_id 
FROM customers c
WHERE c.email = 'user@example.com';
```

## Future Enhancements

Potential features to add:

- 📊 Analytics charts and graphs
- 📧 Email notifications for admin actions
- 📱 Mobile-optimized admin dashboard
- 🔍 Advanced filtering and sorting
- 📄 Export data to CSV/PDF
- 📅 Booking calendar view
- 💬 Customer communication tools
- 📈 Revenue reports by date range
- 🔔 Real-time notifications for new bookings/applications

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Review Supabase logs for API errors
3. Verify database permissions and RLS policies
4. Ensure all environment variables are set correctly

---

**Admin Dashboard Implementation Complete** ✅

The system is fully functional and ready for production use. Make sure to run the database migration and promote your first admin user before testing.

