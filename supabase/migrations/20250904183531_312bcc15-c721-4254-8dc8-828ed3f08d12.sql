-- Add additional fields to doctor_profiles table for comprehensive onboarding
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS consultation_fee decimal(10,2),
ADD COLUMN IF NOT EXISTS email text;

-- Update the admin-onboard-doctor edge function to handle these new fields
-- (This will be done in the next step)