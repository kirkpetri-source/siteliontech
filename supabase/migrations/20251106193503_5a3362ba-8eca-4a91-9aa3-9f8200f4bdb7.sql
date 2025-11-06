-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  price TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  before_image TEXT NOT NULL,
  after_image TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Policies for cases
CREATE POLICY "Anyone can view active cases"
  ON public.cases FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage cases"
  ON public.cases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Add triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();