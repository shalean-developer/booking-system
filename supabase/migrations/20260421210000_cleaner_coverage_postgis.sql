-- Cleaner coverage & booking geography (PostGIS). Safe to run once; uses IF NOT EXISTS patterns.

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- cleaners: coverage fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS base_location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS coverage_radius_km integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS working_areas text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.cleaners.base_location IS 'Home/base point for radius coverage (WGS84).';
COMMENT ON COLUMN public.cleaners.coverage_radius_km IS 'Max distance from base (or fallback lat/lng) to accept jobs.';
COMMENT ON COLUMN public.cleaners.working_areas IS 'Named suburbs/areas; empty means fall back to legacy `areas`.';

-- Backfill working_areas from legacy areas (one-time)
UPDATE public.cleaners
SET working_areas = areas
WHERE (working_areas IS NULL OR working_areas = '{}')
  AND areas IS NOT NULL
  AND cardinality(areas) > 0;

-- Optional numeric cache for app-layer distance without decoding WKB (kept in sync by trigger)
ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS base_latitude double precision,
  ADD COLUMN IF NOT EXISTS base_longitude double precision;

CREATE OR REPLACE FUNCTION public.cleaners_sync_base_latlng()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.base_location IS NOT NULL THEN
    NEW.base_latitude := ST_Y(NEW.base_location::geometry);
    NEW.base_longitude := ST_X(NEW.base_location::geometry);
  ELSE
    NEW.base_latitude := NULL;
    NEW.base_longitude := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleaners_base_latlng ON public.cleaners;
CREATE TRIGGER trg_cleaners_base_latlng
  BEFORE INSERT OR UPDATE OF base_location ON public.cleaners
  FOR EACH ROW
  EXECUTE PROCEDURE public.cleaners_sync_base_latlng();

-- ---------------------------------------------------------------------------
-- bookings: area label + geography point (synced from latitude/longitude)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS area text;

COMMENT ON COLUMN public.bookings.location IS 'Job site point (WGS84); mirrors latitude/longitude when set.';
COMMENT ON COLUMN public.bookings.area IS 'Primary service area label (e.g. suburb); mirrors address_suburb when set.';

UPDATE public.bookings
SET area = COALESCE(area, NULLIF(trim(address_suburb), ''))
WHERE area IS NULL AND address_suburb IS NOT NULL;

UPDATE public.bookings
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND longitude BETWEEN -180 AND 180
  AND latitude BETWEEN -90 AND 90;

CREATE OR REPLACE FUNCTION public.sync_booking_location_and_area()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  IF NEW.area IS NULL AND NEW.address_suburb IS NOT NULL AND trim(NEW.address_suburb) <> '' THEN
    NEW.area := trim(NEW.address_suburb);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_location_area ON public.bookings;
CREATE TRIGGER trg_bookings_location_area
  BEFORE INSERT OR UPDATE OF latitude, longitude, address_suburb, area ON public.bookings
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_booking_location_and_area();

-- ---------------------------------------------------------------------------
-- SQL helper: point-in-radius (meters for geography)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_within_radius(
  cleaner_location geography,
  booking_lat double precision,
  booking_lng double precision,
  radius_km integer
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT cleaner_location IS NOT NULL
    AND booking_lat IS NOT NULL
    AND booking_lng IS NOT NULL
    AND ST_DWithin(
      cleaner_location,
      ST_SetSRID(ST_MakePoint(booking_lng, booking_lat), 4326)::geography,
      (GREATEST(COALESCE(radius_km, 10), 1) * 1000)::double precision
    );
$$;

COMMENT ON FUNCTION public.is_within_radius IS 'True if booking point is within radius_km of cleaner_location (geography).';

-- RPC for admin / API: set base point from lat/lng (JS cannot bind geography literals easily)
CREATE OR REPLACE FUNCTION public.set_cleaner_base_location(p_id uuid, p_lat double precision, p_lng double precision)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_lat IS NULL OR p_lng IS NULL OR p_lat < -90 OR p_lat > 90 OR p_lng < -180 OR p_lng > 180 THEN
    UPDATE public.cleaners SET base_location = NULL, updated_at = now() WHERE id = p_id;
    RETURN;
  END IF;
  UPDATE public.cleaners
  SET
    base_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    updated_at = now()
  WHERE id = p_id;
END;
$$;
