-- customer_devices
CREATE TABLE IF NOT EXISTS public.customer_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  device_token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_token)
);
CREATE INDEX IF NOT EXISTS customer_devices_phone_idx ON public.customer_devices (phone);

GRANT SELECT, INSERT, UPDATE ON public.customer_devices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_devices TO authenticated;
GRANT ALL ON public.customer_devices TO service_role;

ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert devices" ON public.customer_devices;
CREATE POLICY "public insert devices" ON public.customer_devices FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public update devices" ON public.customer_devices;
CREATE POLICY "public update devices" ON public.customer_devices FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public select devices" ON public.customer_devices;
CREATE POLICY "public select devices" ON public.customer_devices FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_customer_devices_updated_at ON public.customer_devices;
CREATE TRIGGER trg_customer_devices_updated_at BEFORE UPDATE ON public.customer_devices
FOR EACH ROW EXECUTE FUNCTION public.set_orders_updated_at();

-- notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL,
  status text NOT NULL,
  phone text,
  success_count int NOT NULL DEFAULT 0,
  failure_count int NOT NULL DEFAULT 0,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_code, status)
);
CREATE INDEX IF NOT EXISTS notification_logs_order_idx ON public.notification_logs (order_code);

GRANT ALL ON public.notification_logs TO service_role;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
-- No public policies: writes/reads only via service role (edge function).