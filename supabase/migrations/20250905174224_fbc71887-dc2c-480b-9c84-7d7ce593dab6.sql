-- Fix RLS policies for sensitive tables to address security vulnerabilities

-- 1. Fix admin_users table - restrict to super admins only
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.id = auth.uid() 
      AND au.role = 'super_admin'::admin_role 
      AND au.is_active = true
  )
);

-- 2. Fix doctor_onboarding_requests table - restrict to super admins only  
DROP POLICY IF EXISTS "Super admins can manage doctor onboarding" ON public.doctor_onboarding_requests;
CREATE POLICY "Super admins can manage doctor onboarding"
ON public.doctor_onboarding_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid() 
      AND au.role = 'super_admin'::admin_role 
      AND au.is_active = true
  )
);

-- 3. Fix profiles table - restrict to owner only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Fix phone_verifications table - restrict to owner and system operations
DROP POLICY IF EXISTS "Allow phone verification creation" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can view their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can update their own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can delete their own phone verifications" ON public.phone_verifications;

CREATE POLICY "Users can create phone verifications" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own phone verifications" 
ON public.phone_verifications 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own phone verifications" 
ON public.phone_verifications 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own phone verifications" 
ON public.phone_verifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Fix storage policies for private buckets
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own prescriptions in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own private prescriptions in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own consultation recordings" ON storage.objects;

-- Ensure prescriptions bucket is properly secured
CREATE POLICY "Users can view their own prescriptions in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.prescription_requests pr ON pr.id = p.request_id
    WHERE p.pdf_url LIKE '%' || name || '%'
      AND (pr.customer_id = auth.uid() OR p.doctor_id = auth.uid())
  )
);

-- Ensure private-prescriptions bucket is properly secured
CREATE POLICY "Users can view their own private prescriptions in storage"
ON storage.objects  
FOR SELECT
USING (
  bucket_id = 'private-prescriptions' AND
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.prescription_requests pr ON pr.id = p.request_id  
    WHERE p.pdf_url LIKE '%' || name || '%'
      AND (pr.customer_id = auth.uid() OR p.doctor_id = auth.uid())
  )
);

-- Ensure consultation-recordings bucket is properly secured
CREATE POLICY "Users can view their own consultation recordings"
ON storage.objects
FOR SELECT  
USING (
  bucket_id = 'consultation-recordings' AND
  EXISTS (
    SELECT 1 FROM public.video_consultations vc
    JOIN public.appointments a ON a.id = vc.appointment_id
    WHERE vc.recording_url LIKE '%' || name || '%'
      AND (a.customer_id = auth.uid() OR a.doctor_id = auth.uid())
  )
);