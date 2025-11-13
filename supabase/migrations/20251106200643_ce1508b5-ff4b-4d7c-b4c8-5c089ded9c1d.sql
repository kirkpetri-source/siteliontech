-- Use IF NOT EXISTS para reaplicações seguras
CREATE TABLE IF NOT EXISTS public.chat_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  subject TEXT NOT NULL,
  initial_message TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  lgpd_consent BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.chat_tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'customer' ou 'admin'
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  evolution_status TEXT DEFAULT 'pending' -- 'pending', 'sent', 'failed'
);

CREATE TABLE IF NOT EXISTS public.chat_send_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.chat_tickets(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.chat_settings (setting_key, setting_value) VALUES
  ('business_hours', '{"monday": {"start": "08:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "08:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "08:00", "end": "18:00", "enabled": true}, "thursday": {"start": "08:00", "end": "18:00", "enabled": true}, "friday": {"start": "08:00", "end": "18:00", "enabled": true}, "saturday": {"start": "08:00", "end": "12:00", "enabled": true}, "sunday": {"enabled": false}}'::jsonb),
  ('quick_replies', '["Olá! Já vi sua mensagem e vou te responder em instantes.", "Pode me enviar mais detalhes sobre o problema?", "Obrigado pelo contato! Vou verificar isso para você."]'::jsonb),
  ('welcome_message', '"Olá! 👋 Sou o atendimento da Lion Tech. Como posso ajudar hoje?"'::jsonb),
  ('offline_message', '"Estamos fora do horário agora, mas registramos sua mensagem e responderemos assim que possível."'::jsonb),
  ('sla_minutes', '30'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Habilitar RLS
ALTER TABLE public.chat_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_send_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Use DROP POLICY IF EXISTS para evitar duplicatas
DROP POLICY IF EXISTS "Anyone can insert chat tickets" ON public.chat_tickets;
CREATE POLICY "Anyone can insert chat tickets"
  ON public.chat_tickets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.chat_tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.chat_tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update tickets" ON public.chat_tickets;
CREATE POLICY "Admins can update tickets"
  ON public.chat_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
CREATE POLICY "Admins can view all messages"
  ON public.chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view send attempts" ON public.chat_send_attempts;
CREATE POLICY "Admins can view send attempts"
  ON public.chat_send_attempts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert send attempts" ON public.chat_send_attempts;
CREATE POLICY "System can insert send attempts"
  ON public.chat_send_attempts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view settings" ON public.chat_settings;
CREATE POLICY "Admins can view settings"
  ON public.chat_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update settings" ON public.chat_settings;
CREATE POLICY "Admins can update settings"
  ON public.chat_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_chat_tickets_updated_at ON public.chat_tickets;
CREATE TRIGGER update_chat_tickets_updated_at
  BEFORE UPDATE ON public.chat_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_settings_updated_at ON public.chat_settings;
CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON public.chat_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_chat_tickets_status ON public.chat_tickets(status);
CREATE INDEX IF NOT EXISTS idx_chat_tickets_created_at ON public.chat_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON public.chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_send_attempts_ticket_id ON public.chat_send_attempts(ticket_id);