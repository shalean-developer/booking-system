-- Optional geocoordinates for routing / last-job location (map or geocoded address).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS latitude double precision;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.bookings.latitude IS 'Job site latitude (WGS-84), when known from map or geocoding.';
COMMENT ON COLUMN public.bookings.longitude IS 'Job site longitude (WGS-84), when known from map or geocoding.';
