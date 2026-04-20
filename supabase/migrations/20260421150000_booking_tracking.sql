-- Live job phase for customer tracking (separate from payment/lifecycle `status`).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS tracking_status text;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_tracking_status_check
  CHECK (
    tracking_status IS NULL
    OR tracking_status IN (
      'assigned',
      'en_route',
      'arrived',
      'cleaning',
      'completed'
    )
  );

COMMENT ON COLUMN public.bookings.tracking_status IS 'Live service phase: assigned → en_route → arrived → cleaning → completed';

-- Cache of recent cleaner GPS per booking (e.g. { "cleaner_id": { "lat", "lng", "at" } }).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cleaner_locations jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bookings.cleaner_locations IS 'Optional JSON cache of latest cleaner positions for this job.';
