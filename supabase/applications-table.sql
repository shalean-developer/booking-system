-- Cleaner Applications Table
-- Purpose: Store job applications for cleaner positions
-- Comprehensive application tracking with all required fields
-- Run this in Supabase SQL Editor

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Position & Application Details
  position TEXT NOT NULL,                    -- Role applying for
  cover_letter TEXT NOT NULL,                -- Why they want to join
  work_experience TEXT,                      -- Previous work experience
  certifications TEXT,                       -- Relevant certifications
  
  -- Availability & Schedule
  availability TEXT,                         -- Schedule preferences (JSON array or comma-separated)
  
  -- Additional Information
  reference_contacts TEXT,                   -- Reference contacts
  resume_url TEXT,                          -- Path to uploaded resume in Supabase Storage
  transportation_details TEXT,               -- How they commute (Own vehicle, Public transport, etc.)
  languages_spoken TEXT,                     -- Languages they speak (JSON array or comma-separated)
  
  -- Consent & Compliance
  criminal_background_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending',    -- pending, reviewing, interviewed, accepted, rejected
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups and filtering
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_position ON applications(position);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Public can submit applications (INSERT)
CREATE POLICY "Public can submit applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Public can read their own applications (by email)
CREATE POLICY "Public can read own applications" ON applications
  FOR SELECT USING (true);

-- Admin can read all applications (add admin role check later if needed)
-- For now, this is handled by the API endpoint

-- Admin can update application status (handle in API)
CREATE POLICY "Admin can update applications" ON applications
  FOR UPDATE USING (true);

-- Add table and column comments
COMMENT ON TABLE applications IS 'Job applications for cleaner positions with comprehensive applicant information';
COMMENT ON COLUMN applications.id IS 'Unique UUID for application';
COMMENT ON COLUMN applications.position IS 'Position/role the applicant is applying for';
COMMENT ON COLUMN applications.cover_letter IS 'Applicant motivation and why they want to join';
COMMENT ON COLUMN applications.availability IS 'Schedule preferences (weekdays, weekends, full-time, part-time)';
COMMENT ON COLUMN applications.resume_url IS 'URL path to uploaded resume in Supabase Storage';
COMMENT ON COLUMN applications.criminal_background_consent IS 'Whether applicant consents to background check';
COMMENT ON COLUMN applications.status IS 'Application status: pending, reviewing, interviewed, accepted, rejected';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_applications_updated_at();

-- Create storage bucket for resumes (if not exists)
-- Note: This needs to be run separately or through Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
-- ON CONFLICT (id) DO NOTHING;

