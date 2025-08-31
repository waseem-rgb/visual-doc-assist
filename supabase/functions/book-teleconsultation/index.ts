import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-integration-key',
};

interface BookTeleconsultationRequest {
  source: "grama-sathi" | "daigasst-health-ai";
  external_id?: string;
  callback_url?: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    phone: string;
  };
  appointment_date: string; // ISO string
  duration_minutes?: number;
  chief_complaint?: string;
  doctor_id?: string;
}

serve(async (req) => {
  console.log('Incoming request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate integration key
    const integrationKey = req.headers.get('x-integration-key');
    if (!integrationKey) {
      console.error('Missing integration key');
      return new Response(
        JSON.stringify({ error: 'Missing X-Integration-Key header' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    // Get body data
    const requestData: BookTeleconsultationRequest = await req.json();
    console.log('Request data:', JSON.stringify(requestData, null, 2));

    // Validate source and integration key
    const gramasathiKey = Deno.env.get('GRAMASATHI_KEY');
    const daigasstKey = Deno.env.get('DAIGASST_KEY');

    let validKey = false;
    if (requestData.source === 'grama-sathi' && integrationKey === gramasathiKey) {
      validKey = true;
    } else if (requestData.source === 'daigasst-health-ai' && integrationKey === daigasstKey) {
      validKey = true;
    }

    if (!validKey) {
      console.error('Invalid integration key for source:', requestData.source);
      return new Response(
        JSON.stringify({ error: 'Invalid integration key for source' }), 
        { status: 403, headers: corsHeaders }
      );
    }

    // Validate required fields
    if (!requestData.patient?.name || !requestData.patient?.age || !requestData.patient?.gender || 
        !requestData.patient?.phone || !requestData.appointment_date) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: patient.name, patient.age, patient.gender, patient.phone, appointment_date' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get default doctor if not specified
    let doctorId = requestData.doctor_id;
    if (!doctorId) {
      // Get first available doctor (in a real app, you'd implement proper scheduling logic)
      const { data: doctors } = await supabase
        .from('doctor_profiles')
        .select('id')
        .limit(1);
      
      if (doctors && doctors.length > 0) {
        doctorId = doctors[0].id;
      } else {
        return new Response(
          JSON.stringify({ error: 'No doctors available' }), 
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Create appointment
    const appointmentData = {
      external_source: requestData.source,
      external_id: requestData.external_id,
      callback_url: requestData.callback_url,
      customer_id: null, // External bookings don't have customer_id
      doctor_id: doctorId,
      patient_name: requestData.patient.name,
      patient_age: requestData.patient.age,
      patient_gender: requestData.patient.gender,
      patient_phone: requestData.patient.phone,
      appointment_date: requestData.appointment_date,
      duration_minutes: requestData.duration_minutes || 30,
      chief_complaint: requestData.chief_complaint,
      status: 'scheduled'
    };

    console.log('Creating appointment with data:', JSON.stringify(appointmentData, null, 2));

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (appointmentError) {
      console.error('Database error creating appointment:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create appointment', details: appointmentError.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Create video consultation room
    const roomId = `room_${appointment.id}_${Date.now()}`;
    const videoConsultationData = {
      appointment_id: appointment.id,
      room_id: roomId,
      status: 'waiting'
    };

    const { data: videoConsultation, error: videoError } = await supabase
      .from('video_consultations')
      .insert([videoConsultationData])
      .select()
      .single();

    if (videoError) {
      console.error('Database error creating video consultation:', videoError);
      // Don't fail the whole request, just log the error
      console.log('Continuing without video consultation room');
    }

    // Generate join URLs (these would be actual WebRTC URLs in production)
    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app'); // Adjust based on your domain
    const doctorJoinUrl = `${baseUrl}/video-consultation/${appointment.id}?role=doctor`;
    const patientJoinUrl = `${baseUrl}/video-consultation/${appointment.id}?role=patient`;

    console.log('Successfully created appointment:', appointment.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointment_id: appointment.id,
        room_id: roomId,
        doctor_join_url: doctorJoinUrl,
        patient_join_url: patientJoinUrl,
        message: 'Teleconsultation booked successfully'
      }), 
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in book-teleconsultation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});