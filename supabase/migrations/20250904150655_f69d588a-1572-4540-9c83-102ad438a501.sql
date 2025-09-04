-- SECURITY FIX: Create private storage bucket for prescription PDFs
-- Move sensitive prescription files to private storage

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-prescriptions',
  'private-prescriptions', 
  false,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['application/pdf']::text[]
);

-- Create RLS policies for private prescription bucket
CREATE POLICY "Doctors can upload prescriptions to private bucket"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'private-prescriptions' 
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can download their own prescriptions from private bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-prescriptions'
  AND (
    -- Doctors can access files they created
    has_role(auth.uid(), 'doctor'::app_role) 
    AND (storage.foldername(name))[1] = auth.uid()::text
  ) OR (
    -- Customers can access prescriptions linked to their requests
    EXISTS (
      SELECT 1 
      FROM prescriptions p
      JOIN prescription_requests pr ON pr.id = p.request_id
      WHERE p.pdf_url = name
      AND pr.customer_id = auth.uid()
    )
  )
);

-- Add audit trigger for prescription downloads
CREATE OR REPLACE FUNCTION public.log_prescription_download()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details,
    created_at
  )
  VALUES (
    auth.uid(),
    'prescription_download',
    'prescriptions',
    NEW.id::text,
    jsonb_build_object(
      'prescription_id', NEW.id,
      'download_time', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and the user themselves can view audit logs
CREATE POLICY "Users can view their own audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));