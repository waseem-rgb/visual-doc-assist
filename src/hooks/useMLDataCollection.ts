import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MLDataPayload {
  videoConsultationId?: string;
  consultationType: 'instant' | 'teleconsultation';
  symptoms?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  transcription?: string;
  patientAge?: string;
  patientGender?: string;
  bodyPart?: string;
}

export const useMLDataCollection = () => {
  const submitToMLEngine = useCallback(async (payload: MLDataPayload) => {
    try {
      console.log('Submitting data to ML engine:', payload);
      
      // Create ML training session record
      const { data, error } = await supabase
        .from('ml_training_sessions')
        .insert({
          video_consultation_id: payload.videoConsultationId,
          symptoms_extracted: {
            symptoms: payload.symptoms,
            body_part: payload.bodyPart,
            patient_age: payload.patientAge,
            patient_gender: payload.patientGender,
            consultation_type: payload.consultationType
          },
          diagnosis: payload.diagnosis,
          treatment_plan: payload.treatmentPlan,
          transcription: payload.transcription,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting to ML engine:', error);
        return { success: false, error };
      }

      console.log('Successfully submitted to ML engine:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error in ML data collection:', error);
      return { success: false, error };
    }
  }, []);

  return { submitToMLEngine };
};