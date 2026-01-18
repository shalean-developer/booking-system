-- Migration: Add Recurring Schedule Rules (per-day times)
-- Purpose: Support custom-weekly/custom-bi-weekly schedules with different times per weekday
-- Date: 2026-01-18

-- Table: recurring_schedule_rules
-- Stores one row per schedule + weekday, including preferred time for that weekday.
CREATE TABLE IF NOT EXISTS recurring_schedule_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES recurring_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  preferred_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT recurring_schedule_rules_unique_day UNIQUE (schedule_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_recurring_schedule_rules_schedule_id
ON recurring_schedule_rules(schedule_id);

CREATE INDEX IF NOT EXISTS idx_recurring_schedule_rules_day_of_week
ON recurring_schedule_rules(day_of_week);

COMMENT ON TABLE recurring_schedule_rules IS 'Per-day rules for recurring schedules (weekday + preferred time)';
COMMENT ON COLUMN recurring_schedule_rules.day_of_week IS 'Day of week (0=Sunday, 1=Monday, etc.)';

-- Enable RLS (match recurring_schedules behavior)
ALTER TABLE recurring_schedule_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage recurring schedule rules
CREATE POLICY "Admins can manage recurring schedule rules" ON recurring_schedule_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()::uuid
      AND customers.role = 'admin'
    )
  );

-- Policy: Customers can view rules for their own schedules
CREATE POLICY "Customers can view their own recurring schedule rules" ON recurring_schedule_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM recurring_schedules rs
      JOIN customers c ON c.id = rs.customer_id
      WHERE rs.id = recurring_schedule_rules.schedule_id
      AND c.id = auth.uid()::uuid
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_recurring_schedule_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recurring_schedule_rules_updated_at ON recurring_schedule_rules;
CREATE TRIGGER trigger_update_recurring_schedule_rules_updated_at
  BEFORE UPDATE ON recurring_schedule_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_schedule_rules_updated_at();

