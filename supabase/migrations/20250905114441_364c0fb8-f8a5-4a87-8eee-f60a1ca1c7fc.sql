-- Drop the problematic policy
DROP POLICY IF EXISTS "Special phone number can assign doctor role" ON public.user_roles;

-- Create a simpler policy that allows users to assign themselves doctor role
-- We'll handle phone number validation in the application code
CREATE POLICY "Users can assign themselves doctor role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'doctor'::app_role
);