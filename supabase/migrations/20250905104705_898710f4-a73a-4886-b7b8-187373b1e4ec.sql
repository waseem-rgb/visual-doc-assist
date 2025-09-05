-- Allow users to assign themselves the customer role during signup
CREATE POLICY "Users can assign themselves customer role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'customer');