-- Automatic dispatch: flag bookings that need ops follow-up (partial team, edge cases).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS dispatch_review_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN bookings.dispatch_review_required IS
  'Set when automatic dispatch could not assign a full team or requires manual review';
