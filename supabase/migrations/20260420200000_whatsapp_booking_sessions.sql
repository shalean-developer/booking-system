-- WhatsApp auto-booking: conversational state per phone (optional auth link).
CREATE TABLE IF NOT EXISTS public.whatsapp_booking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  phone_e164 text NOT NULL UNIQUE,
  step text NOT NULL DEFAULT 'start',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_booking_sessions_updated_at
  ON public.whatsapp_booking_sessions (updated_at DESC);

COMMENT ON TABLE public.whatsapp_booking_sessions IS
  'Shalean WhatsApp booking wizard state; server-only via service role.';

ALTER TABLE public.whatsapp_booking_sessions ENABLE ROW LEVEL SECURITY;
