-- Payment lifecycle + idempotent Paystack reference (webhook retries)

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

COMMENT ON COLUMN public.bookings.payment_status IS 'Paystack: pending | success | failed (set with payment capture).';

-- One Paystack reference per booking (nullable until paid)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_payment_reference_unique
  ON public.bookings (payment_reference)
  WHERE payment_reference IS NOT NULL AND btrim(payment_reference) <> '';
