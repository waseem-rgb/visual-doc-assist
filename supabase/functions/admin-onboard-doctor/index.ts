import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OnboardDoctorRequest {
  email: string;
  full_name: string;
  specialization?: string;
  license_number?: string;
  phone?: string;
  temporary_password: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract and verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is super admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .single();

    if (adminError || !adminCheck) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Access denied - Super admin role required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      // Create doctor onboarding request
      const body: OnboardDoctorRequest = await req.json();
      
      console.log('Creating doctor onboarding request:', { 
        email: body.email, 
        full_name: body.full_name,
        admin_id: user.id
      });

      // Validate required fields
      if (!body.email || !body.full_name || !body.temporary_password) {
        return new Response(
          JSON.stringify({ error: 'Email, full_name, and temporary_password are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Create the doctor onboarding request
      const { data: onboardingRequest, error: createError } = await supabase
        .from('doctor_onboarding_requests')
        .insert({
          email: body.email,
          full_name: body.full_name,
          specialization: body.specialization,
          license_number: body.license_number,
          phone: body.phone,
          temporary_password: body.temporary_password, // In production, this should be hashed
          created_by: user.id,
          notes: body.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating onboarding request:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create onboarding request', 
            details: createError.message 
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Now create the actual doctor account using admin privileges
      const { data: doctorUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.temporary_password,
        email_confirm: true, // Auto-confirm email for admin-created accounts
        user_metadata: {
          full_name: body.full_name,
          role: 'doctor',
          onboarded_by_admin: true
        }
      });

      if (signUpError) {
        console.error('Error creating doctor user:', signUpError);
        
        // Update onboarding request status to failed
        await supabase
          .from('doctor_onboarding_requests')
          .update({ status: 'failed', notes: `Failed to create user: ${signUpError.message}` })
          .eq('id', onboardingRequest.id);

        return new Response(
          JSON.stringify({ 
            error: 'Failed to create doctor account', 
            details: signUpError.message 
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Doctor user created:', { id: doctorUser.user.id, email: doctorUser.user.email });

      // Assign doctor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: doctorUser.user.id,
          role: 'doctor'
        });

      if (roleError) {
        console.error('Error assigning doctor role:', roleError);
      }

      // Create doctor profile
      const { error: profileError } = await supabase
        .from('doctor_profiles')
        .insert({
          id: doctorUser.user.id,
          full_name: body.full_name,
          specialization: body.specialization || 'General Medicine',
          license_number: body.license_number,
          phone: body.phone
        });

      if (profileError) {
        console.error('Error creating doctor profile:', profileError);
      }

      // Update onboarding request with success
      await supabase
        .from('doctor_onboarding_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          doctor_user_id: doctorUser.user.id
        })
        .eq('id', onboardingRequest.id);

      // Log admin action
      await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action: 'create_doctor_account',
          target_type: 'doctor',
          target_id: doctorUser.user.id,
          details: {
            doctor_email: body.email,
            doctor_name: body.full_name,
            onboarding_request_id: onboardingRequest.id
          }
        });

      console.log('Doctor onboarding completed successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Doctor account created successfully',
          doctor_id: doctorUser.user.id,
          onboarding_request_id: onboardingRequest.id
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (req.method === 'GET') {
      // Get all doctor onboarding requests
      const { data: requests, error: fetchError } = await supabase
        .from('doctor_onboarding_requests')
        .select(`
          *,
          created_by_admin:admin_users!created_by(email, role)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching onboarding requests:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch onboarding requests' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          requests: requests || []
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});