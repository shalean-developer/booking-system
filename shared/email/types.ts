/**
 * Shared booking confirmation payload — used by Next.js and Supabase Edge.
 */
export type BookingEmailData = {
  customerName: string;
  serviceName: string;
  /** Display ID (may be shortened legacy or full SC… format) */
  bookingId: string;
  amountZar?: number;
  status: 'paid' | 'pending';
  /** Internal Zoho invoice id (API); not always what appears on the PDF. */
  invoiceId?: string;
  /** Human-readable invoice # as on the PDF (e.g. INV-00001). Prefer this for display. */
  invoiceNumber?: string;
  /** Public Supabase Storage URL for the invoice PDF (when uploaded). */
  invoiceUrl?: string;
  /** Shown when paid but no PDF/link could be attached (e.g. Zoho not configured on this deployment). */
  invoicePdfMissingNote?: string;
  /** Human-readable date (e.g. Monday, 16 April 2026) */
  bookingDate?: string;
  /** Time of day label */
  bookingTime?: string;
  /** Single-line postal address */
  address?: string;
  paymentReference?: string;
  /** Equipment upsell line */
  equipmentRequired?: boolean;
  equipmentFeeZar?: number;
  /** Short cleaner assignment message */
  cleanerSummary?: string;
  manageBookingUrl?: string;
  whatsappUrl?: string;
  /** Optional “track / lookup” link */
  trackingUrl?: string;
  /** Public site origin, no trailing slash — for manage links */
  siteBaseUrl?: string;
  /** 64-char hex; used only in /booking/*?token= URLs (never expose UUID) */
  manageToken?: string;
};
