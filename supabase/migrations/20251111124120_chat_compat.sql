-- Compatibility migration to relax chat policies and avoid custom role helpers

-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tables only if they don't exist (schema aligned with frontend)
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
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  evolution_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.chat_send_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.chat_tickets(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_send_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that reference custom helpers if present
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.chat_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.chat_tickets;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view send attempts" ON public.chat_send_attempts;
DROP POLICY IF EXISTS "System can insert send attempts" ON public.chat_send_attempts;
DROP POLICY IF EXISTS "Admins can view settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.chat_settings;

-- Also drop permissive policies if they already exist (idempotent)
DROP POLICY IF EXISTS "Anyone can insert chat tickets" ON public.chat_tickets;
DROP POLICY IF EXISTS "Authenticated users can view and update tickets" ON public.chat_tickets;
DROP POLICY IF EXISTS "Authenticated users can view and update tickets (update)" ON public.chat_tickets;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert send attempts" ON public.chat_send_attempts;
DROP POLICY IF EXISTS "Authenticated users can view send attempts" ON public.chat_send_attempts;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.chat_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.chat_settings;

-- Create permissive policies compatible with anon interactions
CREATE POLICY "Anyone can insert chat tickets"
ON public.chat_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view and update tickets"
ON public.chat_tickets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view and update tickets (update)"
ON public.chat_tickets FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert messages"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert send attempts"
ON public.chat_send_attempts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view send attempts"
ON public.chat_send_attempts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view settings"
ON public.chat_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update settings"
ON public.chat_settings FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_tickets_updated_at'
  ) THEN
    CREATE TRIGGER update_chat_tickets_updated_at
    BEFORE UPDATE ON public.chat_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_chat_settings_updated_at
    BEFORE UPDATE ON public.chat_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chat_tickets_status') THEN
    CREATE INDEX idx_chat_tickets_status ON public.chat_tickets(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chat_tickets_created_at') THEN
    CREATE INDEX idx_chat_tickets_created_at ON public.chat_tickets(created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chat_messages_ticket_id') THEN
    CREATE INDEX idx_chat_messages_ticket_id ON public.chat_messages(ticket_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_chat_send_attempts_ticket_id') THEN
    CREATE INDEX idx_chat_send_attempts_ticket_id ON public.chat_send_attempts(ticket_id);
  END IF;
END $$;