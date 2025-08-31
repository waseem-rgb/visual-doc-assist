import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-integration-key',
};

interface CreatePrescriptionRequest {
  source: "grama-sathi" | "daigasst-health-ai";
  external_id?: string;
  callback_url?: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    phone?: string;
    email?: string;
  };
  body_part: string;
  symptoms: string;
  probable_diagnosis?: string;
  short_summary?: string;
  clinical_history?: string;
  chief_complaint?: string;
  prescription_required?: boolean;
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
    const requestData: CreatePrescriptionRequest = await req.json();
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
        !requestData.body_part || !requestData.symptoms) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: patient.name, patient.age, patient.gender, body_part, symptoms' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create prescription request
    const prescriptionRequestData = {
      external_source: requestData.source,
      external_id: requestData.external_id,
      callback_url: requestData.callback_url,
      patient_name: requestData.patient.name,
      patient_age: requestData.patient.age,
      patient_gender: requestData.patient.gender,
      patient_phone: requestData.patient.phone,
      customer_email: requestData.patient.email,
      body_part: requestData.body_part,
      symptoms: requestData.symptoms,
      probable_diagnosis: requestData.probable_diagnosis,
      short_summary: requestData.short_summary,
      clinical_history: requestData.clinical_history,
      chief_complaint: requestData.chief_complaint,
      prescription_required: requestData.prescription_required ?? true,
      status: 'pending',
      selected_diagnosis_type: 'database'
    };

    console.log('Creating prescription request with data:', JSON.stringify(prescriptionRequestData, null, 2));

    const { data: prescriptionRequest, error } = await supabase
      .from('prescription_requests')
      .insert([prescriptionRequestData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create prescription request', details: error.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Successfully created prescription request:', prescriptionRequest.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        request_id: prescriptionRequest.id,
        message: 'Prescription request created successfully'
      }), 
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-prescription-request function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});