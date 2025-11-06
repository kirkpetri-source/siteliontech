-- Create contacts table to store form submissions
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  client_type TEXT DEFAULT 'residencial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contacts (public form)
CREATE POLICY "Anyone can insert contacts"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);