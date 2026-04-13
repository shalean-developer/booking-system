-- Links a new customer to the referrer for referral rewards programs.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS referred_by_customer_id UUID REFERENCES customers (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_referred_by
  ON customers (referred_by_customer_id)
  WHERE referred_by_customer_id IS NOT NULL;
