# Customer Profile System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Customer Profiles Table

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste contents of `supabase/customers-table.sql`
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message

**Expected Result:**
```
Success. No rows returned
```

### Step 2: Update Bookings Table

1. Still in SQL Editor
2. Click **New Query**
3. Copy and paste contents of `supabase/update-bookings-for-customers.sql`
4. Click **Run**
5. Verify success message

**Expected Result:**
```
Success. No rows returned
```

### Step 3: Verify Tables

1. Click **Table Editor** (left sidebar)
2. Find `customers` table
3. Check columns exist:
   - ✅ id
   - ✅ email (unique)
   - ✅ phone
   - ✅ first_name
   - ✅ last_name
   - ✅ address_line1
   - ✅ address_suburb
   - ✅ address_city
   - ✅ total_bookings
   - ✅ created_at
   - ✅ updated_at

4. Click `bookings` table
5. Verify new column:
   - ✅ customer_id (nullable)

### Step 4: Test the System

1. Navigate to booking flow: `http://localhost:3000/booking/service/select`
2. Complete steps 1-3
3. **On Step 4 (Contact):**
   - Enter email: `test123@example.com`
   - Tab out (blur email field)
   - Should see: No autofill (new customer)
4. Fill remaining fields
5. Complete booking
6. Check Supabase `customers` table - should see new row
7. **Test returning customer:**
   - Start new booking
   - On Contact step, enter same email: `test123@example.com`
   - Tab out
   - Should see: **"Welcome Back!"** autofill prompt
   - Click "Use Saved Information"
   - All fields autofill
8. Complete booking
9. Check `customers` table - `total_bookings` should be 2

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] `customers` table exists
- [ ] Email has unique constraint
- [ ] Indexes created (check Database → Indexes)
- [ ] RLS enabled (check Database → Policies)
- [ ] `bookings.customer_id` column exists
- [ ] API endpoint `/api/customers?email=test@test.com` works
- [ ] Email blur triggers profile check
- [ ] Autofill prompt appears for returning customers
- [ ] Autofill populates all fields
- [ ] New customers create profiles automatically
- [ ] Returning customers increment `total_bookings`
- [ ] Bookings linked via `customer_id`

---

## 🔍 Quick Test Queries

### Check customers table
```sql
SELECT * FROM customers ORDER BY created_at DESC LIMIT 10;
```

### Count total customers
```sql
SELECT COUNT(*) as total_customers FROM customers;
```

### Count returning customers
```sql
SELECT COUNT(*) as returning_customers 
FROM customers 
WHERE total_bookings > 1;
```

### Top customers by bookings
```sql
SELECT 
  first_name,
  last_name,
  email,
  total_bookings,
  created_at
FROM customers
ORDER BY total_bookings DESC
LIMIT 10;
```

### Customer's booking history
```sql
SELECT 
  b.*,
  c.first_name,
  c.last_name,
  c.total_bookings
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE c.email = 'test@example.com'
ORDER BY b.booking_date DESC;
```

---

## 🐛 Troubleshooting

### Problem: "duplicate key value violates unique constraint"

**Cause:** Trying to create customer with existing email

**Solution:** 
- System should check first (it does)
- If still happening, check API logic
- Verify case-insensitive matching working

### Problem: Autofill not appearing

**Checks:**
1. Browser console - any errors?
2. Network tab - API call successful?
3. Email exactly matches existing profile?
4. `existingProfile` state populated?

**Debug:**
```javascript
// Add to step-contact.tsx temporarily
console.log('Existing profile:', existingProfile);
console.log('Show prompt:', showAutofillPrompt);
```

### Problem: customer_id not saving

**Checks:**
1. `customer_id` column exists in bookings
2. Foreign key constraint not failing
3. UUID format valid
4. Check API logs

---

## 📊 Sample Data (Optional)

Create test customers for development:

```sql
INSERT INTO customers (email, first_name, last_name, phone, address_line1, address_suburb, address_city, total_bookings)
VALUES 
  ('john@test.com', 'John', 'Doe', '0821234567', '123 Main St', 'Sandton', 'Johannesburg', 3),
  ('jane@test.com', 'Jane', 'Smith', '0829876543', '456 Park Ave', 'Sea Point', 'Cape Town', 5),
  ('test@shalean.co.za', 'Test', 'Customer', '0821111111', '789 Oak Rd', 'Constantia', 'Cape Town', 1);
```

Now test autofill with these emails in the Contact form!

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Email blur triggers loading spinner (briefly)
✅ "Welcome Back!" prompt appears for existing emails
✅ Autofill populates all fields smoothly
✅ New customers don't see prompt
✅ Database shows customer profiles
✅ Bookings have customer_id populated
✅ total_bookings increments on repeat bookings

---

**Setup Time:** ~5 minutes
**Testing Time:** ~5 minutes
**Total Time:** ~10 minutes to fully functional customer profile system!

