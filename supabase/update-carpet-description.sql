-- Update Carpet Cleaning Service Description
-- This script updates the Carpet service description to match other services

UPDATE services 
SET 
  description = 'Deep extraction & refreshing',
  updated_at = NOW()
WHERE service_type = 'Carpet';

-- Verify the update
SELECT 
  service_type,
  display_name,
  description,
  is_active,
  updated_at
FROM services
WHERE service_type = 'Carpet';
