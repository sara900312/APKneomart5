
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "service role writes settings" ON public.app_settings
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.app_settings (key, value) VALUES ('ai_provider', 'lovable')
  ON CONFLICT (key) DO NOTHING;

-- Ensure realtime works for orders (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
