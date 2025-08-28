-- Fix RLS policies with correct syntax
-- Drop and recreate the policy to avoid conflicts

DO $$ 
BEGIN
    -- Drop the policy if it exists and recreate it
    DROP POLICY IF EXISTS "Allow public read access to medications" ON "Medication_new";
    
    -- Create the policy
    CREATE POLICY "Allow public read access to medications" 
    ON "Medication_new" 
    FOR SELECT 
    USING (true);
    
EXCEPTION 
    WHEN OTHERS THEN
        -- If there's an error, just create the policy directly
        CREATE POLICY "Allow public read access to medications" 
        ON "Medication_new" 
        FOR SELECT 
        USING (true);
END $$;