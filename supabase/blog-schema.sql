-- =====================================================
-- BLOG CMS SYSTEM DATABASE SCHEMA
-- =====================================================
-- This schema creates a full-featured blog system with:
-- - Posts with SEO optimization
-- - Categories and tags for organization
-- - Newsletter subscriber management
-- - RLS policies for security
-- =====================================================

-- Create enum for post status
CREATE TYPE blog_post_status AS ENUM ('draft', 'published');

-- Create enum for newsletter status
CREATE TYPE newsletter_status AS ENUM ('active', 'unsubscribed');

-- =====================================================
-- BLOG CATEGORIES TABLE
-- =====================================================
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster slug lookups
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

-- =====================================================
-- BLOG TAGS TABLE
-- =====================================================
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster slug lookups
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- =====================================================
-- BLOG POSTS TABLE
-- =====================================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  featured_image_alt TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status blog_post_status NOT NULL DEFAULT 'draft',
  meta_title TEXT,
  meta_description TEXT,
  read_time INTEGER DEFAULT 5,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- =====================================================
-- BLOG POST TAGS (Junction Table)
-- =====================================================
CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes for junction table
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- =====================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- =====================================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status newsletter_status NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to blog tables
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BLOG CATEGORIES POLICIES
-- =====================================================

-- Public can read all categories
CREATE POLICY "Categories are viewable by everyone"
  ON blog_categories FOR SELECT
  USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can create categories"
  ON blog_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Only admins can update categories
CREATE POLICY "Only admins can update categories"
  ON blog_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
  ON blog_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- =====================================================
-- BLOG TAGS POLICIES
-- =====================================================

-- Public can read all tags
CREATE POLICY "Tags are viewable by everyone"
  ON blog_tags FOR SELECT
  USING (true);

-- Only admins can manage tags
CREATE POLICY "Only admins can create tags"
  ON blog_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update tags"
  ON blog_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete tags"
  ON blog_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- =====================================================
-- BLOG POSTS POLICIES
-- =====================================================

-- Public can read published posts only
CREATE POLICY "Published posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admins can see all posts (including drafts)
CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Only admins can create posts
CREATE POLICY "Only admins can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Only admins can update posts
CREATE POLICY "Only admins can update posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Only admins can delete posts
CREATE POLICY "Only admins can delete posts"
  ON blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- =====================================================
-- BLOG POST TAGS POLICIES
-- =====================================================

-- Public can read post tags
CREATE POLICY "Post tags are viewable by everyone"
  ON blog_post_tags FOR SELECT
  USING (true);

-- Only admins can manage post tags
CREATE POLICY "Only admins can create post tags"
  ON blog_post_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete post tags"
  ON blog_post_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- =====================================================
-- NEWSLETTER SUBSCRIBERS POLICIES
-- =====================================================

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Only admins can view subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Anyone can update their own subscription status (for unsubscribe)
CREATE POLICY "Anyone can update subscription status"
  ON newsletter_subscribers FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SEED CATEGORIES FOR EXISTING BLOG POSTS
-- =====================================================
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Cleaning Tips', 'cleaning-tips', 'Expert cleaning tips and techniques for maintaining a spotless home'),
  ('Sustainability', 'sustainability', 'Eco-friendly cleaning practices and green products'),
  ('Airbnb Hosts', 'airbnb-hosts', 'Specialized cleaning guides for Airbnb and rental properties');

-- =====================================================
-- HELPFUL VIEWS FOR ADMIN
-- =====================================================

-- View to get posts with category and tag information
CREATE VIEW blog_posts_with_details AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
FROM blog_posts p
LEFT JOIN blog_categories c ON p.category_id = c.id
LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
LEFT JOIN blog_tags t ON pt.tag_id = t.id
GROUP BY p.id, c.name, c.slug;

-- Grant access to view
GRANT SELECT ON blog_posts_with_details TO authenticated, anon;

COMMENT ON TABLE blog_posts IS 'Main blog posts table with full SEO support';
COMMENT ON TABLE blog_categories IS 'Categories for organizing blog posts';
COMMENT ON TABLE blog_tags IS 'Tags for additional post classification';
COMMENT ON TABLE blog_post_tags IS 'Many-to-many relationship between posts and tags';
COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscription list';

