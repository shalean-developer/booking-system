-- Dynamic Pricing Configuration Table
-- Stores all pricing data with history tracking and scheduled price changes

-- Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT,  -- 'Standard', 'Deep', 'Move In/Out', 'Airbnb', NULL for extras/fees
  price_type TEXT NOT NULL,  -- 'base', 'bedroom', 'bathroom', 'extra', 'service_fee', 'frequency_discount'
  item_name TEXT,  -- For extras: 'Inside Fridge', for frequencies: 'weekly', 'bi-weekly', 'monthly'
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),  -- Actual price or discount percentage
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,  -- NULL means currently active
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,  -- Optional notes about the price change
  CONSTRAINT valid_price_type CHECK (
    price_type IN ('base', 'bedroom', 'bathroom', 'extra', 'service_fee', 'frequency_discount')
  ),
  CONSTRAINT valid_service_type CHECK (
    service_type IS NULL OR 
    service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb')
  )
);

-- Create pricing_history table for audit trail
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID REFERENCES pricing_config(id),
  service_type TEXT,
  price_type TEXT NOT NULL,
  item_name TEXT,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,
  effective_date DATE,
  end_date DATE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_active ON pricing_config(is_active, effective_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_type ON pricing_config(price_type, service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_item ON pricing_config(item_name);
CREATE INDEX IF NOT EXISTS idx_pricing_effective ON pricing_config(effective_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_history_config ON pricing_history(pricing_config_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON pricing_history(changed_at);

-- Create trigger to log price changes to history
CREATE OR REPLACE FUNCTION log_pricing_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.price != NEW.price) THEN
    INSERT INTO pricing_history (
      pricing_config_id,
      service_type,
      price_type,
      item_name,
      old_price,
      new_price,
      changed_by,
      changed_at,
      effective_date,
      end_date
    ) VALUES (
      NEW.id,
      NEW.service_type,
      NEW.price_type,
      NEW.item_name,
      OLD.price,
      NEW.price,
      NEW.created_by,
      NOW(),
      NEW.effective_date,
      NEW.end_date
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO pricing_history (
      pricing_config_id,
      service_type,
      price_type,
      item_name,
      old_price,
      new_price,
      changed_by,
      changed_at,
      effective_date,
      end_date
    ) VALUES (
      NEW.id,
      NEW.service_type,
      NEW.price_type,
      NEW.item_name,
      NULL,
      NEW.price,
      NEW.created_by,
      NOW(),
      NEW.effective_date,
      NEW.end_date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_change_trigger
AFTER INSERT OR UPDATE ON pricing_config
FOR EACH ROW
EXECUTE FUNCTION log_pricing_change();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_updated_at_trigger
BEFORE UPDATE ON pricing_config
FOR EACH ROW
EXECUTE FUNCTION update_pricing_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to active pricing
CREATE POLICY "Public can view active pricing" ON pricing_config
  FOR SELECT USING (
    is_active = true 
    AND effective_date <= CURRENT_DATE 
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
  );

-- Admin policies (assuming admin role check function exists)
CREATE POLICY "Admins can manage pricing" ON pricing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view pricing history" ON pricing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to get current active pricing
CREATE OR REPLACE FUNCTION get_active_pricing()
RETURNS TABLE (
  id UUID,
  service_type TEXT,
  price_type TEXT,
  item_name TEXT,
  price DECIMAL(10,2),
  effective_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.service_type,
    pc.price_type,
    pc.item_name,
    pc.price,
    pc.effective_date
  FROM pricing_config pc
  WHERE pc.is_active = true
    AND pc.effective_date <= CURRENT_DATE
    AND (pc.end_date IS NULL OR pc.end_date > CURRENT_DATE)
  ORDER BY pc.price_type, pc.service_type, pc.item_name;
END;
$$ LANGUAGE plpgsql;

