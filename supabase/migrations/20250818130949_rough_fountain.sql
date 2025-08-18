/*
  # Configure Storage policies for media-files bucket

  1. Storage Policies
    - Allow authenticated users to upload files (INSERT)
    - Allow everyone to read files (SELECT) 
    - Allow Admin/Gestionnaire to delete files (DELETE)
    - Allow Admin/Gestionnaire to update files (UPDATE)

  2. Security
    - Upload restricted to authenticated users
    - Delete/Update restricted to Admin/Gestionnaire roles
    - Public read access for published media
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to media-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media-files');

-- Policy: Allow public read access to media-files
CREATE POLICY "Allow public read access to media-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-files');

-- Policy: Allow Admin/Gestionnaire to delete files
CREATE POLICY "Allow Admin/Gestionnaire to delete media-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-files' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Gestionnaire')
  )
);

-- Policy: Allow Admin/Gestionnaire to update files
CREATE POLICY "Allow Admin/Gestionnaire to update media-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-files' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Gestionnaire')
  )
)
WITH CHECK (
  bucket_id = 'media-files' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Gestionnaire')
  )
);