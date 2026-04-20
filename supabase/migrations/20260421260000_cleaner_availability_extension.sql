-- Extended availability for cleaner mobile app (hours + areas mirror; is_online syncs with cleaners.is_available via app)

CREATE TABLE IF NOT EXISTS public.cleaner_availability (
  cleaner_id UUID PRIMARY KEY REFERENCES public.cleaners (id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  available_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  service_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cleaner_availability IS 'Cleaner marketplace availability: online flag, working hours JSON, service_areas (mirrors cleaners.areas when synced)';

CREATE INDEX IF NOT EXISTS idx_cleaner_availability_updated ON public.cleaner_availability (updated_at DESC);

INSERT INTO public.cleaner_availability (cleaner_id, is_online, service_areas)
SELECT
  c.id,
  COALESCE(c.is_available, TRUE),
  COALESCE(c.areas, ARRAY[]::TEXT[])
FROM public.cleaners c
ON CONFLICT (cleaner_id) DO NOTHING;
