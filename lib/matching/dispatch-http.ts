import { NextResponse } from 'next/server';
import type { DispatchResolveErr } from '@/lib/dispatch/resolve-booking-cleaner';
import { triggerCleanerInvite } from '@/lib/matching/trigger-cleaner-invite';

/**
 * Maps dispatch failures to HTTP responses. For NO_SUPPLY, returns structured JSON for the booking UI.
 */
export function jsonFromDispatchFailure(
  dispatch: DispatchResolveErr,
  opts?: { area?: string | null; time?: string | null; baseUrl?: string },
): NextResponse {
  if (dispatch.code === 'NO_SUPPLY') {
    if (opts?.area && opts?.time) {
      void triggerCleanerInvite({
        area: opts.area,
        time: opts.time,
        baseUrl: opts.baseUrl,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        success: false,
        code: 'NO_SUPPLY',
        message: dispatch.error,
        fallback: dispatch.fallback ?? {
          suggestNextSlot: true,
          triggerAutoInvite: true,
        },
      },
      { status: dispatch.status },
    );
  }
  return NextResponse.json({ ok: false, error: dispatch.error }, { status: dispatch.status });
}
