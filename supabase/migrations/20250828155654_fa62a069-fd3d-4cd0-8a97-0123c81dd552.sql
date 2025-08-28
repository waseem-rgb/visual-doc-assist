-- Add customer_id to prescription_requests to track who submitted each request
ALTER TABLE public.prescription_requests 
ADD COLUMN customer_id UUID REFERENCES auth.users(id);

-- Add customer_email for easier identification
ALTER TABLE public.prescription_requests 
ADD COLUMN customer_email TEXT;

-- Create index for better performance
CREATE INDEX idx_prescription_requests_customer_id 
ON public.prescription_requests(customer_id);

-- Update RLS policies to allow customers to see their own requests
CREATE POLICY "Customers can view their own requests"
ON public.prescription_requests
FOR SELECT
USING (auth.uid() = customer_id OR customer_id IS NULL); -- Allow NULL for existing requests

-- Allow customers to update their own requests (for adding customer info)
CREATE POLICY "Customers can update their own requests"
ON public.prescription_requests
FOR UPDATE
USING (auth.uid() = customer_id OR customer_id IS NULL)
WITH CHECK (auth.uid() = customer_id);