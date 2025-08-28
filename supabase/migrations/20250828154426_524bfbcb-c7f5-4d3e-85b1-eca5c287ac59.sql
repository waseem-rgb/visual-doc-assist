-- Create a function to automatically assign doctor role and profile for specific emails
CREATE OR REPLACE FUNCTION public.handle_doctor_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user email should get doctor role
  IF NEW.email IN ('waseem@5thvital.com', 'doctor@example.com') THEN
    -- Insert doctor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor'::app_role);
    
    -- Create doctor profile
    INSERT INTO public.doctor_profiles (id, full_name, specialization, license_number, phone)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.email = 'waseem@5thvital.com' THEN 'Dr. Waseem Ahmed'
        ELSE 'Dr. ' || COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
      END,
      'General Medicine',
      'MD12345',
      '+971501234567'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run the function when a user is created
DROP TRIGGER IF EXISTS on_auth_doctor_user_created ON auth.users;
CREATE TRIGGER on_auth_doctor_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_doctor_signup();