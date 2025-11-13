-- Seed initial content for services and cases
-- Idempotent inserts to avoid duplicates on re-run

-- Services seeds
INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Troca de Tela',
       'Substituição de tela quebrada ou trincada com peças de qualidade.',
       'Smartphone',
       'R$ 399,90',
       NULL,
       true,
       1
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Troca de Tela');

INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Upgrade de SSD',
       'Instalação de SSD NVMe/SATA para acelerar seu computador.',
       'HardDrive',
       'R$ 299,90',
       NULL,
       true,
       2
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Upgrade de SSD');

INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Limpeza e Manutenção',
       'Higienização interna, troca de pasta térmica e revisão geral.',
       'Wrench',
       'R$ 199,90',
       NULL,
       true,
       3
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Limpeza e Manutenção');

INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Reparo de Placa',
       'Diagnóstico e reparo de placa-mãe/placa lógica (sob orçamento).',
       'Cpu',
       'Sob orçamento',
       NULL,
       true,
       4
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Reparo de Placa');

INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Troca de Bateria',
       'Substituição de bateria com garantia e testes de desempenho.',
       'Zap',
       'R$ 249,90',
       NULL,
       true,
       5
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Troca de Bateria');

INSERT INTO public.services (name, description, icon, price, image_url, active, display_order)
SELECT 'Diagnóstico Completo',
       'Avaliação detalhada do equipamento com relatório técnico.',
       'Settings',
       'R$ 99,90',
       NULL,
       true,
       6
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Diagnóstico Completo');

-- Cases example seeds
INSERT INTO public.cases (title, description, before_image, after_image, active, display_order)
SELECT 'Troca de Tela iPhone',
       'Dispositivo com trincos severos, substituição concluída com vedação e testes.',
       'https://placehold.co/800x600?text=Antes',
       'https://placehold.co/800x600?text=Depois',
       true,
       1
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE title = 'Troca de Tela iPhone');

INSERT INTO public.cases (title, description, before_image, after_image, active, display_order)
SELECT 'Upgrade SSD + Limpeza',
       'Notebook lento recebeu SSD NVMe e limpeza interna. Desempenho 5x melhor.',
       'https://placehold.co/800x600?text=Antes',
       'https://placehold.co/800x600?text=Depois',
       true,
       2
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE title = 'Upgrade SSD + Limpeza');

INSERT INTO public.cases (title, description, before_image, after_image, active, display_order)
SELECT 'Reparo de Placa Lógica',
       'Curto na linha de alimentação identificado e resolvido com troca de componente.',
       'https://placehold.co/800x600?text=Antes',
       'https://placehold.co/800x600?text=Depois',
       true,
       3
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE title = 'Reparo de Placa Lógica');

-- Ensure updated_at gets set on insert/update
UPDATE public.services SET updated_at = now() WHERE true;
UPDATE public.cases SET updated_at = now() WHERE true;