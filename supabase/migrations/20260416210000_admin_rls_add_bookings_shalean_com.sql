-- Include operational admin inbox in booking-teams RLS allowlist
DROP POLICY IF EXISTS "Admins can manage booking teams" ON booking_teams;
DROP POLICY IF EXISTS "Admins can manage team members" ON booking_team_members;

CREATE POLICY "Admins can manage booking teams" ON booking_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'admin@shalean.co.za',
        'admin@shalean.com',
        'bookings@shalean.com'
      )
    )
  );

CREATE POLICY "Admins can manage team members" ON booking_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'admin@shalean.co.za',
        'admin@shalean.com',
        'bookings@shalean.com'
      )
    )
  );
