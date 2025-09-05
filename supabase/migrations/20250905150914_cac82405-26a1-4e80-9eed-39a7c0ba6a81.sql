
-- 1) Function to ensure customer_id is set to the current authenticated user on insert
CREATE OR REPLACE FUNCTION public.set_customer_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    NEW.customer_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Attach BEFORE INSERT trigger on prescription_requests
DROP TRIGGER IF EXISTS trg_set_customer_id_on_insert ON public.prescription_requests;

CREATE TRIGGER trg_set_customer_id_on_insert
BEFORE INSERT ON public.prescription_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_customer_id_on_insert();
