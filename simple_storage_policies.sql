-- Simple temporary storage policies for roam-provider-documents bucket
-- These are more permissive for testing - run these if the main policies don't work

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their own documents" ON storage.objects;

-- Simple policies that just check for authentication
CREATE POLICY "Simple provider documents upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Simple provider documents read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Simple provider documents update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Simple provider documents delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

-- Alternatively, disable RLS temporarily for testing:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
