-- Services Table
-- Stores service metadata including display names, icons, images, and display order

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL UNIQUE,  -- 'Standard', 'Deep', 'Move In/Out', 'Airbnb'
  display_name TEXT NOT NULL,          -- 'Standard Cleaning', 'Deep Cleaning', etc.
  icon TEXT,                           -- Emoji or icon identifier
  image_url TEXT,                      -- Image URL for the service
  display_order INTEGER NOT NULL DEFAULT 0,  -- Order for display
  description TEXT,                    -- Optional description
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_service_type CHECK (
    service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb')
  )
);

-- Create index for active services
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, display_order);

-- Insert default service configurations
INSERT INTO services (service_type, display_name, icon, image_url, display_order, description, is_active)
VALUES
  ('Standard', 'Standard Cleaning', '🏠', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop', 1, 'Regular home cleaning to keep your space fresh and organized', true),
  ('Deep', 'Deep Cleaning', '✨', 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop&auto=format', 2, 'Thorough, intensive cleaning that tackles every corner and surface', true),
  ('Airbnb', 'Airbnb Cleaning', '🏢', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', 3, 'Professional turnover cleaning for short-term rentals', true),
  ('Move In/Out', 'Move In/Out Cleaning', '📦', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop', 4, 'Complete cleaning for property transitions', true)
ON CONFLICT (service_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active services
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Create policy for admin management (using JWT claims, not auth.users query)
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER services_updated_at_trigger
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_services_updated_at();

