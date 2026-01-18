-- Migration: Add Recurring Invoices + Paystack Authorization Storage
-- Purpose:
-- - Support "pay once" for a set of recurring bookings (invoice/group payment)
-- - Store Paystack reusable authorization for monthly auto-charges
-- Date: 2026-01-18

-- =========================
-- 1) Recurring invoices table
-- =========================
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL,

  -- Period this invoice covers
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- For cron-created monthly invoices (YYYY-MM). Nullable for rolling 30-day windows.
  month_year TEXT,

  -- Total amount in cents (ZAR subunits)
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),

  -- Paystack transaction reference (unique per invoice)
  payment_reference TEXT NOT NULL UNIQUE,

  -- pending | paid | failed | requires_action
  status TEXT NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_customer_id
ON recurring_invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_schedule_id
ON recurring_invoices(recurring_schedule_id)
WHERE recurring_schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_month_year
ON recurring_invoices(month_year)
WHERE month_year IS NOT NULL;

COMMENT ON TABLE recurring_invoices IS 'Group payment records for recurring bookings (one payment_reference covers multiple bookings).';
COMMENT ON COLUMN recurring_invoices.month_year IS 'Month this invoice covers (YYYY-MM) for monthly cron invoices.';
COMMENT ON COLUMN recurring_invoices.total_amount IS 'Total invoice amount in cents.';
COMMENT ON COLUMN recurring_invoices.payment_reference IS 'Paystack transaction reference for this invoice.';

-- updated_at trigger (reuse existing helper if present)
CREATE OR REPLACE FUNCTION update_recurring_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recurring_invoices_updated_at ON recurring_invoices;
CREATE TRIGGER trigger_update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_invoices_updated_at();

-- =========================
-- 2) Link bookings to invoices
-- =========================
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES recurring_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_invoice_id
ON bookings(invoice_id)
WHERE invoice_id IS NOT NULL;

COMMENT ON COLUMN bookings.invoice_id IS 'Links booking to a recurring invoice/group payment.';

-- =========================
-- 3) Store Paystack reusable authorization on customers
-- =========================
-- Ensure optional auth + role columns exist (used by policies / admin tooling)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_unique
  ON customers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

DO $$
BEGIN
  ALTER TABLE customers ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS paystack_authorization_email TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS paystack_authorization_reusable BOOLEAN;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS paystack_authorization_signature TEXT;

COMMENT ON COLUMN customers.paystack_authorization_code IS 'Paystack reusable authorization code for recurring charges.';
COMMENT ON COLUMN customers.paystack_authorization_email IS 'Email used when authorization code was generated (must match for charge_authorization).';
COMMENT ON COLUMN customers.paystack_authorization_reusable IS 'Whether the Paystack authorization is reusable.';
COMMENT ON COLUMN customers.paystack_authorization_signature IS 'Paystack authorization signature (useful for tracking card).';

-- =========================
-- 4) Row Level Security (optional, safe defaults)
-- =========================
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Admins can manage recurring invoices
DROP POLICY IF EXISTS "Admins can manage recurring invoices" ON recurring_invoices;
CREATE POLICY "Admins can manage recurring invoices" ON recurring_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_user_id = auth.uid()
      AND c.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_user_id = auth.uid()
      AND c.role = 'admin'
    )
  );

-- Customers can view their own recurring invoices (auth-only)
DROP POLICY IF EXISTS "Customers can view their own recurring invoices" ON recurring_invoices;
CREATE POLICY "Customers can view their own recurring invoices" ON recurring_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = recurring_invoices.customer_id
      AND c.auth_user_id = auth.uid()
    )
  );

