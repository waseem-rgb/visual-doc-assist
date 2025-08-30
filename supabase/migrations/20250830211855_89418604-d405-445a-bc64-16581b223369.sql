-- Fix remaining function search path security warnings
-- Update remaining functions to have secure search_path

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.phone_verifications 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$function$;