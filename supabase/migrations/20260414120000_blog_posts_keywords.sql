-- SEO keywords for blog posts (used in page metadata)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS keywords TEXT;

COMMENT ON COLUMN blog_posts.keywords IS 'Comma-separated SEO keywords for meta tags';

-- Published flag mirrors status for clarity in SQL/reporting (optional; safe if status uses blog_post_status)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'published'
  ) THEN
    EXECUTE $ddl$
      ALTER TABLE blog_posts
      ADD COLUMN published boolean
      GENERATED ALWAYS AS (status = 'published'::blog_post_status) STORED
    $ddl$;
  END IF;
END $$;
