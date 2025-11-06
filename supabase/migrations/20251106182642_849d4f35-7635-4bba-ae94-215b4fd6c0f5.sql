-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_discount_percentage CHECK (
    discount_type != 'percentage' OR discount_value <= 100
  )
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active coupons (needed for validation)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
TO anon, authenticated
USING (active = true AND (valid_until IS NULL OR valid_until > now()));

-- Policy: Only admins can insert coupons
CREATE POLICY "Admins can insert coupons"
ON public.coupons
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update coupons
CREATE POLICY "Admins can update coupons"
ON public.coupons
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete coupons
CREATE POLICY "Admins can delete coupons"
ON public.coupons
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster code lookups
CREATE INDEX idx_coupons_code ON public.coupons(code) WHERE active = true;

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  order_total DECIMAL
)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  discount_amount DECIMAL;
  result JSON;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = UPPER(TRIM(coupon_code))
    AND active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Cupom inválido ou expirado'
    );
  END IF;

  -- Check minimum purchase
  IF order_total < coupon_record.min_purchase THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('Compra mínima de R$ %.2f necessária', coupon_record.min_purchase)
    );
  END IF;

  -- Calculate discount
  IF coupon_record.discount_type = 'percentage' THEN
    discount_amount := order_total * (coupon_record.discount_value / 100);
  ELSE
    discount_amount := coupon_record.discount_value;
  END IF;

  -- Ensure discount doesn't exceed order total
  IF discount_amount > order_total THEN
    discount_amount := order_total;
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount_amount', discount_amount,
    'discount_type', coupon_record.discount_type,
    'discount_value', coupon_record.discount_value,
    'code', coupon_record.code
  );
END;
$$;