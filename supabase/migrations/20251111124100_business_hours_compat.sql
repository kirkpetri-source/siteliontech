-- Compatibility migration for business_hours without custom role helpers
-- Creates table with TEXT times to match frontend string comparisons

-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create business_hours table (TEXT times for simple client comparisons)
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Replace policies with auth-agnostic versions
DROP POLICY IF EXISTS "Anyone can view business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Authenticated users can modify business hours" ON public.business_hours;

CREATE POLICY "Anyone can view business hours"
ON public.business_hours
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can modify business hours"
ON public.business_hours
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Seed default hours (idempotent)
INSERT INTO public.business_hours (day_of_week, is_enabled, start_time, end_time) VALUES
  (0, false, '08:00', '18:00'),
  (1, true, '08:00', '18:00'),
  (2, true, '08:00', '18:00'),
  (3, true, '08:00', '18:00'),
  (4, true, '08:00', '18:00'),
  (5, true, '08:00', '18:00'),
  (6, true, '08:00', '12:30')
ON CONFLICT (day_of_week) DO NOTHING;

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_hours_updated_at'
  ) THEN
    CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;