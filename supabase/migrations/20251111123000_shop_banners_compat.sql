-- Compatibility migration to ensure required Supabase resources exist
-- - Creates public.shop_banners table (if missing)
-- - Ensures update_updated_at_column() function and trigger
-- - Creates Storage bucket `product-images` (if missing) and basic RLS policies
-- - Uses broad `authenticated` policies to avoid dependency on custom role helpers

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.shop_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  link TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_banners ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if exist
DROP POLICY IF EXISTS "Anyone can view active shop banners" ON public.shop_banners;
DROP POLICY IF EXISTS "Admins can manage shop banners" ON public.shop_banners;
DROP POLICY IF EXISTS "Authenticated can manage shop banners" ON public.shop_banners;

-- Public read of active banners
CREATE POLICY "Anyone can view active shop banners"
ON public.shop_banners
FOR SELECT
USING (active = true);

-- Authenticated users can manage banners (broad until roles are configured)
CREATE POLICY "Authenticated can manage shop banners"
ON public.shop_banners
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_shop_banners_updated_at ON public.shop_banners;
CREATE TRIGGER update_shop_banners_updated_at
  BEFORE UPDATE ON public.shop_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_shop_banners_order ON public.shop_banners(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_shop_banners_active ON public.shop_banners(active);

-- Ensure Storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for product-images bucket
-- Drop policies (if exist) to avoid duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read product-images'
  ) THEN
    DROP POLICY "Anyone can read product-images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can upload product-images'
  ) THEN
    DROP POLICY "Authenticated can upload product-images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can update product-images'
  ) THEN
    DROP POLICY "Authenticated can update product-images" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can delete product-images'
  ) THEN
    DROP POLICY "Authenticated can delete product-images" ON storage.objects;
  END IF;
END $$;

-- Public read policy (bucket scope)
CREATE POLICY "Anyone can read product-images" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated users can insert/update/delete only within product-images bucket
CREATE POLICY "Authenticated can upload product-images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated can update product-images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated can delete product-images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');