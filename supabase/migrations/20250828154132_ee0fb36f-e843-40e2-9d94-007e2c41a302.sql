-- Create a test doctor user account
-- First, insert the user role for the test doctor email
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'doctor'::app_role
FROM auth.users 
WHERE email = 'waseem@5thvital.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create or update doctor profile for the test user
INSERT INTO public.doctor_profiles (id, full_name, specialization, license_number, phone)
SELECT 
  id,
  'Dr. Waseem Ahmed',
  'General Medicine',
  'MD12345',
  '+971501234567'
FROM auth.users 
WHERE email = 'waseem@5thvital.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  specialization = EXCLUDED.specialization,
  license_number = EXCLUDED.license_number,
  phone = EXCLUDED.phone,
  updated_at = now();