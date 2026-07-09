/**
 * Twilio inbound `From` is typically `whatsapp:+27821234567`.
 * Returns E.164 including leading +, or null if invalid.
 */
export function parseTwilioWhatsAppE164(from: string | null | undefined): string | null {
  if (!from) return null;
  const stripped = from.trim().replace(/^whatsapp:/i, '').trim();
  if (!stripped.startsWith('+')) return null;
  if (!/^\+\d{8,15}$/.test(stripped)) return null;
  return stripped;
}
