-- Check current policies and fix the doctor_profiles security issue
DROP POLICY IF EXISTS "Authenticated users can view basic doctor info" ON public.doctor_profiles;

-- Create a policy that restricts access to authenticated users only
-- This prevents public access to sensitive doctor information
CREATE POLICY "Authenticated users can view doctor profiles" 
ON public.doctor_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- The existing doctor-specific policies will still allow doctors to manage their own profiles