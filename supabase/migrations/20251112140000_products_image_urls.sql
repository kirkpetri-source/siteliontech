-- Add image_urls array to products for multiple images support
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Optional: backfill existing principal image into array (idempotent)
UPDATE public.products
SET image_urls = 
  CASE 
    WHEN (image_urls IS NULL OR jsonb_array_length(image_urls) = 0) AND image_url IS NOT NULL THEN to_jsonb(ARRAY[image_url])
    WHEN image_urls IS NULL THEN '[]'::jsonb
    ELSE image_urls
  END;
-- products_image_urls.sql
-- Adiciona coluna image_urls e garante via trigger que a imagem principal
-- (image_url) esteja sempre incluída e na primeira posição, sem duplicatas
-- e respeitando um limite máximo de imagens.

BEGIN;

-- 1) Adiciona coluna array de texto para URLs de imagens
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

-- Garante NOT NULL para simplificar lógica de aplicação
ALTER TABLE public.products
  ALTER COLUMN image_urls SET NOT NULL;

-- 2) Função de trigger para sincronizar image_urls com image_url (principal primeiro)
CREATE OR REPLACE FUNCTION public.products_image_urls_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  max_images integer := 10; -- mantenha alinhado com o front-end
  urls text[];
  principal text;
BEGIN
  principal := NEW.image_url;
  urls := COALESCE(NEW.image_urls, ARRAY[]::text[]);

  -- Remove nulos e duplicatas
  urls := ARRAY(
    SELECT DISTINCT u FROM unnest(urls) AS u WHERE u IS NOT NULL
  );

  -- Inclui a principal e posiciona como primeira
  IF principal IS NOT NULL THEN
    urls := ARRAY(
      SELECT u FROM unnest(urls) AS u WHERE u IS DISTINCT FROM principal
    );
    urls := ARRAY[principal] || urls;
  END IF;

  -- Enforce limite máximo
  IF array_length(urls, 1) IS NULL THEN
    urls := ARRAY[]::text[];
  ELSE
    urls := urls[1:LEAST(max_images, COALESCE(array_length(urls, 1), 0))];
  END IF;

  NEW.image_urls := urls;
  RETURN NEW;
END;
$$;

-- 3) Trigger BEFORE INSERT/UPDATE para aplicar a função
DROP TRIGGER IF EXISTS trg_products_image_urls_sync ON public.products;
CREATE TRIGGER trg_products_image_urls_sync
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.products_image_urls_sync();

-- 4) Backfill: normaliza registros existentes
-- Basta "tocar" a coluna para disparar o trigger e reordenar/deduplicar
DO $$
DECLARE
  col_udt text;
BEGIN
  SELECT c.udt_name INTO col_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'products' AND c.column_name = 'image_urls';

  IF col_udt = 'jsonb' THEN
    UPDATE public.products p
    SET image_urls = COALESCE(p.image_urls, '[]'::jsonb);
  ELSE
    UPDATE public.products p
    SET image_urls = COALESCE(p.image_urls, ARRAY[]::text[]);
  END IF;
END $$;

COMMIT;