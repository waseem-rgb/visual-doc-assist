import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  type: 'case_claimed' | 'prescription_ready' | 'consultation_update';
  patientName?: string;
  doctorName?: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('SMS notification attempt without authorization');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.user) {
      console.error('SMS notification attempt with invalid token:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has doctor role (only doctors should send SMS notifications)
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id);

    const hasDocRole = userRoles?.some(r => r.role === 'doctor');
    if (roleError || !hasDocRole) {
      console.error('SMS notification attempt by non-doctor user:', user.user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Doctor role required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { to, message, type, patientName, doctorName }: SMSRequest = await req.json();
    
    // Log without PII - only log type and success/failure
    console.log(`Sending SMS notification of type: ${type}`);

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Missing Twilio credentials');
    }

    // Format phone number - ensure it starts with +
    let formattedTo = to.startsWith('+') ? to : `+${to}`;
    
    // Generate message based on type if not provided
    let finalMessage = message;
    if (!message) {
      switch (type) {
        case 'case_claimed':
          finalMessage = `Hello ${patientName || 'Patient'}, your consultation request has been assigned to Dr. ${doctorName || 'our medical team'}. You will receive updates shortly.`;
          break;
        case 'prescription_ready':
          finalMessage = `Hello ${patientName || 'Patient'}, your prescription from Dr. ${doctorName || 'your doctor'} is ready for download. Please check your patient portal.`;
          break;
        case 'consultation_update':
          finalMessage = `Hello ${patientName || 'Patient'}, there's an update on your consultation. Please check your patient portal for details.`;
          break;
        default:
          finalMessage = 'You have an update from your healthcare provider.';
      }
    }

    // Send SMS using Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: formattedTo,
        Body: finalMessage,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', result);
      throw new Error(`Twilio error: ${result.message || 'Failed to send SMS'}`);
    }

    console.log('SMS sent successfully, SID:', result.sid);

    return new Response(JSON.stringify({ 
      success: true, 
      messageSid: result.sid,
      message: 'SMS sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-sms-notification function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(serve_handler);