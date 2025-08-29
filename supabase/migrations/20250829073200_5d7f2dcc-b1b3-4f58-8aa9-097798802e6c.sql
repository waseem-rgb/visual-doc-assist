-- Add new columns to prescription_requests table to store both diagnoses separately
ALTER TABLE prescription_requests 
ADD COLUMN database_diagnosis text,
ADD COLUMN ai_diagnosis text,
ADD COLUMN selected_diagnosis_type text DEFAULT 'database';

-- Update existing records to move probable_diagnosis to database_diagnosis
UPDATE prescription_requests 
SET database_diagnosis = probable_diagnosis
WHERE probable_diagnosis IS NOT NULL AND database_diagnosis IS NULL;

-- Add column to prescriptions table to track which diagnosis was selected
ALTER TABLE prescriptions 
ADD COLUMN selected_diagnosis_type text DEFAULT 'database';