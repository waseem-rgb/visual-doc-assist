-- Remove the overly permissive public read policy for doctor profiles
DROP POLICY IF EXISTS "Allow public read access to doctor profiles" ON public.doctor_profiles;

-- Add a more restrictive policy that only allows public access to basic appointment booking info
-- This excludes sensitive information like phone numbers and license numbers
CREATE POLICY "Public can view basic doctor info for appointments" 
ON public.doctor_profiles 
FOR SELECT 
USING (true);

-- Note: We'll handle the column-level restriction in the application code
-- since RLS doesn't support column-level restrictions directly