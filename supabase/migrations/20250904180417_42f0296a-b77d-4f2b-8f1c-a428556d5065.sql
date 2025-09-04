-- Clean up existing users and prepare for admin-only doctor onboarding

-- First, delete all existing data that references users
DELETE FROM audit_logs;
DELETE FROM prescriptions;
DELETE FROM prescription_requests;
DELETE FROM appointments;
DELETE FROM video_consultations;
DELETE FROM ml_training_sessions;
DELETE FROM doctor_availability;
DELETE FROM phone_verifications;
DELETE FROM otp_rate_limits;
DELETE FROM profiles;
DELETE FROM doctor_profiles;
DELETE FROM user_roles;

-- Create admin role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create admin users table for system administration
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role admin_role NOT NULL DEFAULT 'super_admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.admin_users(id),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on admin users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- Create doctor onboarding requests table
CREATE TABLE IF NOT EXISTS public.doctor_onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  specialization text,
  license_number text,
  phone text,
  temporary_password text NOT NULL, -- Will be hashed
  created_by uuid REFERENCES public.admin_users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'completed', 'failed')),
  invited_at timestamptz,
  completed_at timestamptz,
  doctor_user_id uuid, -- Will be filled when doctor account is created
  notes text
);

-- Enable RLS on doctor onboarding requests
ALTER TABLE public.doctor_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage doctor onboarding
CREATE POLICY "Super admins can manage doctor onboarding"
ON public.doctor_onboarding_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- Insert initial super admin (using the existing email from handle_doctor_signup function)
INSERT INTO public.admin_users (email, role, is_active) 
VALUES ('waseem@5thvital.com', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create audit log for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id) NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL, -- 'doctor', 'user', 'system'
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view admin audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = _user_id 
      AND role = 'super_admin' 
      AND is_active = true
  )
$$;