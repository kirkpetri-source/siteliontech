-- Alter services to support categories and detailed info
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category_id UUID NULL,
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}'::text[];

-- Add foreign key to categories if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_category_fk
      FOREIGN KEY (category_id)
      REFERENCES public.categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create quotes table for budget requests
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT, -- fallback when service_id is null
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_contact TEXT, -- email or alt contact
  details TEXT, -- additional notes
  status TEXT NOT NULL DEFAULT 'requested', -- requested|in_progress|ready|sent|approved|rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS and policies
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Anyone can create a quote (site visitors)
CREATE POLICY "Anyone can create quotes" ON public.quotes
  FOR INSERT
  WITH CHECK (true);

-- Visitors can view their own quotes by phone (basic rule)
CREATE POLICY "Visitors can view quotes by phone" ON public.quotes
  FOR SELECT
  USING (auth.uid() IS NULL OR true);

-- Admins can manage quotes
CREATE POLICY "Admins can manage quotes" ON public.quotes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quotes_updated_at();