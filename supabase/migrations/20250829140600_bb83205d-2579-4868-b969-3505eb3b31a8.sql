-- Fix RLS policies for prescription_requests table to prevent public data exposure

-- Drop existing policies that allow public access
DROP POLICY IF EXISTS "Public can create prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Customers can update their own requests" ON public.prescription_requests;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can create prescription requests" 
ON public.prescription_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Customers can view their own requests" 
ON public.prescription_requests 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own requests" 
ON public.prescription_requests 
FOR UPDATE 
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Keep doctor policies as they are secure
-- CREATE POLICY "Doctors can view all requests" already exists
-- CREATE POLICY "Doctors can update requests" already exists

-- Update prescriptions table policies to ensure proper access control
DROP POLICY IF EXISTS "Customers can view their prescriptions" ON public.prescriptions;

CREATE POLICY "Customers can view their prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM prescription_requests pr 
    WHERE pr.id = prescriptions.request_id 
    AND pr.customer_id = auth.uid()
  )
);

-- Ensure all prescription PDFs use private bucket by default
ALTER TABLE public.prescriptions 
ALTER COLUMN pdf_bucket SET DEFAULT 'prescriptions';