-- Public invoice PDF URLs (Option A). For stricter access, switch to signed URLs later.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Invoice PDFs are publicly readable" ON storage.objects;

CREATE POLICY "Invoice PDFs are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');
