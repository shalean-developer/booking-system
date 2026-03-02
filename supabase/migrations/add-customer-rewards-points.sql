-- Purpose: Add rewards_points to customers for hybrid rewards (single source: lib/rewards.ts).
-- Tier is derived from points in app code; no rewards_tier column.

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS rewards_points INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN customers.rewards_points IS 'Loyalty points from completed bookings; tier derived in app from lib/rewards.';

-- One-time backfill: set points from existing completed bookings (100 pts per completed, matching POINTS_PER_COMPLETED_BOOKING).
UPDATE customers c
SET rewards_points = COALESCE(
  (SELECT COUNT(*)::integer FROM bookings b WHERE b.customer_id = c.id AND b.status = 'completed'),
  0
) * 100;
