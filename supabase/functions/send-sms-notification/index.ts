import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message?: string;
  type: 'case_claimed' | 'prescription_ready' | 'consultation_update' | 'prescription_requested' | 'referral_submitted' | 'appointment_booked' | 'teleconsultation_booked' | 'new_teleconsultation_assigned';
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  isReferral?: boolean;
  referralSpecialist?: string;
  joinLink?: string;
  appointmentId?: string;
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

    const { to, message, type, patientName, doctorName, appointmentDate, appointmentTime, isReferral, referralSpecialist, joinLink, appointmentId }: SMSRequest = await req.json();
    
    // Log without PII - only log type and success/failure
    console.log(`Sending SMS notification of type: ${type}`);

    // Check if user has doctor role (only for certain message types)
    const doctorOnlyTypes = ['case_claimed', 'prescription_ready'];
    
    if (doctorOnlyTypes.includes(type)) {
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.user.id);

      const hasDocRole = userRoles?.some(r => r.role === 'doctor');
      if (roleError || !hasDocRole) {
        console.error('SMS notification attempt by non-doctor user for doctor-only type:', user.user.id, type);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Doctor role required for this message type' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Missing Twilio credentials');
    }

    // Format phone number with proper country code
    let formattedTo = to;
    
    if (!to.startsWith('+')) {
      // Check if it's an Indian number (10 digits starting with 6-9)
      if (/^[6-9]\d{9}$/.test(to)) {
        formattedTo = `+91${to}`;
      } else {
        // Default to adding + prefix for other numbers
        formattedTo = `+${to}`;
      }
    }
    
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
        case 'prescription_requested':
          finalMessage = `Hello ${patientName || 'Patient'}, your prescription request has been submitted successfully. A doctor will review it and you'll be notified when it's ready.`;
          break;
        case 'referral_submitted':
          if (isReferral && referralSpecialist) {
            finalMessage = `Hello ${patientName || 'Patient'}, based on your consultation, you have been referred to a ${referralSpecialist}. Please check your patient portal for referral details.`;
          } else {
            finalMessage = `Hello ${patientName || 'Patient'}, your consultation has been processed. Please check your patient portal for details.`;
          }
          break;
        case 'appointment_booked':
          finalMessage = `Hello ${patientName || 'Patient'}, your teleconsultation appointment with Dr. ${doctorName || 'your doctor'} has been confirmed for ${appointmentDate || 'the scheduled date'}${appointmentTime ? ` at ${appointmentTime}` : ''}. You'll receive a WhatsApp link shortly.`;
          break;
        case 'teleconsultation_booked':
          finalMessage = `🎥 Teleconsultation Booked! Hello ${patientName || 'Patient'}, your video consultation with Dr. ${doctorName || 'your doctor'} is confirmed for ${appointmentDate || 'the scheduled date'}${appointmentTime ? ` at ${appointmentTime}` : ''}. ${joinLink ? `Join here: ${joinLink}` : 'You will receive the join link shortly.'}`;
          break;
        case 'new_teleconsultation_assigned':
          finalMessage = `📋 New Consultation Assigned. Hello Dr. ${doctorName || 'Doctor'}, you have a new teleconsultation with ${patientName || 'Patient'} on ${appointmentDate || 'the scheduled date'}${appointmentTime ? ` at ${appointmentTime}` : ''}. ${joinLink ? `Join here: ${joinLink}` : 'Check your dashboard for details.'}`;
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