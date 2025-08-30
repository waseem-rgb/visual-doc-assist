-- Fix function search path security warnings
-- Update existing functions to have secure search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_doctor_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;