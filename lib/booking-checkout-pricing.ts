import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeSelectedTeamInput } from '@/lib/constants/booking-teams';

/** When true, a failing `check_date_availability` RPC returns 503. When false (default), treat as available if RPC fails. */
function enforceAvailabilityRpc(): boolean {
  return process.env.BOOKING_ENFORCE_AVAILABILITY_RPC?.trim().toLowerCase() === 'true';
}

export type BookingCheckoutAvailabilityParams = {
  date: string;
  service: string;
  selected_team?: string;
};

export type BookingCheckoutAvailabilityOk = {
  ok: true;
  available: true;
};

export type BookingCheckoutAvailabilityErr = {
  ok: false;
  available: false;
  reason: string;
  status: number;
};

/**
 * Date / slot / team availability only — **never** mutates price or applies surge.
 * All ZAR totals come from `calculateFinalBookingPrice` / `computeAuthoritativeBookingPricing`.
 */
export async function runBookingCheckoutAvailability(
  supabase: SupabaseClient,
  params: BookingCheckoutAvailabilityParams
): Promise<BookingCheckoutAvailabilityOk | BookingCheckoutAvailabilityErr> {
  const { date, service } = params;
  const selectedTeam = sanitizeSelectedTeamInput(params.selected_team);

  if (!date || !service) {
    return {
      ok: false,
      available: false,
      reason: 'Booking date and service are required',
      status: 400,
    };
  }

  try {
    const { data: availabilityData, error: availabilityError } = await supabase.rpc(
      'check_date_availability',
      {
        p_service_type: service,
        p_booking_date: date,
      }
    );

    if (availabilityError) {
      console.error('check_date_availability error:', availabilityError);
      if (enforceAvailabilityRpc()) {
        return {
          ok: false,
          available: false,
          reason: 'Unable to confirm availability. Please try again in a moment.',
          status: 503,
        };
      }
      console.warn(
        '[booking-checkout-pricing] Availability RPC failed; allowing checkout. Deploy supabase/check-date-availability-function.sql and seed service_scheduling_limits, or set BOOKING_ENFORCE_AVAILABILITY_RPC=true once the RPC works.'
      );
      return { ok: true, available: true };
    }

    if (availabilityData && availabilityData.length > 0) {
      const availability = availabilityData[0];

      if (!availability.available) {
        return {
          ok: false,
          available: false,
          reason: 'This date is no longer available. Please select another date.',
          status: 400,
        };
      }

      if (service === 'Deep' || service === 'Move In/Out') {
        const available_teams: string[] = Array.isArray(availability.available_teams)
          ? availability.available_teams
          : [];
        const usesTeams = available_teams.length > 0;

        if (usesTeams && selectedTeam && !available_teams.includes(selectedTeam)) {
          console.warn('ERROR SOURCE:', {
            kind: 'selected_team_not_available',
            selected_team: selectedTeam,
            available_teams,
            selectedDate: date,
            service,
          });
          return {
            ok: false,
            available: false,
            reason: `${selectedTeam} is not available on this date. Please select another team or date.`,
            status: 400,
          };
        }
      }
    }
  } catch (e) {
    console.error('runBookingCheckoutAvailability:', e);
    if (enforceAvailabilityRpc()) {
      return {
        ok: false,
        available: false,
        reason: 'Unable to confirm availability. Please try again in a moment.',
        status: 503,
      };
    }
    console.warn('[booking-checkout-pricing] runBookingCheckoutAvailability threw; allowing checkout.', e);
    return { ok: true, available: true };
  }

  return { ok: true, available: true };
}
