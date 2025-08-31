-- Enable public read access to doctor profiles for appointment booking
CREATE POLICY "Allow public read access to doctor profiles" 
ON doctor_profiles 
FOR SELECT 
USING (true);

-- Also ensure appointments can be created by authenticated users
CREATE POLICY "Allow authenticated users to create appointments" 
ON appointments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);