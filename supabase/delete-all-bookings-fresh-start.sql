-- ============================================
-- DELETE ALL BOOKINGS AND RECURRING SCHEDULES
-- FRESH START - PRESERVES CUSTOMER DATA
-- ============================================
-- Run this in Supabase SQL Editor
-- This will delete all bookings and recurring schedules
-- but preserve customer profiles, cleaners, and other data
-- ============================================

-- STEP 1: Show counts before deletion
SELECT 
  'Before Deletion' as status,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM recurring_schedules) as total_recurring_schedules,
  (SELECT COUNT(*) FROM cleaner_reviews) as total_cleaner_reviews,
  (SELECT COUNT(*) FROM customer_ratings) as total_customer_ratings,
  (SELECT COUNT(*) FROM booking_notes) as total_booking_notes;

-- STEP 2: Delete in correct order to handle foreign key constraints
-- The key insight: bookings references customer_ratings and cleaner_reviews
-- So we must delete bookings FIRST, then ratings/reviews

-- Delete booking notes first (if they exist)
DELETE FROM booking_notes;
COMMENT ON TABLE booking_notes IS 'All booking notes deleted for fresh start';

-- Delete all bookings FIRST (this is what's referenced by other tables)
DELETE FROM bookings;
COMMENT ON TABLE bookings IS 'All bookings deleted for fresh start with new pricing system';

-- Now safe to delete customer ratings (no longer referenced by bookings)
DELETE FROM customer_ratings;
COMMENT ON TABLE customer_ratings IS 'All customer ratings deleted for fresh start';

-- Now safe to delete cleaner reviews (no longer referenced by bookings)
DELETE FROM cleaner_reviews;
COMMENT ON TABLE cleaner_reviews IS 'All cleaner reviews deleted for fresh start';

-- STEP 3: Delete all recurring schedules
DELETE FROM recurring_schedules;
COMMENT ON TABLE recurring_schedules IS 'All recurring schedules deleted for fresh start';

-- STEP 4: Reset customer booking counts (optional - keeps customer profiles clean)
UPDATE customers SET total_bookings = 0;

-- STEP 5: Show counts after deletion
SELECT 
  'After Deletion' as status,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM recurring_schedules) as total_recurring_schedules,
  (SELECT COUNT(*) FROM cleaner_reviews) as total_cleaner_reviews,
  (SELECT COUNT(*) FROM customer_ratings) as total_customer_ratings,
  (SELECT COUNT(*) FROM booking_notes) as total_booking_notes;

-- STEP 6: Verify what's preserved
SELECT 
  'Preserved Data' as status,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM cleaners) as total_cleaners,
  (SELECT COUNT(*) FROM cleaner_applications) as total_applications,
  (SELECT COUNT(*) FROM quotes) as total_quotes;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that customers are preserved
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  total_bookings,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- Check that cleaners are preserved
SELECT 
  id, 
  name, 
  email, 
  phone,
  hire_date
FROM cleaners
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '✅ DELETION COMPLETE!' as message,
  'All bookings and recurring schedules deleted' as action,
  'Customer profiles preserved' as preserved,
  'Ready for fresh bookings with new pricing system' as status;

