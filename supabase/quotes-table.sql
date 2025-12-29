-- Quotes Table Migration
-- Purpose: Store quote requests from customers for cleaning services
-- This table captures all quote form submissions for tracking and follow-up

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,                      -- Format: "QT-{timestamp}"
  service_type TEXT NOT NULL,               -- 'Standard', 'Deep', 'Move In/Out', 'Airbnb'
  bedrooms INTEGER NOT NULL DEFAULT 0,      -- Number of bedrooms
  bathrooms INTEGER NOT NULL DEFAULT 1,     -- Number of bathrooms
  extras TEXT[] DEFAULT '{}',               -- Array of extra services (e.g., ['Inside Fridge', 'Inside Oven'])
  first_name TEXT NOT NULL,                 -- Customer first name
  last_name TEXT NOT NULL,                  -- Customer last name
  email TEXT NOT NULL,                      -- Customer email
  phone TEXT NOT NULL,                      -- Customer phone number
  location TEXT,                            -- Customer location/city for the quote request
  status TEXT DEFAULT 'pending',            -- 'pending', 'contacted', 'converted', 'expired'
  estimated_price INTEGER,                  -- Calculated price in cents/minor currency unit (for internal use)
  notes TEXT,                               -- Optional admin notes for follow-up
  created_at TIMESTAMPTZ DEFAULT NOW(),     -- When quote was requested
  updated_at TIMESTAMPTZ DEFAULT NOW()      -- When quote was last updated
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_location ON quotes(location);

-- Enable Row Level Security (RLS)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
DO $$ 
BEGIN
  -- Create policy for public insert access (quote form submission)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'quotes' 
    AND policyname = 'Public can create quotes'
  ) THEN
    CREATE POLICY "Public can create quotes" ON quotes
      FOR INSERT WITH CHECK (true);
  END IF;

  -- Create policy for authenticated read access (for admin dashboard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'quotes' 
    AND policyname = 'Authenticated users can view quotes'
  ) THEN
    CREATE POLICY "Authenticated users can view quotes" ON quotes
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Create policy for authenticated update access (for admin to update status/notes)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'quotes' 
    AND policyname = 'Authenticated users can update quotes'
  ) THEN
    CREATE POLICY "Authenticated users can update quotes" ON quotes
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE quotes IS 'Stores customer quote requests for cleaning services';
COMMENT ON COLUMN quotes.id IS 'Unique quote identifier in format QT-{timestamp}';
COMMENT ON COLUMN quotes.location IS 'Customer location/city for the quote request';
COMMENT ON COLUMN quotes.estimated_price IS 'Calculated price for internal use only (not shown to customers)';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending (new), contacted (admin reached out), converted (became booking), expired (no response)';

