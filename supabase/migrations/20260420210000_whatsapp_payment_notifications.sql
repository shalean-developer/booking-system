-- Idempotent log for WhatsApp messages sent after Paystack success (one row per booking).
CREATE TABLE IF NOT EXISTS public.whatsapp_payment_notifications (
  booking_id text NOT NULL PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'paid_confirmation',
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_payment_notifications_sent_at
  ON public.whatsapp_payment_notifications (sent_at DESC);

COMMENT ON TABLE public.whatsapp_payment_notifications IS
  'WhatsApp payment confirmation deduplication; server-only.';

ALTER TABLE public.whatsapp_payment_notifications ENABLE ROW LEVEL SECURITY;
