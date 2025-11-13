-- Ensure the storage bucket used by banners and products exists and is public

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) THEN
    PERFORM storage.create_bucket('product-images', public := true);
  END IF;
END $$;