-- Add a flag to avoid duplicate start reminders
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cleaner_start_reminder_sent BOOLEAN DEFAULT FALSE;

-- Optional index to query upcoming reminders efficiently
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_due
  ON bookings (booking_date, booking_time)
  WHERE cleaner_start_reminder_sent = FALSE
    AND status IN ('accepted','on_my_way');


