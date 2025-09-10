-- Fix security issues: Restrict access to medical data for authenticated users only

-- Update 'New Master' table policy to require authentication
DROP POLICY IF EXISTS "Allow public read access to symptoms" ON "New Master";
CREATE POLICY "Allow authenticated users to read symptoms" 
ON "New Master" 
FOR SELECT 
TO authenticated
USING (true);

-- Update 'Medication_new' table policy to require authentication  
DROP POLICY IF EXISTS "Allow public read access to medications" ON "Medication_new";
CREATE POLICY "Allow authenticated users to read medications" 
ON "Medication_new" 
FOR SELECT 
TO authenticated
USING (true);

-- Update 'otp_rate_limits' table policies to be more restrictive
DROP POLICY IF EXISTS "Allow rate limit creation and updates" ON "otp_rate_limits";
DROP POLICY IF EXISTS "Users can view their own rate limits" ON "otp_rate_limits";

-- Only allow system functions to manage OTP rate limits
CREATE POLICY "System can manage rate limits" 
ON "otp_rate_limits" 
FOR ALL 
TO service_role
USING (true);