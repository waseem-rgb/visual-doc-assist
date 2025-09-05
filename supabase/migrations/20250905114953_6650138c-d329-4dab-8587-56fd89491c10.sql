-- Drop ALL existing policies on user_roles that might be problematic
DROP POLICY IF EXISTS "Special phone number can assign doctor role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can assign themselves doctor role" ON public.user_roles;

-- Create a simple policy that allows users to assign themselves both roles
-- We'll handle the phone number validation in the application
CREATE POLICY "Users can assign roles to themselves" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);