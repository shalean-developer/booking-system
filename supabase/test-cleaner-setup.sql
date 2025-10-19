-- Test Cleaner Account Setup
-- Run this in Supabase SQL Editor to create test cleaner accounts
-- Note: Run the cleaners-auth.sql migration first to add the unique constraint!

-- First, check if we need to add the unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cleaners_phone_unique'
  ) THEN
    ALTER TABLE cleaners ADD CONSTRAINT cleaners_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Clean up any existing test cleaners first
DELETE FROM cleaners WHERE phone IN ('+27123456789', '+27987654321', '+27555123456');

-- Test Cleaner 1: John Doe (Password: test123)
-- Phone: +27123456789
INSERT INTO cleaners (
  name,
  phone,
  email,
  areas,
  photo_url,
  rating,
  bio,
  years_experience,
  specialties,
  is_active,
  is_available,
  password_hash,
  auth_provider
) VALUES (
  'John Doe',
  '+27123456789',
  'john@shalean.co.za',
  ARRAY['Cape Town', 'Sea Point', 'Green Point', 'Camps Bay', 'Clifton'],
  null,
  5.0,
  'Experienced professional cleaner with 5 years in the industry',
  5,
  ARRAY['Deep cleaning', 'Move-in/out', 'Standard cleaning'],
  true,
  true,
  '$2a$10$64/YhXR6FcaHFnK/o9sEAuKKfUwUartlxeSLL/q4UVNM9Y.sB3Hmu', -- Password: test123
  'both' -- Supports both password and OTP login
);

-- Test Cleaner 2: Jane Smith (Password: test456)
-- Phone: +27987654321
INSERT INTO cleaners (
  name,
  phone,
  email,
  areas,
  photo_url,
  rating,
  bio,
  years_experience,
  specialties,
  is_active,
  is_available,
  password_hash,
  auth_provider
) VALUES (
  'Jane Smith',
  '+27987654321',
  'jane@shalean.co.za',
  ARRAY['Cape Town', 'Constantia', 'Claremont', 'Rondebosch', 'Newlands'],
  null,
  4.8,
  'Detail-oriented cleaner specializing in eco-friendly cleaning',
  3,
  ARRAY['Eco-friendly cleaning', 'Airbnb cleaning', 'Office cleaning'],
  true,
  true,
  '$2a$10$0BDtrDw8FpI2puVjgfsXe.40kVZLthM7b93ph9leEKacTUrT1yYla', -- Password: test456
  'both'
);

-- Test Cleaner 3: Mike Johnson (OTP only)
-- Phone: +27555123456
INSERT INTO cleaners (
  name,
  phone,
  email,
  areas,
  photo_url,
  rating,
  bio,
  years_experience,
  specialties,
  is_active,
  is_available,
  password_hash,
  auth_provider
) VALUES (
  'Mike Johnson',
  '+27555123456',
  'mike@shalean.co.za',
  ARRAY['Cape Town', 'Milnerton', 'Table View', 'Bloubergstrand'],
  null,
  4.9,
  'Reliable cleaner with excellent customer reviews',
  4,
  ARRAY['Move-in/out', 'Deep cleaning', 'Post-construction'],
  true,
  true,
  null, -- No password - OTP only
  'otp' -- Only OTP login allowed
);

-- Verify cleaners were created
SELECT 
  id,
  name,
  phone,
  auth_provider,
  is_active,
  is_available,
  areas,
  rating
FROM cleaners
WHERE phone IN ('+27123456789', '+27987654321', '+27555123456')
ORDER BY name;

-- Note: To generate your own password hash:
-- 1. Use this Node.js command:
--    const bcrypt = require('bcryptjs');
--    console.log(bcrypt.hashSync('your-password', 10));
--
-- 2. Or use an online bcrypt generator (use cost factor 10)

