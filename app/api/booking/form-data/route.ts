import { NextResponse } from 'next/server';
import { getBookingFormData } from '@/lib/booking-form-data-server';
import { isPayLaterAllowed } from '@/lib/booking-env';
import { DEFAULT_QUICK_CLEAN_SETTINGS } from '@/lib/quick-clean-settings';

/**
 * API endpoint to fetch all booking form data (services, extras, pricing)
 * Public endpoint - no authentication required
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getBookingFormData();
    return NextResponse.json({
      ok: true,
      services: data.services,
      pricing: data.pricing,
      extras: data.extras,
      equipment: data.equipment,
      allowPayLater: isPayLaterAllowed(),
      quickCleanSettings: data.quickCleanSettings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        ok: false,
        error: message,
        allowPayLater: false,
        services: [],
        pricing: null,
        extras: {
          all: [],
          standardAndAirbnb: [],
          deepAndMove: [],
          quantityExtras: [],
          meta: {},
          prices: {},
        },
        equipment: {
          items: [],
          charge: 500,
        },
        quickCleanSettings: DEFAULT_QUICK_CLEAN_SETTINGS,
      },
      { status: 500 }
    );
  }
}
