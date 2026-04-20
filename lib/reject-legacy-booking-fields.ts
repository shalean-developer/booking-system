import { NextResponse } from 'next/server';

/**
 * Rejects bodies that still send removed pricing fields (V5.2+).
 * Call immediately after `req.json()` on booking create routes.
 */
export function rejectLegacyBookingPricingFields(body: Record<string, unknown>): NextResponse | null {
  if (Object.prototype.hasOwnProperty.call(body, 'preSurgeTotal')) {
    return NextResponse.json(
      {
        ok: false,
        code: 'LEGACY_FIELD_NOT_ALLOWED',
        error: 'Field preSurgeTotal is no longer accepted; send totalAmount only.',
      },
      { status: 400 }
    );
  }
  return null;
}
