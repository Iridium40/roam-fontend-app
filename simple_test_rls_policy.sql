-- Simple test policy to debug the RLS issue
-- Execute this in Supabase SQL Editor to temporarily allow all authenticated uploads

-- Drop existing business documents policies
DROP POLICY IF EXISTS "Allow authenticated uploads to business documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads of business documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to business documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes of business documents" ON storage.objects;

-- Create very simple policy for testing
CREATE POLICY "Simple business documents policy" ON storage.objects
FOR ALL USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);

-- To debug further, you can also temporarily check what auth.uid() returns:
-- SELECT auth.uid(), auth.role();
