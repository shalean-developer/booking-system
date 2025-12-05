-- Discount Codes Table
-- Stores discount codes that customers can use when booking services

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  min_purchase_amount DECIMAL(10,2) DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_discount_amount DECIMAL(10,2), -- NULL means no limit (for percentage discounts)
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL means no expiration
  usage_limit INTEGER, -- NULL means unlimited uses
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  is_active BOOLEAN DEFAULT true,
  applicable_services TEXT[], -- NULL or empty means all services
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_codes_validity ON discount_codes(valid_from, valid_until) WHERE is_active = true;

-- Create table to track discount code usage per booking
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE RESTRICT,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  original_amount DECIMAL(10,2) NOT NULL CHECK (original_amount >= 0),
  final_amount DECIMAL(10,2) NOT NULL CHECK (final_amount >= 0),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  customer_email TEXT,
  UNIQUE(booking_id) -- One discount code per booking
);

-- Create indexes for discount code usage
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_booking ON discount_code_usage(booking_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_customer ON discount_code_usage(customer_email);

-- Add comment for documentation
COMMENT ON TABLE discount_codes IS 'Stores discount codes that customers can apply during booking';
COMMENT ON TABLE discount_code_usage IS 'Tracks which discount codes were used for which bookings';

