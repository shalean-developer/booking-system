-- Drop Tables Script
-- Use this to remove all tables created for the cleaner selection feature
-- ⚠️ WARNING: This will delete ALL data in these tables permanently!

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;

-- Drop policies (if they weren't cascade deleted)
DROP POLICY IF EXISTS "Public can view active cleaners" ON cleaners;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view bookings for availability" ON bookings;

-- Optional: Drop indexes (usually cascade deleted with tables, but just in case)
-- DROP INDEX IF EXISTS idx_bookings_cleaner_date;
-- DROP INDEX IF EXISTS idx_cleaners_areas;
-- DROP INDEX IF EXISTS idx_cleaners_active;
-- DROP INDEX IF EXISTS idx_bookings_date;

-- Verify tables are dropped
-- You can run this to check:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('cleaners', 'bookings');

