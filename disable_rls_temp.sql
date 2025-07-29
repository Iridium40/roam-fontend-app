-- Temporarily disable RLS on storage.objects for testing
-- This is a quick fix to get document uploads working
-- Remember to re-enable RLS and add proper policies later

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- To re-enable later with proper policies:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
