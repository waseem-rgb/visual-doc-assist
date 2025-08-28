-- Add missing fields to prescription_requests table
ALTER TABLE public.prescription_requests 
ADD COLUMN IF NOT EXISTS patient_phone text,
ADD COLUMN IF NOT EXISTS clinical_history text,
ADD COLUMN IF NOT EXISTS chief_complaint text,
ADD COLUMN IF NOT EXISTS physical_examination text;

-- Update prescriptions table to match the proper prescription format
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS prescription_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS doctor_signature text,
ADD COLUMN IF NOT EXISTS license_info text;