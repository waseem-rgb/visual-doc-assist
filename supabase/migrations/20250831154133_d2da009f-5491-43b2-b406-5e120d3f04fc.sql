-- Create storage bucket for consultation recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('consultation-recordings', 'consultation-recordings', false);

-- Create storage policies for consultation recordings
CREATE POLICY "Doctors can upload consultation recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'consultation-recordings' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'doctor'::app_role
  )
);

CREATE POLICY "Doctors can view consultation recordings" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'doctor'::app_role
  )
);

CREATE POLICY "Users can view their own consultation recordings" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1 FROM public.video_consultations vc
    JOIN public.appointments a ON a.id = vc.appointment_id
    WHERE vc.recording_url LIKE '%' || name || '%'
    AND (a.customer_id = auth.uid() OR a.doctor_id = auth.uid())
  )
);