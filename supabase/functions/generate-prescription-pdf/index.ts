import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.182.0/encoding/base64.ts'

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
    const { requestId, doctorId } = await req.json();

    if (!requestId || !doctorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
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
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        prescription_requests!inner(*)
      `)
      .eq('id', requestId)
      .eq('doctor_id', doctorId)
      .single();

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

    // Fetch doctor profile
    const { data: doctor, error: doctorError } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      console.error('Error fetching doctor profile:', doctorError);
      return new Response(
        JSON.stringify({ error: 'Doctor profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Download prescription template from storage
    const { data: templateData, error: templateError } = await supabase.storage
      .from('new_prescription-templet')
      .download('prescription_template.docx'); // Assuming the template is named this

    if (templateError) {
      console.error('Error downloading template:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate HTML content for the prescription
    const htmlContent = generatePrescriptionHTML({
      prescription,
      doctor,
      request: prescription.prescription_requests
    });

    // Convert HTML to PDF (simplified version - in production, you'd use a proper PDF library)
    const pdfContent = await generatePDFFromHTML(htmlContent);
    
    // Upload PDF to storage
    const fileName = `prescription-${requestId}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save PDF' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get signed URL for the PDF
    const { data: signedUrlData } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Update prescription record with PDF URL
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ pdf_url: signedUrlData?.signedUrl })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating prescription with PDF URL:', updateError);
    }

    console.log(`Prescription PDF generated successfully for request ${requestId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: signedUrlData?.signedUrl,
        fileName 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generatePrescriptionHTML(data: any): string {
  const { prescription, doctor, request } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prescription</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .doctor-info {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
        }
        .clinic-info {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .patient-info {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .prescription-body {
          margin: 20px 0;
        }
        .rx-symbol {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 15px;
        }
        .medication {
          margin-bottom: 15px;
          padding: 10px;
          border-left: 4px solid #2563eb;
          background-color: #f8fafc;
        }
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background-color: #fef3c7;
          border-radius: 8px;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .signature {
          margin-top: 30px;
          text-align: right;
        }
        .date {
          margin-bottom: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="doctor-info">${doctor.full_name}</div>
        <div class="clinic-info">${doctor.specialization}</div>
        <div class="clinic-info">License: ${doctor.license_number}</div>
        <div class="clinic-info">VrDoc Virtual Healthcare Platform</div>
      </div>

      <div class="date">Date: ${currentDate}</div>

      <div class="patient-info">
        <strong>Patient Information:</strong><br>
        Name: ${prescription.patient_name}<br>
        Age: ${prescription.patient_age}<br>
        Gender: ${prescription.patient_gender}<br>
        Chief Complaint: ${request.body_part}
      </div>

      <div class="prescription-body">
        <div class="rx-symbol">℞ (Prescription)</div>
        
        <strong>Diagnosis:</strong><br>
        <p>${prescription.diagnosis || 'As assessed'}</p>

        ${prescription.medications ? `
        <strong>Medications:</strong>
        <div class="medication">
          ${prescription.medications.split('\\n').map((med: string) => `<div>• ${med}</div>`).join('')}
        </div>
        ` : ''}

        ${prescription.instructions ? `
        <div class="instructions">
          <strong>Instructions:</strong><br>
          ${prescription.instructions}
        </div>
        ` : ''}

        ${prescription.follow_up_notes ? `
        <strong>Follow-up:</strong><br>
        <p>${prescription.follow_up_notes}</p>
        ` : ''}
      </div>

      <div class="signature">
        <div>_________________________</div>
        <div>${doctor.full_name}</div>
        <div>${doctor.specialization}</div>
        <div>Digital Signature</div>
      </div>

      <div class="footer">
        <p>This prescription was generated through VrDoc Virtual Healthcare Platform</p>
        <p>For queries, contact your healthcare provider</p>
        <p><strong>Disclaimer:</strong> This is a digitally generated prescription. Follow medication instructions carefully.</p>
      </div>
    </body>
    </html>
  `;
}

// Simplified PDF generation - in production, use a proper PDF library
async function generatePDFFromHTML(html: string): Promise<Uint8Array> {
  // For now, we'll create a simple text-based "PDF" 
  // In production, you'd integrate with a proper HTML-to-PDF service
  const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const encoder = new TextEncoder();
  return encoder.encode(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n\n4 0 obj\n<< /Length ${textContent.length} >>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n(${textContent}) Tj\nET\nendstream\nendobj\n\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000201 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${300 + textContent.length}\n%%EOF`);
}