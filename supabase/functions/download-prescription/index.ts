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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Client with user's JWT for authorization checks
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service role client for storage operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has access to the prescription using RLS
    let query = userSupabase
      .from('prescriptions')
      .select('*, prescription_requests!inner(customer_id), pdf_bucket')
      .single();
    
    if (prescriptionId) {
      query = query.eq('id', prescriptionId);
    } else {
      query = query.eq('request_id', requestId);
    }

    const { data: prescription, error: prescriptionError } = await query;

    if (prescriptionError || !prescription) {
      console.error('Error fetching prescription or unauthorized access:', prescriptionError);
      return new Response(
        JSON.stringify({ error: 'Prescription not found or access denied' }),
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

    // Use the correct bucket based on prescription data
    const bucketName = prescription.pdf_bucket || 'prescriptions';
    const filePath = prescription.pdf_url;

    console.log(`Attempting to access file in bucket: ${bucketName}`);

    // SECURITY FIX: Always use signed URLs for prescription downloads to prevent unauthorized access
    // Public buckets expose sensitive medical data - use signed URLs with proper expiration

    // Create fresh signed URL (valid for 1 hour) using admin client for private buckets
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
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