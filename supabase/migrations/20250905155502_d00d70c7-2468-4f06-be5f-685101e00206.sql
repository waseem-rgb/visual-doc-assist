-- Create a BEFORE INSERT trigger on prescription_requests to ensure customer_id is always set
CREATE TRIGGER set_customer_id_on_prescription_requests
    BEFORE INSERT ON public.prescription_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_customer_id_on_insert();