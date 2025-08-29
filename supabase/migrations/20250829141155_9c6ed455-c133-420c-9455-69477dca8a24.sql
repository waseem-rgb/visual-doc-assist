-- Fix INSERT policy to prevent users from creating requests for other users
DROP POLICY IF EXISTS "Authenticated users can create prescription requests" ON public.prescription_requests;

-- Create secure INSERT policy that only allows users to create requests for themselves
CREATE POLICY "Users can create their own prescription requests" 
ON public.prescription_requests 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

-- Note: customer_id IS NULL allows for guest submissions if needed
-- but those will require authentication to be viewed due to SELECT policy