import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateSurgePricing } from '@/lib/surge-pricing';

/** When true, a failing `check_date_availability` RPC returns 503. When false (default), checkout uses cart total without surge (DB migration optional). */
function enforceAvailabilityRpc(): boolean {
  return process.env.BOOKING_ENFORCE_AVAILABILITY_RPC?.trim().toLowerCase() === 'true';
}

function pricingWithoutSurge(preSurgeTotalZar: number): CheckoutPricingOk {
  return {
    ok: true,
    preSurgeTotalZar,
    finalTotalZar: preSurgeTotalZar,
    surgePricingApplied: false,
    surgeAmountZar: 0,
  };
}

export type CheckoutPricingOk = {
  ok: true;
  preSurgeTotalZar: number;
  finalTotalZar: number;
  surgePricingApplied: boolean;
  surgeAmountZar: number;
};

export type CheckoutPricingErr = {
  ok: false;
  error: string;
  status: number;
};

/**
 * Applies availability + surge the same way as checkout. Surge is computed on the pre-surge total (cart in ZAR).
 * If the `check_date_availability` RPC errors, defaults to cart total (no surge) unless `BOOKING_ENFORCE_AVAILABILITY_RPC=true`.
 */
export async function computeCheckoutPricing(
  supabase: SupabaseClient,
  params: { date: string; service: string; preSurgeTotalZar: number; selected_team?: string }
): Promise<CheckoutPricingOk | CheckoutPricingErr> {
  const { date, service, selected_team: selectedTeam } = params;
  const preSurgeTotalZar = params.preSurgeTotalZar;

  if (!date || !service) {
    return { ok: false, error: 'Booking date and service are required', status: 400 };
  }

  if (typeof preSurgeTotalZar !== 'number' || !Number.isFinite(preSurgeTotalZar) || preSurgeTotalZar <= 0) {
    return { ok: false, error: 'Invalid total amount', status: 400 };
  }

  let surgePricingApplied = false;
  let surgeAmountZar = 0;
  let finalTotalZar = preSurgeTotalZar;

  try {
    const { data: availabilityData, error: availabilityError } = await supabase.rpc('check_date_availability', {
      p_service_type: service,
      p_booking_date: date,
    });

    if (availabilityError) {
      console.error('check_date_availability error:', availabilityError);
      if (enforceAvailabilityRpc()) {
        return {
          ok: false,
          error: 'Unable to confirm availability. Please try again in a moment.',
          status: 503,
        };
      }
      console.warn(
        '[booking-checkout-pricing] Availability RPC failed; using cart total without surge. Deploy supabase/check-date-availability-function.sql and seed service_scheduling_limits, or set BOOKING_ENFORCE_AVAILABILITY_RPC=true once the RPC works.'
      );
      return pricingWithoutSurge(preSurgeTotalZar);
    }

    if (availabilityData && availabilityData.length > 0) {
      const availability = availabilityData[0];

      if (!availability.available) {
        return {
          ok: false,
          error: 'This date is no longer available. Please select another date.',
          status: 400,
        };
      }

      if (availability.surge_pricing_active && availability.surge_percentage) {
        const surgeInfo = calculateSurgePricing(
          preSurgeTotalZar,
          availability.current_bookings,
          availability.current_bookings >= 70 ? 70 : null,
          Number(availability.surge_percentage)
        );

        if (surgeInfo.isActive) {
          surgePricingApplied = true;
          surgeAmountZar = surgeInfo.surgeAmount;
          finalTotalZar = surgeInfo.finalAmount;
        }
      }

      if (service === 'Deep' || service === 'Move In/Out') {
        if (selectedTeam && availability.available_teams && !availability.available_teams.includes(selectedTeam)) {
          return {
            ok: false,
            error: `${selectedTeam} is not available on this date. Please select another team or date.`,
            status: 400,
          };
        }
      }
    }
  } catch (e) {
    console.error('computeCheckoutPricing:', e);
    if (enforceAvailabilityRpc()) {
      return {
        ok: false,
        error: 'Unable to confirm availability. Please try again in a moment.',
        status: 503,
      };
    }
    console.warn(
      '[booking-checkout-pricing] computeCheckoutPricing threw; using cart total without surge.',
      e
    );
    return pricingWithoutSurge(preSurgeTotalZar);
  }

  return {
    ok: true,
    preSurgeTotalZar,
    finalTotalZar,
    surgePricingApplied,
    surgeAmountZar,
  };
}
