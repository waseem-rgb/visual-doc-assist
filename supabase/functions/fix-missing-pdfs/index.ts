import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Scanning for prescriptions with missing PDFs...');

    // Find all completed prescriptions without PDFs
    const { data: prescriptionsNeedingPdfs, error: fetchError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        request_id,
        doctor_id,
        pdf_url,
        prescription_requests!inner(
          id,
          status,
          patient_name
        )
      `)
      .is('pdf_url', null)
      .eq('prescription_requests.status', 'completed');

    if (fetchError) {
      console.error('Error fetching prescriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch prescriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${prescriptionsNeedingPdfs?.length || 0} prescriptions needing PDFs`);

    const results = [];

    if (prescriptionsNeedingPdfs && prescriptionsNeedingPdfs.length > 0) {
      for (const prescription of prescriptionsNeedingPdfs) {
        try {
          console.log(`Generating PDF for prescription ${prescription.id} (${prescription.prescription_requests.patient_name})`);
          
          // Call the PDF generation function
          const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-prescription-pdf', {
            body: {
              requestId: prescription.request_id,
              doctorId: prescription.doctor_id
            }
          });

          if (pdfError) {
            console.error(`Failed to generate PDF for ${prescription.id}:`, pdfError);
            results.push({
              prescriptionId: prescription.id,
              patientName: prescription.prescription_requests.patient_name,
              status: 'failed',
              error: pdfError.message
            });
          } else {
            console.log(`Successfully generated PDF for ${prescription.id}`);
            results.push({
              prescriptionId: prescription.id,
              patientName: prescription.prescription_requests.patient_name,
              status: 'success'
            });
          }
        } catch (error) {
          console.error(`Error processing prescription ${prescription.id}:`, error);
          results.push({
            prescriptionId: prescription.id,
            patientName: prescription.prescription_requests.patient_name,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} prescriptions`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});