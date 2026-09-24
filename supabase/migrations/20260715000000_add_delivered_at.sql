ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_phone_delivered_idx
  ON public.orders (customer_phone, delivered_at, id)
  WHERE order_status = 'delivered';

CREATE OR REPLACE FUNCTION public.set_orders_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();

  IF TG_OP = 'INSERT' THEN
    IF NEW.order_status = 'delivered' THEN
      NEW.delivered_at = COALESCE(NEW.delivered_at, now());
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.delivered_at IS NOT NULL THEN
    NEW.delivered_at = OLD.delivered_at;
  ELSIF NEW.order_status = 'delivered'
    AND OLD.order_status IS DISTINCT FROM 'delivered' THEN
    NEW.delivered_at = now();
  ELSE
    NEW.delivered_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_timestamps
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_orders_timestamps();
