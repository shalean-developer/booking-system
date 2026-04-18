-- Time-based fairness metadata (optional; NULL = legacy / unknown duration)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS total_hours INTEGER,
  ADD COLUMN IF NOT EXISTS team_size INTEGER,
  ADD COLUMN IF NOT EXISTS hours_per_cleaner INTEGER,
  ADD COLUMN IF NOT EXISTS hourly_rate_used INTEGER;

COMMENT ON COLUMN bookings.total_hours IS 'Whole hours estimated for the job (optional; used with earnings time floor)';
COMMENT ON COLUMN bookings.team_size IS 'Cleaner count used for earnings time math (may differ from assigned team)';
COMMENT ON COLUMN bookings.hours_per_cleaner IS 'Rounded hours per cleaner for display';
COMMENT ON COLUMN bookings.hourly_rate_used IS 'TARGET_HOURLY_RATE cents/hour snapshot at calculation time';
