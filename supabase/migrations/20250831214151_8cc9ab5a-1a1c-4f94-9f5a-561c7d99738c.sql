-- Add external integration tracking fields to prescription_requests table
ALTER TABLE public.prescription_requests 
ADD COLUMN external_source text,
ADD COLUMN external_id text,
ADD COLUMN callback_url text;

-- Add external integration tracking fields to appointments table  
ALTER TABLE public.appointments
ADD COLUMN external_source text,
ADD COLUMN external_id text,
ADD COLUMN callback_url text;