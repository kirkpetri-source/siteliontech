-- Create business_hours table to manage chat availability
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for chat widget to check hours)
CREATE POLICY "Anyone can view business hours"
ON public.business_hours
FOR SELECT
USING (true);

-- Only authenticated users can modify
CREATE POLICY "Authenticated users can modify business hours"
ON public.business_hours
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Insert default business hours
-- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
INSERT INTO public.business_hours (day_of_week, is_enabled, start_time, end_time) VALUES
  (0, false, '08:00', '18:00'), -- Sunday (closed)
  (1, true, '08:00', '18:00'),  -- Monday
  (2, true, '08:00', '18:00'),  -- Tuesday
  (3, true, '08:00', '18:00'),  -- Wednesday
  (4, true, '08:00', '18:00'),  -- Thursday
  (5, true, '08:00', '18:00'),  -- Friday
  (6, true, '08:00', '12:30')   -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();