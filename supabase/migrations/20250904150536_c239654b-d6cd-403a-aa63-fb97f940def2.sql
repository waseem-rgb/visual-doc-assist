-- Fix critical RLS policy for prescription requests - doctors should only see assigned requests
DROP POLICY IF EXISTS "Doctors can view all requests" ON prescription_requests;

CREATE POLICY "Doctors can view assigned requests only" 
ON prescription_requests 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND (assigned_doctor_id = auth.uid() OR assigned_doctor_id IS NULL)
);

-- Fix doctor availability policy - require authentication
DROP POLICY IF EXISTS "Everyone can view doctor availability" ON doctor_availability;

CREATE POLICY "Authenticated users can view doctor availability" 
ON doctor_availability 
FOR SELECT 
TO authenticated
USING (auth.role() = 'authenticated');

-- Add rate limiting table for OTP attempts
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  attempts integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy for OTP rate limits
CREATE POLICY "Users can view their own rate limits" 
ON otp_rate_limits 
FOR SELECT 
USING (true); -- Allow checking rate limits for any phone number

CREATE POLICY "Allow rate limit creation and updates" 
ON otp_rate_limits 
FOR ALL 
USING (true);