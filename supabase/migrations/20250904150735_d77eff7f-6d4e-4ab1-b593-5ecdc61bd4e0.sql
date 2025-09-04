-- SECURITY FIX: Address remaining security warnings

-- Fix function search path for security
DROP FUNCTION IF EXISTS public.log_prescription_download();

CREATE OR REPLACE FUNCTION public.log_prescription_download()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details,
    created_at
  )
  VALUES (
    auth.uid(),
    'prescription_download',
    'prescriptions',
    NEW.id::text,
    jsonb_build_object(
      'prescription_id', NEW.id,
      'download_time', now()
    ),
    now()
  );
  RETURN NEW;
END;
$$;

-- SECURITY FIX: Add admin role to enum for audit logs policy
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- SECURITY FIX: Improve OTP security with better rate limiting and hash storage
-- Update phone_verifications to store hashed OTPs
ALTER TABLE public.phone_verifications 
ADD COLUMN IF NOT EXISTS otp_hash text,
ADD COLUMN IF NOT EXISTS salt text;

-- Create function to hash OTPs
CREATE OR REPLACE FUNCTION public.hash_otp(otp_code text, salt_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN encode(digest(otp_code || salt_value, 'sha256'), 'hex');
END;
$$;

-- Create function to verify OTPs
CREATE OR REPLACE FUNCTION public.verify_otp(phone text, provided_otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  stored_hash text;
  stored_salt text;
  computed_hash text;
  attempts_count integer;
  blocked_until_time timestamp with time zone;
BEGIN
  -- Check rate limiting
  SELECT attempts, blocked_until INTO attempts_count, blocked_until_time
  FROM otp_rate_limits 
  WHERE phone_number = phone AND last_attempt > now() - interval '1 hour';
  
  -- If blocked, return false
  IF blocked_until_time IS NOT NULL AND blocked_until_time > now() THEN
    RETURN FALSE;
  END IF;
  
  -- If too many attempts in the last hour, block for 1 hour
  IF attempts_count >= 5 THEN
    INSERT INTO otp_rate_limits (phone_number, attempts, blocked_until)
    VALUES (phone, attempts_count + 1, now() + interval '1 hour')
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
      attempts = otp_rate_limits.attempts + 1,
      blocked_until = now() + interval '1 hour',
      last_attempt = now();
    RETURN FALSE;
  END IF;
  
  -- Get stored hash and salt
  SELECT otp_hash, salt INTO stored_hash, stored_salt
  FROM phone_verifications 
  WHERE phone_number = phone 
    AND expires_at > now() 
    AND is_verified = false
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Update rate limiting
  INSERT INTO otp_rate_limits (phone_number, attempts, last_attempt)
  VALUES (phone, COALESCE(attempts_count, 0) + 1, now())
  ON CONFLICT (phone_number)
  DO UPDATE SET 
    attempts = otp_rate_limits.attempts + 1,
    last_attempt = now();
  
  -- If no valid OTP found, return false
  IF stored_hash IS NULL OR stored_salt IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compute hash of provided OTP
  computed_hash := hash_otp(provided_otp, stored_salt);
  
  -- Compare hashes
  IF computed_hash = stored_hash THEN
    -- Mark as verified and clean up rate limits on success
    UPDATE phone_verifications 
    SET is_verified = true 
    WHERE phone_number = phone AND otp_hash = stored_hash;
    
    DELETE FROM otp_rate_limits WHERE phone_number = phone;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;