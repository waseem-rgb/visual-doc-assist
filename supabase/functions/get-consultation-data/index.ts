import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsultationRequest {
  analysis_id: string;
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysis_id, token }: ConsultationRequest = await req.json();

    if (!analysis_id || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing analysis_id or token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call DAIGASST API to get consultation data
    console.log('Fetching consultation data from DAIGASST:', { analysis_id });
    
    const daigasstResponse = await fetch('https://opvssqukuyemcxgoflzz.supabase.co/functions/v1/daigasst-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_analysis',
        analysis_id: analysis_id,
        token: token
      })
    });

    if (!daigasstResponse.ok) {
      throw new Error(`DAIGASST API error: ${daigasstResponse.statusText}`);
    }

    const consultationData = await daigasstResponse.json();
    
    console.log('Successfully fetched consultation data:', consultationData);

    return new Response(
      JSON.stringify(consultationData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching consultation data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch consultation data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});