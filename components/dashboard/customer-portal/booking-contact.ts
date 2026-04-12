import type { Booking } from './types';

const DIGITS = /\D/g;

function normalizeWa(input: string): string {
  const d = input.replace(DIGITS, '');
  if (d.startsWith('0')) return `27${d.slice(1)}`;
  if (d.startsWith('27')) return d;
  return d;
}

/** E.164-style tel href for cleaner, or null if no number on file. */
export function cleanerTelHref(booking: Pick<Booking, 'cleanerPhone'>): string | null {
  const raw = booking.cleanerPhone?.trim();
  if (!raw) return null;
  const d = raw.replace(DIGITS, '');
  if (!d) return null;
  return `tel:${raw.startsWith('+') ? raw : `+${d}`}`;
}

export function cleanerWhatsAppHref(booking: Pick<Booking, 'cleanerPhone'>): string | null {
  const raw = booking.cleanerPhone?.trim();
  if (!raw) return null;
  const wa = normalizeWa(raw);
  if (!wa) return null;
  return `https://wa.me/${wa}`;
}

export function supportTelHref(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  if (!raw) return null;
  return `tel:${raw}`;
}

export function supportWhatsAppHref(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  if (!raw) return null;
  const wa = normalizeWa(raw);
  return wa ? `https://wa.me/${wa}` : null;
}
