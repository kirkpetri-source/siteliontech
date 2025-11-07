-- Create auto responses table for chat
CREATE TABLE IF NOT EXISTS public.auto_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_type TEXT NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(response_type)
);

-- Enable RLS
ALTER TABLE public.auto_responses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active responses"
  ON public.auto_responses
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage responses"
  ON public.auto_responses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Insert default messages
INSERT INTO public.auto_responses (response_type, message, active) VALUES
  ('offline_welcome', 'Olá! 👋 No momento estamos fora do horário de atendimento, mas fique tranquilo! Registramos sua mensagem e responderemos assim que possível pelo WhatsApp.', true),
  ('offline_confirmation', 'Recebemos sua mensagem! Nossa equipe responderá em breve durante nosso horário de atendimento: Segunda a Sexta das 8h às 18h e Sábado das 8h às 12h30.', true),
  ('online_welcome', 'Olá! 👋 Sou o atendimento da Lion Tech. Como posso ajudar hoje?', true)
ON CONFLICT (response_type) DO NOTHING;