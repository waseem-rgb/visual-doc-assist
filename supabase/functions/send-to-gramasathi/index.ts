import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GramaSathiPayload {
  patientName: string;
  age: string;
  gender: string;
  mobileNumber: string;
  symptoms: string;
  diagnosis: string;
  treatmentPlan?: string;
  consultationDate: string;
  severity?: string;
  consultationId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationData } = await req.json();

    if (!consultationData) {
      return new Response(
        JSON.stringify({ error: 'Missing consultation data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the GRAMASATHI_KEY from environment
    const gramasathiKey = Deno.env.get('GRAMASATHI_KEY');
    if (!gramasathiKey) {
      throw new Error('GRAMASATHI_KEY not configured');
    }

    // Prepare payload for Grama-Sathi API
    const payload: GramaSathiPayload = {
      patientName: consultationData.patient_name || consultationData.full_name,
      age: consultationData.patient_age || consultationData.age,
      gender: consultationData.patient_gender || consultationData.gender,
      mobileNumber: consultationData.patient_phone || consultationData.phone,
      symptoms: consultationData.symptoms || '',
      diagnosis: consultationData.probable_diagnosis || consultationData.diagnosis || '',
      treatmentPlan: consultationData.treatment_plan || consultationData.common_treatments,
      consultationDate: consultationData.created_at || new Date().toISOString(),
      severity: consultationData.severity || 'moderate',
      consultationId: consultationData.id || consultationData.external_id
    };

    console.log('Sending consultation data to Grama-Sathi:', payload);

    // Send data to Grama-Sathi API
    const gramaSathiResponse = await fetch('https://api.gramasathi.com/v1/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gramasathiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!gramaSathiResponse.ok) {
      const errorText = await gramaSathiResponse.text();
      throw new Error(`Grama-Sathi API error: ${gramaSathiResponse.status} - ${errorText}`);
    }

    const gramaSathiResult = await gramaSathiResponse.json();
    console.log('Successfully sent to Grama-Sathi:', gramaSathiResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Consultation data sent to Grama-Sathi successfully',
        gramaSathiResponse: gramaSathiResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending to Grama-Sathi:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send consultation data to Grama-Sathi',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});