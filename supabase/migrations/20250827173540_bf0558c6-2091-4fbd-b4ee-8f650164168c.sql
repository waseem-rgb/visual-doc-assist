-- Enable public read access to the head to Toe sub areas table
CREATE POLICY "Allow public read access to body parts" 
ON "head to Toe sub areas" 
FOR SELECT 
USING (true);

-- Enable public read access to the New Master table as well
CREATE POLICY "Allow public read access to symptoms" 
ON "New Master" 
FOR SELECT 
USING (true);