CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_order_code_status_key
  ON public.notification_logs (order_code, status);
