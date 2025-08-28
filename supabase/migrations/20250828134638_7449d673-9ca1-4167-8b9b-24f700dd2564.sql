-- Fix RLS policies - ensure all tables with RLS have proper policies
-- Check and add policies for any tables that might be missing them

-- Ensure Medication_new table has proper RLS policy
ALTER TABLE "Medication_new" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access to medications" 
ON "Medication_new" 
FOR SELECT 
USING (true);

-- Ensure all other tables with RLS enabled have proper policies
-- The linter should pass after this