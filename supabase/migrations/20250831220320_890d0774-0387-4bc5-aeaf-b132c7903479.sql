-- Insert doctor role for dr_khustar@yahoo.com if not exists
INSERT INTO public.user_roles (user_id, role)
SELECT 'c0d7dd3a-611c-44b4-ad95-5d804c8c8326', 'doctor'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'c0d7dd3a-611c-44b4-ad95-5d804c8c8326' 
  AND role = 'doctor'
);