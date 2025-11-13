-- Ensure image_urls is jsonb and trigger sync uses jsonb
BEGIN;

-- Prefer jsonb column; convert text[] to jsonb if needed
DO $$
DECLARE
  col_udt text;
BEGIN
  SELECT c.udt_name INTO col_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'products' AND c.column_name = 'image_urls';

  IF col_udt IS NULL THEN
    ALTER TABLE public.products ADD COLUMN image_urls jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE public.products ALTER COLUMN image_urls SET NOT NULL;
  ELSIF col_udt = 'text' THEN
    -- Convert existing text[] to jsonb
    ALTER TABLE public.products ALTER COLUMN image_urls DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN image_urls TYPE jsonb USING to_jsonb(image_urls);
    ALTER TABLE public.products ALTER COLUMN image_urls SET DEFAULT '[]'::jsonb;
    ALTER TABLE public.products ALTER COLUMN image_urls SET NOT NULL;
  END IF;
END $$;

-- Replace function with jsonb-aware version
CREATE OR REPLACE FUNCTION public.products_image_urls_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  max_images integer := 10;
  urls jsonb;
  principal text;
BEGIN
  principal := NEW.image_url;
  urls := COALESCE(NEW.image_urls, '[]'::jsonb);

  urls := COALESCE(
    (SELECT jsonb_agg(v) FROM (
      SELECT DISTINCT v FROM jsonb_array_elements_text(urls) v WHERE v IS NOT NULL
    ) s),
    '[]'::jsonb
  );

  IF principal IS NOT NULL THEN
    urls := jsonb_build_array(principal) || COALESCE(
      (SELECT jsonb_agg(v) FROM (
        SELECT DISTINCT v FROM jsonb_array_elements_text(urls) v WHERE v IS DISTINCT FROM principal
      ) s),
      '[]'::jsonb
    );
  END IF;

  urls := COALESCE(
    (SELECT jsonb_agg(v) FROM (
      SELECT v FROM jsonb_array_elements_text(urls) WITH ORDINALITY AS t(v,i)
      WHERE i <= max_images
    ) s),
    '[]'::jsonb
  );

  NEW.image_urls := urls;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_products_image_urls_sync ON public.products;
CREATE TRIGGER trg_products_image_urls_sync
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.products_image_urls_sync();

-- Backfill
UPDATE public.products p
SET image_urls = COALESCE(p.image_urls, '[]'::jsonb);

COMMIT;