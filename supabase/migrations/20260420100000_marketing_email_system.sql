-- Internal marketing: subscribers, behavioral events, idempotent marketing sends

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers (email);

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON public.email_events (user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events (event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events (created_at);

-- At most one automated marketing send per user for these funnel emails
CREATE UNIQUE INDEX IF NOT EXISTS email_events_one_marketing_nudge_per_user
  ON public.email_events (user_id)
  WHERE event_type = 'marketing_nudge_sent';

CREATE UNIQUE INDEX IF NOT EXISTS email_events_one_marketing_reengagement_per_user
  ON public.email_events (user_id)
  WHERE event_type = 'marketing_reengagement_sent';

CREATE UNIQUE INDEX IF NOT EXISTS email_events_one_marketing_repeat_per_user
  ON public.email_events (user_id)
  WHERE event_type = 'marketing_repeat_sent';

CREATE UNIQUE INDEX IF NOT EXISTS email_events_one_marketing_welcome_per_user
  ON public.email_events (user_id)
  WHERE event_type = 'marketing_welcome_sent';

CREATE UNIQUE INDEX IF NOT EXISTS email_events_one_signup_per_user
  ON public.email_events (user_id)
  WHERE event_type = 'signup';

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- No direct client access; server uses service role for writes/reads
