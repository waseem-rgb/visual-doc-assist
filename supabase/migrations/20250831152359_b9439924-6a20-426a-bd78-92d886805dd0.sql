-- Remove the current policy and create a more secure one
DROP POLICY IF EXISTS "Public can view basic doctor info for appointments" ON public.doctor_profiles;

-- Only allow authenticated users to view basic doctor info for appointments
-- This protects sensitive data like phone numbers and license numbers
CREATE POLICY "Authenticated users can view basic doctor info" 
ON public.doctor_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Note: Applications should only select non-sensitive columns (id, full_name, specialization)
-- when displaying doctor info for appointment booking purposes