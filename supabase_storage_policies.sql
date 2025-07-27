-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to avatar images
CREATE POLICY "Public read access for avatar images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-file-storage' 
  AND (name LIKE 'avatar-provider-user/%')
);

-- Policy to allow providers to upload their own avatar images
CREATE POLICY "Providers can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND name LIKE CONCAT('avatar-provider-user/', providers.id::text, '-%')
  )
);

-- Policy to allow providers to update/replace their own avatar images
CREATE POLICY "Providers can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND name LIKE CONCAT('avatar-provider-user/', providers.id::text, '-%')
  )
);

-- Policy to allow providers to delete their own avatar images
CREATE POLICY "Providers can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.providers 
    WHERE providers.user_id = auth.uid()
    AND name LIKE CONCAT('avatar-provider-user/', providers.id::text, '-%')
  )
);

-- Alternative simpler policies if the above don't work (less secure but functional):
-- These policies check if the filename starts with the provider's ID

-- CREATE POLICY "Providers upload avatars simple" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'roam-file-storage'
--   AND (name LIKE 'avatar-provider-user/%')
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Providers update avatars simple" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'roam-file-storage'
--   AND (name LIKE 'avatar-provider-user/%')
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Providers delete avatars simple" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'roam-file-storage'
--   AND (name LIKE 'avatar-provider-user/%')
--   AND auth.uid() IS NOT NULL
-- );
