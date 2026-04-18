-- Hybrid earnings v2: approval workflow + calculated/final amounts (cleaner_earnings retained for back-compat)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS earnings_status TEXT,
  ADD COLUMN IF NOT EXISTS earnings_calculated INTEGER,
  ADD COLUMN IF NOT EXISTS earnings_final INTEGER,
  ADD COLUMN IF NOT EXISTS earnings_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS earnings_reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.earnings_status IS 'pending | approved — cleaners see payouts only when approved';
COMMENT ON COLUMN bookings.earnings_calculated IS 'System-calculated total payout in cents (solo: one cleaner; team: sum for all cleaners)';
COMMENT ON COLUMN bookings.earnings_final IS 'Admin-approved total payout in cents; do not recalculate after set';
COMMENT ON COLUMN bookings.earnings_reviewed_by IS 'auth user id of approver';

-- Backfill legacy rows so existing paid/completed flows keep working
UPDATE bookings
SET
  earnings_status = 'approved',
  earnings_calculated = cleaner_earnings,
  earnings_final = cleaner_earnings
WHERE cleaner_earnings IS NOT NULL
  AND earnings_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_earnings_status ON bookings (earnings_status)
  WHERE earnings_status IS NOT NULL;
