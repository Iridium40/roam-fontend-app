-- Storage policies for roam-provider-documents bucket
-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow providers to upload their own documents
CREATE POLICY "Providers can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND providers.is_active = true
  )
);

-- Policy to allow providers to read their own documents
CREATE POLICY "Providers can read their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND providers.is_active = true
  )
);

-- Policy to allow providers to update their own documents
CREATE POLICY "Providers can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND providers.is_active = true
  )
);

-- Policy to allow providers to delete their own documents
CREATE POLICY "Providers can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND providers.is_active = true
  )
);

-- Alternative simpler policies if the above don't work:
-- These are less secure but more permissive for testing

-- CREATE POLICY "Simple provider documents upload" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'roam-provider-documents'
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Simple provider documents read" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'roam-provider-documents'
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Simple provider documents update" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'roam-provider-documents'
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Simple provider documents delete" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'roam-provider-documents'
--   AND auth.uid() IS NOT NULL
-- );
