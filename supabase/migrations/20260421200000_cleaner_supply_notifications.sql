-- Supply-side activation: track WhatsApp/email alerts to cleaners when demand exceeds supply.

CREATE TABLE IF NOT EXISTS public.cleaner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  message text NOT NULL,
  shortage_level text NOT NULL CHECK (shortage_level IN ('medium', 'high')),
  area_label text,
  demand_ratio numeric(12, 4) NOT NULL DEFAULT 0,
  channel text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened boolean NOT NULL DEFAULT false,
  responded boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cleaner_notifications_cleaner_sent
  ON public.cleaner_notifications (cleaner_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_cleaner_notifications_sent_at
  ON public.cleaner_notifications (sent_at DESC);

COMMENT ON TABLE public.cleaner_notifications IS
  'Throttled supply alerts to cleaners (demand vs availability); opened/responded for future analytics.';

ALTER TABLE public.cleaner_notifications ENABLE ROW LEVEL SECURITY;
