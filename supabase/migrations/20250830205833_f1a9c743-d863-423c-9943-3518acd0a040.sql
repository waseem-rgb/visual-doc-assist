-- Fix critical security issue in phone_verifications table
-- Add user_id column to link verifications to users
ALTER TABLE public.phone_verifications 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage their phone verifications" ON public.phone_verifications;

-- Create secure policies
-- Allow authenticated users to view their own phone verifications
CREATE POLICY "Users can view their own phone verifications" 
ON public.phone_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own phone verifications
CREATE POLICY "Users can update their own phone verifications" 
ON public.phone_verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own phone verifications
CREATE POLICY "Users can delete their own phone verifications" 
ON public.phone_verifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow unauthenticated insert for signup flow (but restrict what can be inserted)
CREATE POLICY "Allow phone verification creation" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (
  -- Either authenticated user inserting their own record
  (auth.uid() = user_id) OR 
  -- Or unauthenticated insert (user_id will be null for signup flow)
  (user_id IS NULL AND auth.uid() IS NULL)
);

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON public.phone_verifications(user_id);