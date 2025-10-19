# Cleaner Login Testing Guide

## Quick Test Credentials

### Test Cleaner 1: John Doe
- **Phone**: `0123456789` or `+27123456789`
- **Password**: `test123`
- **Auth Method**: Both password and OTP

### Test Cleaner 2: Jane Smith
- **Phone**: `0987654321` or `+27987654321`
- **Password**: `test456`
- **Auth Method**: Both password and OTP

### Test Cleaner 3: Mike Johnson
- **Phone**: `0555123456` or `+27555123456`
- **Password**: N/A (OTP only)
- **Auth Method**: OTP only

## Setup Steps

### 1. Verify Database State
Run this SQL in Supabase SQL Editor to check current state:
```sql
-- File: supabase/verify-cleaners.sql
-- This will show you the current state of cleaners and constraints
```

### 2. Create Test Cleaners
Run this SQL in Supabase SQL Editor to create test cleaners:
```sql
-- File: supabase/test-cleaner-setup.sql
-- This will delete existing test cleaners and create new ones with correct password hashes
```

### 3. Test Login
1. Navigate to `/cleaner/login`
2. Use the credentials above
3. Check browser console for debug logs

## Debug Information

The authentication system now includes detailed logging. When you attempt to login, check the browser console for:

- 🔍 Phone number normalization
- ✅/❌ Cleaner found status
- 🔐 Password verification results
- ❌ Specific error messages

## Troubleshooting

### Issue: "Invalid phone or password"
**Possible causes:**
1. Test cleaners not created in database
2. Wrong phone number format
3. Password hash mismatch

**Solutions:**
1. Run `supabase/verify-cleaners.sql` to check database state
2. Run `supabase/test-cleaner-setup.sql` to create test cleaners
3. Use exact phone numbers: `0123456789` or `+27123456789`

### Issue: "Cleaner not found"
**Check:**
1. Phone number normalization (should convert `0123456789` to `+27123456789`)
2. Cleaner exists in database with `is_active = true`
3. Phone number matches exactly in database

### Issue: "Password auth not enabled"
**Check:**
1. Cleaner has `password_hash` field populated
2. `auth_provider` is set to `'password'` or `'both'`

### Issue: "Invalid password"
**Check:**
1. Password hash in database matches the password
2. Run `node scripts/generate-password-hash.js` to verify hashes

## Regenerating Password Hashes

If you need to regenerate password hashes:

```bash
node scripts/generate-password-hash.js
```

This will output new bcrypt hashes that you can copy into the SQL file.

## Database Verification Queries

### Check if test cleaners exist:
```sql
SELECT 
  id,
  name,
  phone,
  auth_provider,
  is_active,
  is_available,
  password_hash IS NOT NULL as has_password
FROM cleaners
WHERE phone IN ('+27123456789', '+27987654321', '+27555123456')
ORDER BY name;
```

### Check unique constraint:
```sql
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'cleaners'::regclass 
  AND conname = 'cleaners_phone_unique';
```

### Check for duplicate phones:
```sql
SELECT 
  phone, 
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names
FROM cleaners 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;
```

## Expected Console Output

When login works correctly, you should see:
```
🔍 Searching for cleaner with phone: +27123456789
✅ Cleaner found: {id: "...", name: "John Doe", phone: "+27123456789", auth_provider: "both", is_active: true, has_password: true}
🔐 Verifying password...
✅ Password verified successfully for: John Doe
✅ Cleaner logged in: John Doe +27123456789
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Cleaner not found | Run test-cleaner-setup.sql |
| 401 Unauthorized | Wrong password hash | Regenerate hashes with script |
| 401 Unauthorized | Phone format mismatch | Use exact format: `0123456789` |
| Database error | Missing constraint | Run cleaners-auth.sql migration |
| Login redirect fails | Session not set | Check cookie settings |

## Next Steps After Login

Once logged in successfully:
1. You should be redirected to `/cleaner/dashboard`
2. Check that the cleaner session is properly set
3. Test other dashboard features
4. Remove debug logs in production

---

**Status**: Ready for testing ✅  
**Last Updated**: Generated with correct password hashes
