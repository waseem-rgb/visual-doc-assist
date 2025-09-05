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
    const url = new URL(req.url);
    const prescriptionId = url.searchParams.get('id');
    const requestId = url.searchParams.get('r');

    if (!prescriptionId && !requestId) {
      return new Response('Missing prescription ID or request ID', { status: 400 });
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get prescription info to generate fresh download URL
    let prescription;
    if (prescriptionId) {
      const { data } = await adminSupabase
        .from('prescriptions')
        .select('id, pdf_url, pdf_bucket, request_id')
        .eq('id', prescriptionId)
        .single();
      prescription = data;
    } else if (requestId) {
      const { data } = await adminSupabase
        .from('prescriptions')
        .select('id, pdf_url, pdf_bucket, request_id')
        .eq('request_id', requestId)
        .single();
      prescription = data;
    }

    if (!prescription || !prescription.pdf_url) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prescription Not Ready</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .logo { color: #2c5aa0; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">VrDoc</div>
            <h1>Prescription Not Ready</h1>
            <p>Your prescription is still being generated. Please try again in a few minutes or contact support if this issue persists.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Use the correct bucket based on prescription data
    const bucketName = prescription.pdf_bucket || 'prescriptions';
    const filePath = prescription.pdf_url;

    // Create fresh signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Download Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .logo { color: #2c5aa0; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">VrDoc</div>
            <h1>Download Error</h1>
            <p>Unable to generate download link. Please try again later or contact support.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 500
      });
    }

    // Redirect to the actual download URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': signedUrlData.signedUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error in prescription-redirect function:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #e74c3c; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .logo { color: #2c5aa0; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">VrDoc</div>
          <h1>Service Error</h1>
          <p>An error occurred while processing your request. Please try again later.</p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
});