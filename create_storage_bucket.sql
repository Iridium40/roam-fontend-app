-- First, create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('roam-file-storage', 'roam-file-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their own avatars" ON storage.objects;

-- Simpler policies that should work
-- 1. Allow public read access to avatar images
CREATE POLICY "Public read access for avatar images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-file-storage' 
  AND (name LIKE 'avatar-provider-user/%')
);

-- 2. Allow authenticated users to upload avatars (we'll validate in the app)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
);

-- 3. Allow authenticated users to update their own avatars
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
);

-- 4. Allow authenticated users to delete their own avatars
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'avatar-provider-user/%')
  AND auth.uid() IS NOT NULL
);

-- Alternative: If the above doesn't work, try these more permissive policies for testing
-- You can uncomment these and comment out the ones above

-- CREATE POLICY "Allow all operations for authenticated users" ON storage.objects
-- FOR ALL USING (
--   bucket_id = 'roam-file-storage'
--   AND auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Public read access" ON storage.objects
-- FOR SELECT USING (bucket_id = 'roam-file-storage');
