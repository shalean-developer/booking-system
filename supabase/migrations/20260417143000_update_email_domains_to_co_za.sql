-- Normalize default/contact domains from .com to .co.za without rewriting historical migrations.
-- Keep legacy .com addresses in RLS allowlists for backward compatibility.

-- 1) company_settings default + existing data
ALTER TABLE IF EXISTS company_settings
  ALTER COLUMN contact_email SET DEFAULT 'info@shalean.co.za';

UPDATE company_settings
SET contact_email = 'info@shalean.co.za'
WHERE lower(contact_email) = 'info@shalean.com';

-- 2) booking team admin policies: prefer .co.za, retain legacy .com entries
DROP POLICY IF EXISTS "Admins can manage booking teams" ON booking_teams;
DROP POLICY IF EXISTS "Admins can manage team members" ON booking_team_members;

CREATE POLICY "Admins can manage booking teams" ON booking_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND lower(auth.users.email) IN (
          'admin@shalean.co.za',
          'bookings@shalean.co.za',
          -- legacy aliases kept so existing admin accounts keep working
          'admin@shalean.com',
          'bookings@shalean.com'
        )
    )
  );

CREATE POLICY "Admins can manage team members" ON booking_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND lower(auth.users.email) IN (
          'admin@shalean.co.za',
          'bookings@shalean.co.za',
          -- legacy aliases kept so existing admin accounts keep working
          'admin@shalean.com',
          'bookings@shalean.com'
        )
    )
  );
