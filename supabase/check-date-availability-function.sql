-- Check Date Availability Function
-- Purpose: Check if a date is available for a given service type and return availability details
-- Returns availability status, remaining slots, and surge pricing information

CREATE OR REPLACE FUNCTION check_date_availability(
  p_service_type TEXT,
  p_booking_date DATE
)
RETURNS TABLE (
  available BOOLEAN,
  slots_remaining INTEGER,
  current_bookings INTEGER,
  max_bookings INTEGER,
  surge_pricing_active BOOLEAN,
  surge_percentage DECIMAL,
  uses_teams BOOLEAN,
  available_teams TEXT[]
) AS $$
DECLARE
  v_limit_record RECORD;
  v_booking_count INTEGER;
  v_team_bookings RECORD;
  v_available_teams TEXT[] := ARRAY[]::TEXT[];
  v_all_teams TEXT[] := ARRAY['Team A', 'Team B', 'Team C'];
  v_surge_active BOOLEAN := false;
  v_surge_pct DECIMAL := NULL;
BEGIN
  -- Get scheduling limits for this service type
  SELECT 
    max_bookings_per_date,
    uses_teams,
    surge_pricing_enabled,
    surge_threshold,
    surge_percentage
  INTO v_limit_record
  FROM service_scheduling_limits
  WHERE service_type = p_service_type;

  -- If no limit record found, default to unavailable
  IF v_limit_record IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      false::BOOLEAN,
      NULL::DECIMAL,
      false::BOOLEAN,
      ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- Check if service uses teams
  IF v_limit_record.uses_teams THEN
    -- For team-based services, check which teams are booked
    SELECT 
      COUNT(DISTINCT bt.team_name) as booked_teams,
      array_agg(DISTINCT bt.team_name) as booked_team_names
    INTO v_team_bookings
    FROM booking_teams bt
    INNER JOIN bookings b ON bt.booking_id = b.id
    WHERE b.booking_date = p_booking_date
      AND b.service_type = p_service_type
      AND b.status != 'cancelled';

    v_booking_count := COALESCE(v_team_bookings.booked_teams, 0);
    
    -- Calculate available teams
    IF v_team_bookings.booked_team_names IS NOT NULL THEN
      SELECT array_agg(team) INTO v_available_teams
      FROM unnest(v_all_teams) AS team
      WHERE team != ALL(v_team_bookings.booked_team_names);
    ELSE
      v_available_teams := v_all_teams;
    END IF;

    -- Available if at least one team slot is free
    RETURN QUERY SELECT 
      (v_booking_count < 3)::BOOLEAN,
      (3 - v_booking_count)::INTEGER,
      v_booking_count::INTEGER,
      3::INTEGER,
      false::BOOLEAN, -- Teams don't use surge pricing
      NULL::DECIMAL,
      true::BOOLEAN,
      v_available_teams;
  ELSE
    -- For non-team services, count bookings
    SELECT COUNT(*)
    INTO v_booking_count
    FROM bookings
    WHERE booking_date = p_booking_date
      AND service_type = p_service_type
      AND status != 'cancelled';

    -- Check if surge pricing is active
    v_surge_active := false;
    v_surge_pct := NULL;
    
    IF v_limit_record.surge_pricing_enabled 
       AND v_limit_record.surge_threshold IS NOT NULL 
       AND v_booking_count >= v_limit_record.surge_threshold THEN
      v_surge_active := true;
      v_surge_pct := v_limit_record.surge_percentage;
    END IF;

    -- Available if under max bookings
    RETURN QUERY SELECT 
      (v_booking_count < v_limit_record.max_bookings_per_date)::BOOLEAN,
      GREATEST(0, v_limit_record.max_bookings_per_date - v_booking_count)::INTEGER,
      v_booking_count::INTEGER,
      v_limit_record.max_bookings_per_date::INTEGER,
      v_surge_active::BOOLEAN,
      v_surge_pct,
      false::BOOLEAN,
      ARRAY[]::TEXT[];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION check_date_availability IS 'Checks date availability for a service type, returns availability status, remaining slots, and surge pricing information';

