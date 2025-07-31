-- Fix RLS policies for business documents uploads
-- Execute this SQL in your Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies for business documents
DROP POLICY IF EXISTS "Public read access for business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete business documents" ON storage.objects;

-- Create policies for business documents in roam-file-storage bucket
CREATE POLICY "Allow authenticated uploads to business documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow public reads of business documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-file-storage' 
  AND (name LIKE 'business-documents/%')
);

CREATE POLICY "Allow authenticated updates to business documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow authenticated deletes of business documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);
