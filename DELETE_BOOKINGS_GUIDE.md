# 🗑️ Delete All Bookings - Quick Start Guide

## ⚠️ Important Notice

This guide helps you **safely delete all bookings and recurring schedules** while preserving customer and cleaner data. This is useful for:
- Starting fresh with the new pricing system
- Clearing test data
- Resetting the booking system

---

## 🎯 What Gets Deleted

✅ **Will be deleted:**
- All bookings (`bookings` table)
- All recurring schedules (`recurring_schedules` table)
- All customer ratings (`customer_ratings` table)
- All cleaner reviews (`cleaner_reviews` table)
- All booking notes (`booking_notes` table)

✅ **Will be preserved:**
- All customer profiles (`customers` table)
- All cleaner profiles (`cleaners` table)
- All job applications (`cleaner_applications` table)
- All service configurations
- All pricing data

---

## 🚀 Method 1: Run SQL Script (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Script
1. Copy the contents of `supabase/delete-all-bookings-fresh-start.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press `Ctrl+Enter`)

### Step 3: Review Results
The script will show you:
- Counts **before** deletion
- Counts **after** deletion
- Preserved data counts

---

## 🔧 Method 2: Delete Tables Manually

If you prefer to delete one table at a time:

### Step 1: Delete Booking Notes
```sql
DELETE FROM booking_notes;
SELECT 'booking_notes deleted: ' || COUNT(*) FROM booking_notes;
```

### Step 2: Delete Bookings
```sql
DELETE FROM bookings;
SELECT 'bookings deleted: ' || COUNT(*) FROM bookings;
```

### Step 3: Delete Customer Ratings
```sql
DELETE FROM customer_ratings;
SELECT 'customer_ratings deleted: ' || COUNT(*) FROM customer_ratings;
```

### Step 4: Delete Cleaner Reviews
```sql
DELETE FROM cleaner_reviews;
SELECT 'cleaner_reviews deleted: ' || COUNT(*) FROM cleaner_reviews;
```

### Step 5: Delete Recurring Schedules
```sql
DELETE FROM recurring_schedules;
SELECT 'recurring_schedules deleted: ' || COUNT(*) FROM recurring_schedules;
```

### Step 6: Reset Customer Booking Counts (Optional)
```sql
UPDATE customers SET total_bookings = 0;
SELECT 'Customer counts reset' as status;
```

---

## ✅ Correct Deletion Order

**IMPORTANT**: You must delete in this exact order to avoid foreign key constraint errors:

1. **booking_notes** (references bookings)
2. **bookings** (references customer_ratings & cleaner_reviews)
3. **customer_ratings** (now safe - no references)
4. **cleaner_reviews** (now safe - no references)
5. **recurring_schedules** (independent)

### ❌ Why Order Matters

If you try to delete `customer_ratings` before `bookings`, you'll get an error:
```
ERROR: 23503: update or delete on table "customer_ratings" 
violates foreign key constraint "bookings_customer_rating_id_fkey" 
on table "bookings"
```

This is because `bookings` still has references to `customer_ratings`.

---

## 🔍 Verify Deletion

After running the deletion, verify everything is clean:

```sql
-- Should all return 0
SELECT 
  (SELECT COUNT(*) FROM bookings) as bookings,
  (SELECT COUNT(*) FROM recurring_schedules) as recurring,
  (SELECT COUNT(*) FROM customer_ratings) as ratings,
  (SELECT COUNT(*) FROM cleaner_reviews) as reviews,
  (SELECT COUNT(*) FROM booking_notes) as notes;

-- Should return your customer and cleaner counts
SELECT 
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM cleaners) as cleaners;
```

---

## 🎉 After Deletion

Once deletion is complete:

1. ✅ All old bookings with incorrect amounts are removed
2. ✅ Customer and cleaner profiles are intact
3. ✅ Ready to create new bookings with correct pricing
4. ✅ New bookings will show proper amounts:
   - Customer bookings: R390+ with R40 service fee
   - Admin one-time: Correct totals with service fee
   - Admin recurring: Correct totals with R0 service fee

---

## 📊 Testing New Bookings

After deletion, test the system:

1. **Customer Booking Flow**:
   - Go to `/booking/service/select`
   - Create a new booking
   - Verify amounts show correctly in admin dashboard
   - Expected: R390+ total, R40 service fee

2. **Admin One-Time Booking**:
   - Go to `/admin` → Bookings → Create Booking
   - Create a one-time booking
   - Verify amounts show correctly
   - Expected: Correct total with service fee

3. **Admin Recurring Booking**:
   - Go to `/admin` → Bookings → Create Recurring
   - Create a recurring booking
   - Verify amounts show correctly
   - Expected: Correct total with R0.00 service fee

---

## 🆘 Troubleshooting

### Error: Foreign Key Constraint Violation
**Solution**: Make sure you're deleting in the correct order (see "Correct Deletion Order" above)

### Error: Permission Denied
**Solution**: Make sure you're logged in as the database owner or have appropriate permissions

### Error: Table Does Not Exist
**Solution**: Some tables might not exist if you haven't created any bookings yet. This is normal, just skip those tables.

---

## 🔒 Safety Notes

- ✅ This script is **safe** - it only deletes booking-related data
- ✅ Customer accounts remain intact
- ✅ Cleaner profiles remain intact
- ✅ You can always create new bookings after deletion
- ⚠️ **Cannot be undone** - make sure you want to delete before running

---

## 📝 Summary

**Quick Steps:**
1. Open Supabase SQL Editor
2. Copy `supabase/delete-all-bookings-fresh-start.sql`
3. Paste and run
4. Verify counts
5. Create new bookings with correct pricing! 🎊

**Need help?** Check the troubleshooting section or reach out for support.

