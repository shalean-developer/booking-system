-- Programmatic SEO pages: /services/[slug] (e.g. city or area landing pages)
-- Prerequisites:
--   - blog_post_status enum and update_updated_at_column() from supabase/blog-schema.sql
--   - is_admin() from supabase/fix-blog-admin-access.sql (or equivalent) for admin RLS policies

CREATE TABLE IF NOT EXISTS service_location_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  hero_subtitle TEXT,
  city TEXT NOT NULL,
  region TEXT,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  featured_image TEXT,
  status blog_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_location_pages_slug ON service_location_pages(slug);
CREATE INDEX IF NOT EXISTS idx_service_location_pages_status ON service_location_pages(status);
CREATE INDEX IF NOT EXISTS idx_service_location_pages_published_at ON service_location_pages(published_at DESC);

DROP TRIGGER IF EXISTS update_service_location_pages_updated_at ON service_location_pages;
CREATE TRIGGER update_service_location_pages_updated_at
  BEFORE UPDATE ON service_location_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE service_location_pages ENABLE ROW LEVEL SECURITY;

-- Idempotent policy refresh (same pattern as blog_posts)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'service_location_pages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON service_location_pages', policy_record.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can view all service_location_pages" ON service_location_pages
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert service_location_pages" ON service_location_pages
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update service_location_pages" ON service_location_pages
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete service_location_pages" ON service_location_pages
  FOR DELETE
  USING (is_admin());

CREATE POLICY "Public can view published service_location_pages" ON service_location_pages
  FOR SELECT
  USING (status = 'published');

GRANT SELECT ON service_location_pages TO anon, authenticated;

COMMENT ON TABLE service_location_pages IS 'Programmatic SEO landing pages under /services/[slug]';
