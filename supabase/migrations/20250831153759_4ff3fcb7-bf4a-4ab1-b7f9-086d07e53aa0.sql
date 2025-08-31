-- Create video consultations table
CREATE TABLE public.video_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  room_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'waiting',
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  recording_consent_patient BOOLEAN DEFAULT false,
  recording_consent_doctor BOOLEAN DEFAULT false,
  recording_url TEXT,
  recording_metadata JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_consultations ENABLE ROW LEVEL SECURITY;

-- Create policies for video consultations
CREATE POLICY "Users can view their own video consultations" 
ON public.video_consultations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.id = video_consultations.appointment_id 
    AND (appointments.customer_id = auth.uid() OR appointments.doctor_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own video consultations" 
ON public.video_consultations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.id = video_consultations.appointment_id 
    AND (appointments.customer_id = auth.uid() OR appointments.doctor_id = auth.uid())
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_consultations_updated_at
BEFORE UPDATE ON public.video_consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create ML training data table for recorded sessions
CREATE TABLE public.ml_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_consultation_id UUID NOT NULL REFERENCES public.video_consultations(id) ON DELETE CASCADE,
  transcription TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  symptoms_extracted JSONB,
  medical_entities JSONB,
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ML training sessions
ALTER TABLE public.ml_training_sessions ENABLE ROW LEVEL SECURITY;

-- Only doctors and system can access ML training data
CREATE POLICY "Doctors can view ML training sessions" 
ON public.ml_training_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.video_consultations vc ON vc.appointment_id = a.id
    WHERE vc.id = ml_training_sessions.video_consultation_id
    AND a.doctor_id = auth.uid()
  )
);

-- Create trigger for ML training sessions
CREATE TRIGGER update_ml_training_sessions_updated_at
BEFORE UPDATE ON public.ml_training_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();