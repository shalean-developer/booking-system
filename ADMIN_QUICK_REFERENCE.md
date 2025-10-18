# Admin Dashboard - Quick Reference

## 🚀 First Time Setup (5 minutes)

### Step 1: Run SQL Migration
```sql
-- Open Supabase Dashboard > SQL Editor
-- Paste and execute:

ALTER TABLE customers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE customers ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin'));
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);
```

### Step 2: Make Yourself Admin
```sql
-- Replace with your email:
UPDATE customers 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify:
SELECT email, role FROM customers WHERE role = 'admin';
```

### Step 3: Access Dashboard
1. Login to your account
2. Click **Shield icon** in header (top right)
3. You're in! 🎉

---

## 📋 Common Admin Tasks

### Confirm a Pending Booking
1. **Bookings** tab
2. Find booking (search if needed)
3. Click **Edit** (pencil icon)
4. Select "confirmed" from dropdown
5. Click **Update**

### Approve a Job Application
1. **Applications** tab
2. Filter by "Pending" (optional)
3. Click **View** (eye icon) to review
4. Click **Accept & Create Cleaner**
5. Done! Cleaner profile auto-created

### Add a New Cleaner
1. **Cleaners** tab
2. Click **Add Cleaner**
3. Fill in:
   - Name (required)
   - Contact info
   - Areas: "Sandton, Rosebank, Midrand"
   - Specialties: "Deep cleaning, Move-in"
4. Check **Active** box
5. Click **Create**

### Find a Customer's Bookings
1. **Customers** tab
2. Search by name or email
3. See "Bookings" column for count
4. Switch to **Bookings** tab
5. Search by customer email

### Deactivate a Cleaner (Don't Delete)
1. **Cleaners** tab
2. Find cleaner
3. Click **Edit**
4. Uncheck **Active** box
5. Click **Update**

---

## 🔍 Search & Filter Tips

### Bookings
- **Search bar:** Customer name, email, or booking ID
- **Status filter:** pending/confirmed/completed/cancelled
- **Service type filter:** Select from dropdown

### Customers
- **Search bar:** Name, email, or phone number

### Cleaners
- **Checkbox:** Toggle show/hide inactive cleaners

### Applications
- **Status filter:** pending/reviewing/interviewed/accepted/rejected

---

## ⚠️ Troubleshooting

### Can't See Admin Link
```sql
-- Check your role:
SELECT email, role, auth_user_id FROM customers WHERE email = 'your-email@example.com';

-- If role is 'customer', promote:
UPDATE customers SET role = 'admin' WHERE email = 'your-email@example.com';

-- Then logout and login again
```

### "Access Denied" Error
- Logout completely
- Login again
- Clear browser cache
- Check role in database (see above)

### API Returns 403
```sql
-- Check auth_user_id is linked:
SELECT c.email, c.role, c.auth_user_id 
FROM customers c
WHERE c.email = 'your-email@example.com';

-- If auth_user_id is NULL, you need to link it
-- Login once to auto-link, or manually link
```

---

## 📊 Dashboard Stats Explained

| Metric | Description |
|--------|-------------|
| **Total Revenue** | All-time booking revenue (in cents, shown in Rands) |
| **Recent Revenue** | Last 30 days only |
| **Total Bookings** | All bookings ever created |
| **Recent Bookings** | Created in last 30 days |
| **Pending** | Awaiting confirmation |
| **Confirmed** | Confirmed, not yet completed |
| **Completed** | Finished services |
| **Total Customers** | Registered customer accounts |
| **Active Cleaners** | Cleaners with is_active = true |
| **Pending Applications** | Job applications awaiting review |

---

## 🎯 Best Practices

### Booking Management
✅ Confirm bookings within 24 hours  
✅ Mark as completed after service  
✅ Use delete sparingly (keep for records)  
✅ Search by booking ID for support calls

### Cleaner Management
✅ Always fill in service areas  
✅ Add clear photo URLs  
✅ Deactivate instead of delete  
✅ Keep specialties up to date

### Application Review
✅ Review applications within 3 days  
✅ Check background check consent  
✅ Read full application before deciding  
✅ After accepting, complete cleaner profile

### Customer Service
✅ Use search to find customer quickly  
✅ Check booking history for context  
✅ Update booking status as needed  
✅ Keep notes in console (logged automatically)

---

## 🔐 Security Reminders

- 🔒 Only promote trusted users to admin
- 🔒 Logout when done on shared computers
- 🔒 Don't share admin credentials
- 🔒 Review admin actions in browser console
- 🔒 All actions are server-side validated

---

## 📱 Mobile Usage

The admin dashboard works on mobile but is optimized for desktop. For best experience:
- Use landscape orientation on tablets
- Desktop browser recommended for bulk actions
- Mobile good for quick status updates

---

## 💡 Pro Tips

1. **Use keyboard:** Press Enter in search boxes instead of clicking button
2. **Pagination:** Bottom of each table shows current page
3. **Quick approve:** Accept button in applications table (no need to open details)
4. **Status badges:** Color-coded for quick scanning
5. **Dialogs:** Click outside or press Esc to close

---

## 📞 Need Help?

- Check `ADMIN_DASHBOARD_SETUP.md` for detailed setup
- Check `ADMIN_DASHBOARD_COMPLETE.md` for full implementation details
- Browser console shows detailed error messages
- Supabase dashboard shows database logs

---

**Happy Admin-ing! 🎉**

