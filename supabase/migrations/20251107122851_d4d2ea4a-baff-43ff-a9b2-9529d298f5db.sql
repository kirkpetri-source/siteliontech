-- Add payment columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_type TEXT,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT,
ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- Add index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);