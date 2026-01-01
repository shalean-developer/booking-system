-- Equipment Items Table
-- Stores equipment items that can be provided to customers for Standard/Airbnb cleaning services
-- Managed by admins in the admin dashboard

CREATE TABLE IF NOT EXISTS equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_items_active ON equipment_items(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_equipment_items_order ON equipment_items(display_order) WHERE is_active = true;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS equipment_items_updated_at_trigger ON equipment_items;
CREATE TRIGGER equipment_items_updated_at_trigger
BEFORE UPDATE ON equipment_items
FOR EACH ROW
EXECUTE FUNCTION update_equipment_items_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active equipment items" ON equipment_items;
DROP POLICY IF EXISTS "Admins can manage equipment items" ON equipment_items;

-- Public read access to active equipment items (SELECT only)
CREATE POLICY "Public can view active equipment items" ON equipment_items
  FOR SELECT USING (is_active = true);

-- Admin full access policy
CREATE POLICY "Admins can manage equipment items" ON equipment_items
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

-- Insert default equipment items
INSERT INTO equipment_items (name, display_order, is_active) VALUES
  ('Vacuum cleaner', 1, true),
  ('Mop and bucket', 2, true),
  ('Cleaning solutions', 3, true),
  ('Microfiber cloths', 4, true),
  ('Dusting equipment', 5, true)
ON CONFLICT DO NOTHING;

