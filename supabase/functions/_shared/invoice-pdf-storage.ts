import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BUCKET = 'invoices';

/** Upload PDF to public `invoices` bucket; object key `invoices/{bookingId}.pdf`. */
export async function uploadBookingInvoicePdf(
  supabase: SupabaseClient,
  bookingId: string,
  pdf: Uint8Array,
): Promise<string | null> {
  const filePath = `invoices/${bookingId}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) {
    console.error('[invoice-pdf-storage] upload failed', error);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl ?? null;
}
