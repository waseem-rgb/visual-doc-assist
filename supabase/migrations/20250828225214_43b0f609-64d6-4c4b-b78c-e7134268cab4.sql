-- Add pdf_bucket column to prescriptions table to track which bucket contains the PDF
ALTER TABLE public.prescriptions
ADD COLUMN IF NOT EXISTS pdf_bucket TEXT DEFAULT 'new_prescription-templet';