-- Payment / Zoho / audit columns for bookings (pay-later + Edge Functions flow)
-- Existing bookings keep current behavior; new columns are additive.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS paystack_ref TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT;

COMMENT ON COLUMN public.bookings.user_id IS 'Optional link to Supabase Auth user (pay-later flow).';
COMMENT ON COLUMN public.bookings.price IS 'Total in ZAR (decimal) for reporting; mirrors total_amount/100 when set.';
COMMENT ON COLUMN public.bookings.paystack_ref IS 'Paystack transaction reference (sync with payment_reference when used).';
COMMENT ON COLUMN public.bookings.zoho_invoice_id IS 'Zoho Books invoice id after successful payment.';

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_paystack_ref ON public.bookings (paystack_ref)
  WHERE paystack_ref IS NOT NULL;

-- Idempotent webhook processing (Paystack may retry)
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  paystack_reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_paystack_webhook_ref ON public.paystack_webhook_events (paystack_reference);

ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;

-- No client access; service role only
CREATE POLICY "paystack_webhook_events_no_access" ON public.paystack_webhook_events
  FOR ALL USING (false) WITH CHECK (false);

-- Optional outbound email audit log
CREATE TABLE IF NOT EXISTS public.email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  booking_id TEXT REFERENCES public.bookings (id) ON DELETE SET NULL,
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending_retry')),
  provider_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

CREATE INDEX IF NOT EXISTS idx_email_send_logs_booking ON public.email_send_logs (booking_id);

ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_send_logs_no_access" ON public.email_send_logs
  FOR ALL USING (false) WITH CHECK (false);

-- Backfill price from total_amount (stored in cents in existing schema)
UPDATE public.bookings
SET
  price = (total_amount::NUMERIC / 100.0)
WHERE
  price IS NULL
  AND total_amount IS NOT NULL;

UPDATE public.bookings
SET
  paystack_ref = payment_reference
WHERE
  paystack_ref IS NULL
  AND payment_reference IS NOT NULL;
