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
    const { requestId, prescriptionId } = await req.json();

    if (!requestId && !prescriptionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: requestId or prescriptionId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch prescription data
    let query = supabase
      .from('prescriptions')
      .select('*');
    
    if (prescriptionId) {
      query = query.eq('id', prescriptionId);
    } else {
      query = query.eq('request_id', requestId);
    }

    const { data: prescription, error: prescriptionError } = await query.single();

    if (prescriptionError || !prescription) {
      console.error('Error fetching prescription:', prescriptionError);
      return new Response(
        JSON.stringify({ error: 'Prescription not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if PDF file path exists
    if (!prescription.pdf_url) {
      return new Response(
        JSON.stringify({ error: 'PDF not yet generated' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Determine which bucket to use (support both old and new buckets)
    const bucketName = prescription.pdf_bucket || 'new_prescription-templet';
    const filePath = prescription.pdf_url;

    console.log(`Attempting to create signed URL for file: ${filePath} in bucket: ${bucketName}`);

    // Create fresh signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      
      // If the file doesn't exist in new bucket, try the old bucket
      if (bucketName === 'new_prescription-templet') {
        console.log('Trying old prescriptions bucket...');
        const { data: fallbackUrlData, error: fallbackError } = await supabase.storage
          .from('prescriptions')
          .createSignedUrl(filePath, 3600);
          
        if (fallbackError || !fallbackUrlData?.signedUrl) {
          return new Response(
            JSON.stringify({ error: 'Failed to generate download link' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            downloadUrl: fallbackUrlData.signedUrl,
            fileName: filePath
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully created signed URL for prescription download`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        downloadUrl: signedUrlData.signedUrl,
        fileName: filePath
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in download-prescription function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});