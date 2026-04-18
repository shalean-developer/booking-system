/**
 * Canonical support contact: voice and WhatsApp are different numbers.
 *
 * .env.local (NEXT_PUBLIC_* are available in the browser bundle):
 * - NEXT_PUBLIC_SUPPORT_CALL_DISPLAY — shown in UI (default +27 87 153 5250)
 * - NEXT_PUBLIC_SUPPORT_CALL_TEL — tel: target, e.g. +27871535250 (optional; derived from display if unset)
 * - NEXT_PUBLIC_SUPPORT_WHATSAPP_E164 — WhatsApp only, digits e.g. 27825915525
 * - NEXT_PUBLIC_WHATSAPP_NUMBER — optional legacy alias for the same digits (if E164 unset)
 * - NEXT_PUBLIC_SUPPORT_WHATSAPP_DISPLAY — optional label e.g. +27 82 591 5525
 *
 * Legacy: NEXT_PUBLIC_SUPPORT_PHONE — if set and CALL_* / WHATSAPP_E164 are unset, used as the call line only.
 */

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

const DEFAULT_CALL_DISPLAY = '+27 87 153 5250';
const DEFAULT_WA_E164 = '27825915525';
const DEFAULT_WA_DISPLAY = '+27 82 591 5525';

const legacySupportPhone = () => process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();

function resolveCallDisplay(): string {
  const v = process.env.NEXT_PUBLIC_SUPPORT_CALL_DISPLAY?.trim();
  if (v) return v;
  const leg = legacySupportPhone();
  if (leg) return leg;
  return DEFAULT_CALL_DISPLAY;
}

function resolveCallTel(): string {
  const explicit = process.env.NEXT_PUBLIC_SUPPORT_CALL_TEL?.trim();
  if (explicit) {
    const t = explicit.replace(/^tel:/i, '');
    if (t.startsWith('+')) return t;
    const d = digitsOnly(t);
    return d ? `+${d}` : '+27871535250';
  }
  const d = digitsOnly(resolveCallDisplay());
  if (d.length >= 10) return `+${d}`;
  return '+27871535250';
}

function resolveWaE164(): string {
  const explicit = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_E164?.trim();
  if (explicit) return digitsOnly(explicit) || DEFAULT_WA_E164;
  const legacyNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (legacyNumber) return digitsOnly(legacyNumber) || DEFAULT_WA_E164;
  return DEFAULT_WA_E164;
}

function resolveWaDisplay(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_DISPLAY?.trim() || DEFAULT_WA_DISPLAY;
}

/** Human-readable call line (voice only). */
export const SUPPORT_PHONE_DISPLAY = resolveCallDisplay();

/** `tel:` link for the call line. */
export const SUPPORT_PHONE_HREF = (() => {
  const t = resolveCallTel();
  return `tel:${t}`;
})();

/** WhatsApp deep link (no pre-filled text). */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${resolveWaE164()}`;

/** Human-readable WhatsApp line (for copy in emails). */
export const SUPPORT_WHATSAPP_DISPLAY = resolveWaDisplay();

export function supportWhatsAppUrlWithText(prefill: string): string {
  return `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(prefill)}`;
}

/** City stored on bookings when the form only captures suburb in `workingArea`. */
export const BOOKING_DEFAULT_CITY = 'Cape Town';
