-- Temporary permissive policy for business documents testing
-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public read access for business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete business documents" ON storage.objects;

-- Create very permissive policies for testing
CREATE POLICY "Allow all business document uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
);

CREATE POLICY "Allow all business document reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-file-storage' 
  AND (name LIKE 'business-documents/%')
);

CREATE POLICY "Allow all business document updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
);

CREATE POLICY "Allow all business document deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
);
