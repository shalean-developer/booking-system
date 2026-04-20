-- Funnel + growth analytics (ads, SEO, referrals). Server writes via API with service role or anon insert.

CREATE TABLE IF NOT EXISTS public.growth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_events_type_created_idx
  ON public.growth_events (event_type, created_at DESC);

COMMENT ON TABLE public.growth_events IS 'Marketing funnel events: page_view, booking_started, purchase, referral_click, seo_page_view';

ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.growth_events TO anon, authenticated;
GRANT SELECT ON public.growth_events TO authenticated;

CREATE POLICY "growth_events_anon_insert"
  ON public.growth_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
