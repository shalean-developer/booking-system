-- Migration: Create Support Tickets System
-- Purpose: Enable customers to create and track support tickets
-- Date: 2024

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,                      -- Format: "TKT-{timestamp}-{random}"
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,                   -- Ticket subject
  message TEXT NOT NULL,                   -- Ticket message/details
  category TEXT DEFAULT 'general',         -- 'general', 'booking', 'payment', 'service', 'technical', 'other'
  priority TEXT DEFAULT 'normal',          -- 'low', 'normal', 'high', 'urgent'
  status TEXT DEFAULT 'open',              -- 'open', 'in-progress', 'resolved', 'closed'
  customer_email TEXT,                     -- Customer email (denormalized for quick access)
  customer_name TEXT,                       -- Customer name (denormalized)
  response TEXT,                           -- Admin response/resolution
  resolved_at TIMESTAMPTZ,                 -- When ticket was resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),     -- When ticket was created
  updated_at TIMESTAMPTZ DEFAULT NOW()     -- When ticket was last updated
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets

-- Policy: Customers can view their own tickets
CREATE POLICY "Customers can view their own tickets" ON support_tickets
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Customers can create tickets
CREATE POLICY "Customers can create tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.auth_user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

-- Policy: Admins can update all tickets
CREATE POLICY "Admins can update all tickets" ON support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.auth_user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Add table comment
COMMENT ON TABLE support_tickets IS 'Customer support tickets for tracking and resolving issues';
