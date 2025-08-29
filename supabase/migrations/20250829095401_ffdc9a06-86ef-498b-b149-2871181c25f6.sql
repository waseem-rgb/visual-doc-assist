-- Allow doctors to update prescriptions (needed for PDF URL updates)
CREATE POLICY "Doctors can update their prescriptions" ON prescriptions
  FOR UPDATE
  USING (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id)
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);