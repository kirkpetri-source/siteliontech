-- Compatibility migration for auto_responses without custom role helpers

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.auto_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_type TEXT NOT NULL CHECK (response_type IN ('offline_welcome','offline_confirmation','online_welcome')),
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_responses ENABLE ROW LEVEL SECURITY;

-- Replace policies
DROP POLICY IF EXISTS "Public can read active responses" ON public.auto_responses;
DROP POLICY IF EXISTS "Admins can manage responses" ON public.auto_responses;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'auto_responses' AND policyname = 'Public can read active responses'
  ) THEN
    CREATE POLICY "Public can read active responses"
    ON public.auto_responses FOR SELECT
    USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'auto_responses' AND policyname = 'Authenticated can manage responses'
  ) THEN
    CREATE POLICY "Authenticated can manage responses"
    ON public.auto_responses FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Seed defaults (idempotent)
INSERT INTO public.auto_responses (response_type, message, active) VALUES
  ('offline_welcome', 'Olá! 😊 Nosso atendimento está fora do horário agora. Mas você pode deixar sua mensagem e vamos responder assim que possível.', true),
  ('offline_confirmation', 'Obrigado por sua mensagem! ✅ Registramos seu contato e retornaremos em breve.', true),
  ('online_welcome', 'Olá! 👋 Sou o atendimento da Lion Tech. Como posso ajudar hoje?', true)
ON CONFLICT DO NOTHING;

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_auto_responses_updated_at'
  ) THEN
    CREATE TRIGGER update_auto_responses_updated_at
    BEFORE UPDATE ON public.auto_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;