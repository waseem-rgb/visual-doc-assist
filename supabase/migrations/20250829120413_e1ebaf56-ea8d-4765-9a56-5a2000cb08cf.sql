-- Remove the dangerous public read access policy for prescription_requests
DROP POLICY IF EXISTS "Allow public read access for testing" ON public.prescription_requests;

-- Ensure we have proper RLS policies for prescription_requests
-- (The existing policies should already handle this, but let's verify they exist)

-- Policy for customers to view their own requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescription_requests' 
        AND policyname = 'Customers can view their own requests'
    ) THEN
        CREATE POLICY "Customers can view their own requests" 
        ON public.prescription_requests 
        FOR SELECT 
        USING (auth.uid() = customer_id);
    END IF;
END
$$;

-- Policy for doctors to view all requests (they need to see unassigned requests too)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescription_requests' 
        AND policyname = 'Doctors can view all requests'
    ) THEN
        CREATE POLICY "Doctors can view all requests" 
        ON public.prescription_requests 
        FOR SELECT 
        USING (has_role(auth.uid(), 'doctor'::app_role));
    END IF;
END
$$;