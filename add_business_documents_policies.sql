-- Add storage policies for business-documents folder in roam-file-storage bucket

-- Allow public read access to business documents
CREATE POLICY "Public read access for business documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'roam-file-storage' 
  AND (name LIKE 'business-documents/%')
);

-- Allow authenticated users to upload business documents
CREATE POLICY "Authenticated users can upload business documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update business documents
CREATE POLICY "Authenticated users can update business documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete business documents  
CREATE POLICY "Authenticated users can delete business documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'roam-file-storage'
  AND (name LIKE 'business-documents/%')
  AND auth.uid() IS NOT NULL
);
