-- Allow users with special phone number to assign themselves doctor role
CREATE POLICY "Special phone number can assign doctor role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'doctor'::app_role 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND phone = '+917993448425'
  )
);