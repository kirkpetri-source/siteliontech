-- Create backups table to track backup history
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'manual',
  file_size BIGINT,
  tables_backed_up TEXT[],
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Admins can view all backups
CREATE POLICY "Admins can view all backups"
ON public.backups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert backups
CREATE POLICY "Admins can insert backups"
ON public.backups
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update backups
CREATE POLICY "Admins can update backups"
ON public.backups
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete backups
CREATE POLICY "Admins can delete backups"
ON public.backups
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_backups_created_at ON public.backups(created_at DESC);
CREATE INDEX idx_backups_status ON public.backups(status);

-- Enable realtime for backups table
ALTER PUBLICATION supabase_realtime ADD TABLE public.backups;