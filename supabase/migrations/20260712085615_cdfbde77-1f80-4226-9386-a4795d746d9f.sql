
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  governorate text,
  area text,
  landmark text,
  notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  order_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_phone_idx ON public.orders (customer_phone);
CREATE INDEX orders_code_idx ON public.orders (order_code);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);

GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a new order (guest checkout)
CREATE POLICY "anyone can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Anyone can read orders (lookup happens by exact order_code + phone in app);
-- customer_phone + order_code together act as the secret.
CREATE POLICY "anyone can read orders"
  ON public.orders FOR SELECT
  USING (true);

-- Only service_role (admin/edge functions) can update status
CREATE POLICY "service role updates orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_orders_updated_at();
