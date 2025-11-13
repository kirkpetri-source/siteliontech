-- Create shop_banners table for Loja promotional banners
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

-- Drop policies if exist to avoid conflicts on re-run
DROP POLICY IF EXISTS "Anyone can view active shop banners" ON public.shop_banners;
DROP POLICY IF EXISTS "Admins can manage shop banners" ON public.shop_banners;

-- Public can view active banners
CREATE POLICY "Anyone can view active shop banners"
ON public.shop_banners
FOR SELECT
USING (active = true);

-- Admins can manage all banners
CREATE POLICY "Admins can manage shop banners"
ON public.shop_banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_shop_banners_updated_at
  BEFORE UPDATE ON public.shop_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_shop_banners_order ON public.shop_banners(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_shop_banners_active ON public.shop_banners(active);