-- Auto-assigned cleaner UUIDs (same time window); complements cleaner_id primary.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS assigned_cleaners UUID[] DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN public.bookings.assigned_cleaners IS 'Cleaners assigned to this booking slot (lowest-load dispatch).';

CREATE INDEX IF NOT EXISTS idx_bookings_assigned_cleaners ON public.bookings USING GIN (assigned_cleaners);
