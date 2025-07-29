-- Emergency fix for storage policy issues
-- Run this in your Supabase SQL editor to fix the upload issues

-- Temporarily disable RLS for testing (ONLY FOR DEVELOPMENT)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- OR use these simpler policies if you want to keep RLS enabled:
-- (Run this after uncommenting the lines below and commenting the line above)

-- DROP POLICY IF EXISTS "Simple storage access" ON storage.objects;
-- CREATE POLICY "Simple storage access" ON storage.objects
-- FOR ALL USING (auth.uid() IS NOT NULL);

-- To re-enable RLS later with proper policies:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
