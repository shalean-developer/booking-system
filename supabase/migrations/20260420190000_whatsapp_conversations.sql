-- WhatsApp AI sales agent: one row per inbound user (E.164 phone).
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE,
  last_intent text,
  last_message text,
  last_reply text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_updated_at
  ON public.whatsapp_conversations (updated_at DESC);

COMMENT ON TABLE public.whatsapp_conversations IS
  'Shalean WhatsApp sales bot memory: last intent and messages per phone; server-only.';

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
