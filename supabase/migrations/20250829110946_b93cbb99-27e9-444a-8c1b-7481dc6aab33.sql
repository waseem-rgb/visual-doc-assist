
-- Make doctor_id nullable so system-generated referral prescriptions don't require a real doctor user
ALTER TABLE public.prescriptions
  ALTER COLUMN doctor_id DROP NOT NULL;
