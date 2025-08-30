-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Create appointments table for teleconsultation scheduling
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    whatsapp_link TEXT,
    notes TEXT,
    patient_name TEXT NOT NULL,
    patient_age TEXT NOT NULL,
    patient_gender TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    chief_complaint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Customers can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Doctors can view their appointments" 
ON public.appointments 
FOR SELECT 
USING (has_role(auth.uid(), 'doctor'::app_role) AND (auth.uid() = doctor_id));

CREATE POLICY "Doctors can update their appointments" 
ON public.appointments 
FOR UPDATE 
USING (has_role(auth.uid(), 'doctor'::app_role) AND (auth.uid() = doctor_id));

-- Create doctor availability table
CREATE TABLE public.doctor_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(doctor_id, day_of_week, start_time)
);

-- Enable RLS for doctor availability
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for doctor availability
CREATE POLICY "Everyone can view doctor availability" 
ON public.doctor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Doctors can manage their own availability" 
ON public.doctor_availability 
FOR ALL 
USING (has_role(auth.uid(), 'doctor'::app_role) AND (auth.uid() = doctor_id));

-- Create trigger for updating timestamps
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default availability for the main doctor (9 AM to 6 PM, Monday to Friday)
INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
((SELECT id FROM public.doctor_profiles LIMIT 1), 1, '09:00:00', '18:00:00'), -- Monday
((SELECT id FROM public.doctor_profiles LIMIT 1), 2, '09:00:00', '18:00:00'), -- Tuesday
((SELECT id FROM public.doctor_profiles LIMIT 1), 3, '09:00:00', '18:00:00'), -- Wednesday
((SELECT id FROM public.doctor_profiles LIMIT 1), 4, '09:00:00', '18:00:00'), -- Thursday
((SELECT id FROM public.doctor_profiles LIMIT 1), 5, '09:00:00', '18:00:00'); -- Friday