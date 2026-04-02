
-- Drop old permissive policies for avatar buckets
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload pet avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update pet avatar" ON storage.objects;

-- Recreate with path isolation: uploads must go into user's own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars-users'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars-users'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload pet avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars-pets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update pet avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars-pets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
