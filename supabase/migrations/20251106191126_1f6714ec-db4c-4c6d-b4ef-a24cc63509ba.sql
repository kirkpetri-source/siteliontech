-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#8B5CF6',
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies para categorias
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias baseadas nos produtos existentes
INSERT INTO public.categories (name, slug, description, display_order)
SELECT DISTINCT 
  category as name,
  lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
  'Categoria de ' || category as description,
  ROW_NUMBER() OVER (ORDER BY category) as display_order
FROM public.products
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Adicionar nova coluna category_id à tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Atualizar products para usar category_id baseado no category TEXT
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category = c.name;