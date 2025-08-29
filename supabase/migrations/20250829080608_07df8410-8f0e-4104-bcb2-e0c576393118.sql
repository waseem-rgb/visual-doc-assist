-- Add medication history field to prescription requests table
ALTER TABLE prescription_requests 
ADD COLUMN medication_history text;