# Admin Cleaner Password Management - Complete Guide

## Overview

The admin dashboard now includes comprehensive password and phone number management for cleaners. Admins can securely set up cleaner login credentials through the UI.

## Features Implemented

### 1. ✅ Password Management API
- **Endpoint**: `/api/admin/cleaners/set-password`
- Securely hashes passwords using bcrypt (10 salt rounds)
- Normalizes phone numbers to +27 format
- Validates password strength (minimum 6 characters)
- Requires admin authentication

### 2. ✅ Enhanced Admin Cleaners Form
- Add/edit cleaners with password and authentication method
- Password field (optional when editing)
- Phone number with auto-normalization hint
- Authentication method selector:
  - **Password Only** - Cleaner logs in with phone + password
  - **OTP Only** - Cleaner logs in with SMS OTP code
  - **Both** - Cleaner can use either method

### 3. ✅ Set Password Dialog
- Quick access via Key 🔑 icon in cleaners table
- Password confirmation field
- Real-time validation feedback
- Current phone number display
- Update authentication method

### 4. ✅ Enhanced Table Display
- **Auth column** shows login method with color-coded badges:
  - 🔵 Blue: Password Only
  - 🟣 Purple: OTP Only
  - 🟢 Green: Both Methods
- **Shield icon** indicates if cleaner has password set
- Quick action buttons: Edit, Set Password, Delete

## How to Use

### Setting Up a New Cleaner

1. **Go to Admin Dashboard** → Cleaners section
2. **Click "Add Cleaner"** button
3. **Fill in required fields**:
   - Name (required)
   - Phone (required) - e.g., `0123456789` or `+27123456789`
   - Password (required for new cleaners)
   - Login Method (default: Both)
   - Other details (email, bio, areas, etc.)
4. **Click "Create"**

The system will:
- Normalize the phone number to +27 format
- Hash the password securely
- Set up the authentication method

### Changing an Existing Cleaner's Password

**Method 1: Quick Set Password (Recommended)**
1. In the cleaners table, find the cleaner
2. Click the **Key 🔑 icon** in the Actions column
3. Enter new password (min 6 characters)
4. Confirm password
5. Choose authentication method
6. Click "Update Credentials"

**Method 2: Edit Cleaner Form**
1. Click the **Edit icon** for the cleaner
2. Enter a new password in the password field
3. Leave blank to keep current password
4. Update other fields as needed
5. Click "Update"

### Understanding Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Password Only** | Cleaner must use phone + password | Cleaners who prefer traditional login |
| **OTP Only** | Cleaner receives SMS code to login | Cleaners without set passwords or prefer SMS |
| **Both** | Cleaner can use either method | Maximum flexibility (recommended) |

### Phone Number Format

The system automatically normalizes phone numbers:
- Input: `0123456789` → Stored as: `+27123456789`
- Input: `123456789` → Stored as: `+27123456789`
- Input: `+27123456789` → Stored as: `+27123456789`

All South African numbers are converted to international format (+27).

## Security Features

✅ **Password Hashing**: Passwords are hashed using bcrypt (10 rounds) before storage
✅ **No Plain Text**: Passwords never stored or transmitted in plain text
✅ **Server-side Validation**: All validation happens server-side
✅ **Admin Only**: Only authenticated admins can manage credentials
✅ **Session-based Auth**: Uses secure HTTP-only cookies

## Testing the Login

After setting up a cleaner's credentials:

1. **Navigate to**: `/cleaner/login`
2. **Choose login method**:
   - **Password tab**: Enter phone + password
   - **OTP tab**: Enter phone, receive SMS code
3. **Login** and verify access to cleaner dashboard

### Test Credentials

If you ran the test setup SQL, these cleaners exist:

| Name | Phone | Password | Method |
|------|-------|----------|--------|
| John Doe | +27123456789 | test123 | Both |
| Jane Smith | +27987654321 | test456 | Both |
| Mike Johnson | +27555123456 | N/A | OTP Only |

## Troubleshooting

### "Failed to create cleaner" or "Cleaner API error: {}"
**Most Common Cause:** The `cleaners-auth.sql` migration hasn't been run yet!

The `auth_provider`, `password_hash`, and other auth fields don't exist in your database.

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the verification script: `supabase/migrations/verify-cleaners-auth-fields.sql`
3. If you see "MISSING" statuses, run the migration: `supabase/migrations/cleaners-auth.sql`
4. Try creating the cleaner again

**Other possible causes:**
- Missing required fields (name or phone)
- Phone number format issue
- Database constraint violation (duplicate phone)
- Admin authentication failing

**Debug Steps:**
1. Check browser console for these logs:
   - "Sending cleaner data:" - Shows what data is being sent
   - "Response status:" - Shows HTTP status code
   - "HTTP Error:" - Shows actual error message
2. Ensure you're logged in as an admin user
3. Verify phone number is unique and valid (e.g., `0123456789`)
4. Check Supabase logs in Dashboard → Logs

### "Password must be at least 6 characters"
- Ensure password is 6+ characters
- Password field validates in real-time

### "Passwords do not match"
- Re-enter the confirmation password
- Both fields must match exactly

### "Invalid phone number format"
- Use format: `0123456789` or `+27123456789`
- Must be 8-15 digits after normalization

### "Password auth not enabled for this cleaner"
- Cleaner's `auth_provider` is set to `otp` only
- Change authentication method to `password` or `both`

### Cleaner can't login after setting password
1. Verify phone number matches exactly (check in admin table)
2. Ensure `auth_provider` is `password` or `both`
3. Check if cleaner is marked as `is_active: true`
4. Try using the Set Password dialog again

### Debugging Tips
- Check browser console for detailed error messages
- Look for "Cleaner API error:" or "Password API error:" logs
- Verify all required database fields are provided
- Ensure phone numbers are in valid format before saving

## Alternative: SQL Method

If you prefer to set passwords via SQL (for bulk operations or scripting):

```sql
-- Generate password hash using Node.js:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('your-password', 10));

-- Update cleaner credentials
UPDATE cleaners 
SET 
  phone = '+27123456789',
  password_hash = '$2a$10$...your.bcrypt.hash...',
  auth_provider = 'both',
  is_active = true
WHERE id = 'cleaner-uuid-here';
```

## Files Modified

- ✅ `app/api/admin/cleaners/set-password/route.ts` - New password management API
- ✅ `components/admin/cleaners-section.tsx` - Enhanced UI with password features

## API Reference

### POST `/api/admin/cleaners/set-password`

**Request Body**:
```json
{
  "id": "uuid",
  "password": "newpassword123",
  "phone": "0123456789",
  "auth_provider": "both"
}
```

**Response** (Success):
```json
{
  "ok": true,
  "cleaner": { /* updated cleaner object */ },
  "message": "Credentials updated successfully"
}
```

**Response** (Error):
```json
{
  "ok": false,
  "error": "Password must be at least 6 characters"
}
```

## Related Documentation

- See `CLEANER_LOGIN_TEST.md` for login testing
- See `lib/cleaner-auth.ts` for authentication logic
- See `CLEANERS_DASHBOARD_COMPLETE.md` for overall system overview

---

**✅ Implementation Complete!**

Admins can now fully manage cleaner login credentials through the dashboard UI.

