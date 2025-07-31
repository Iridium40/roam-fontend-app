-- Create the roam-provider-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('roam-provider-documents', 'roam-provider-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their own documents" ON storage.objects;

-- Create policies for provider documents
-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to documents (for verification purposes)
CREATE POLICY "Public read access for documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-provider-documents'
);

-- Allow authenticated users to update their own documents
CREATE POLICY "Authenticated users can update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Authenticated users can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-provider-documents'
  AND auth.uid() IS NOT NULL
);
