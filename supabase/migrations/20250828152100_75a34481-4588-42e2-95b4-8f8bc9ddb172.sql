-- Temporarily allow public read access to prescription_requests for testing
-- IMPORTANT: This should be reverted in production with proper authentication

DROP POLICY IF EXISTS "Doctors can view all requests" ON prescription_requests;

CREATE POLICY "Allow public read access for testing" 
ON prescription_requests 
FOR SELECT 
USING (true);