/**
 * Server-only: authorize access to booking-scoped storage (photos).
 * Uses service role only after identity is established (admin / cleaner session / Supabase user).
 */

import { createServiceClient, getServerAuthUser, isAdmin } from '@/lib/supabase-server';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { isValidBookingId } from '@/lib/booking-id';

export type StorageBookingAccess =
  | { ok: true; role: 'admin' | 'customer' | 'cleaner' }
  | { ok: false; status: 400 | 401 | 403; error: string };

/**
 * Validate booking id format (legacy SC / SCS / BK formats supported).
 */
export function validateBookingIdParam(bookingId: unknown): string | null {
  if (typeof bookingId !== 'string') return null;
  const id = bookingId.trim();
  if (!id || !isValidBookingId(id)) return null;
  return id;
}

/**
 * Ensure caller may access storage for this booking:
 * - Admin (customers.role = admin)
 * - Cleaner with cleaner_id or assigned_cleaner_id matching session
 * - Customer: bookings.customer_id matches profile OR bookings.user_id matches auth user
 */
export async function requireBookingStorageAccess(bookingId: string): Promise<StorageBookingAccess> {
  if (await isAdmin()) {
    return { ok: true, role: 'admin' };
  }

  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, customer_id, user_id, cleaner_id, assigned_cleaner_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  if (!booking) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  const authUser = await getServerAuthUser();
  if (authUser) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (booking.user_id && booking.user_id === authUser.id) {
      return { ok: true, role: 'customer' };
    }
    if (customer?.id && booking.customer_id && booking.customer_id === customer.id) {
      return { ok: true, role: 'customer' };
    }
  }

  const cleanerSession = await getCleanerSession();
  if (cleanerSession?.id) {
    const cid = cleanerSession.id;
    if (booking.cleaner_id === cid || booking.assigned_cleaner_id === cid) {
      return { ok: true, role: 'cleaner' };
    }
  }

  if (!authUser && !cleanerSession?.id) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: false, status: 403, error: 'Forbidden' };
}

/** Allowed buckets for signed URL minting (prevents arbitrary bucket access). */
export const STORAGE_PHOTOS_BUCKET = 'booking-photos';

/** Short-lived signed URLs for booking photos (leak risk if TTL is long). */
export const BOOKING_PHOTO_SIGNED_URL_MAX_SECONDS = 60 * 5; // 5 minutes

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export type ImageUploadValidation =
  | { ok: true }
  | { ok: false; status: 400; error: string };

/**
 * Enforce image type and max size for booking photo uploads.
 */
export function validateImageUpload(file: File): ImageUploadValidation {
  if (!file.size || file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      status: 400,
      error: `File must be an image under ${MAX_IMAGE_BYTES / (1024 * 1024)}MB`,
    };
  }
  const mime = (file.type || '').toLowerCase();
  if (!mime || !ALLOWED_IMAGE_MIME.has(mime)) {
    return { ok: false, status: 400, error: 'Only JPEG, PNG, or WebP images are allowed' };
  }
  const name = typeof file.name === 'string' ? file.name : '';
  if (name && !IMAGE_EXT.test(name)) {
    return { ok: false, status: 400, error: 'File extension must be .jpg, .jpeg, .png, or .webp' };
  }
  return { ok: true };
}

/**
 * Parse `booking-photos/<bookingId>/...` and return booking id for authorization.
 */
export function parseBookingIdFromStoragePath(fullPath: string): string | null {
  const trimmed = fullPath.trim().replace(/^\/+/, '');
  if (trimmed.includes('..') || trimmed.includes('\\')) {
    return null;
  }
  if (!trimmed.startsWith(`${STORAGE_PHOTOS_BUCKET}/`)) {
    return null;
  }
  const withoutBucket = trimmed.slice(STORAGE_PHOTOS_BUCKET.length + 1);
  const first = withoutBucket.split('/')[0]?.trim() ?? '';
  if (!first) return null;
  return validateBookingIdParam(first);
}
