import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1/es'

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
    
    console.log('Simple PDF generation request:', { requestId, doctorId });

    if (!requestId || !doctorId) {
      return new Response(
        JSON.stringify({ error: 'Missing requestId or doctorId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch prescription and request data
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        prescription_requests!inner(*)
      `)
      .eq('request_id', requestId)
      .eq('doctor_id', doctorId)
      .single();

    if (prescriptionError || !prescription) {
      console.error('Prescription not found:', prescriptionError);
      return new Response(
        JSON.stringify({ error: 'Prescription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch doctor profile
    const { data: doctor, error: doctorError } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      console.error('Doctor not found:', doctorError);
      return new Response(
        JSON.stringify({ error: 'Doctor profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create PDF with simplified approach
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 780;
    const leftMargin = 50;
    const pageWidth = 545;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      page.drawText(text, {
        x,
        y,
        size: options.size || 12,
        font: options.bold ? boldFont : font,
        color: options.color || rgb(0, 0, 0),
      });
    };

    // Header
    addText('MEDICAL PRESCRIPTION', leftMargin, yPosition, { bold: true, size: 20 });
    yPosition -= 40;

    // Doctor Information
    addText('Doctor Information:', leftMargin, yPosition, { bold: true, size: 14 });
    yPosition -= 20;
    addText(`Dr. ${doctor.full_name}`, leftMargin, yPosition);
    yPosition -= 15;
    addText(`Specialization: ${doctor.specialization || 'General Medicine'}`, leftMargin, yPosition);
    yPosition -= 15;
    addText(`License: ${doctor.license_number || 'N/A'}`, leftMargin, yPosition);
    yPosition -= 15;
    addText(`Phone: ${doctor.phone || 'N/A'}`, leftMargin, yPosition);
    yPosition -= 30;

    // Patient Information
    addText('Patient Information:', leftMargin, yPosition, { bold: true, size: 14 });
    yPosition -= 20;
    addText(`Name: ${prescription.patient_name}`, leftMargin, yPosition);
    yPosition -= 15;
    addText(`Age: ${prescription.patient_age} years`, leftMargin, yPosition);
    yPosition -= 15;
    addText(`Gender: ${prescription.patient_gender}`, leftMargin, yPosition);
    yPosition -= 30;

    // Diagnosis
    addText('Diagnosis:', leftMargin, yPosition, { bold: true, size: 14 });
    yPosition -= 20;
    const diagnosis = prescription.diagnosis || 'No diagnosis provided';
    addText(diagnosis, leftMargin, yPosition);
    yPosition -= 30;

    // Medications
    addText('Prescribed Medications:', leftMargin, yPosition, { bold: true, size: 14 });
    yPosition -= 20;

    try {
      const medications = JSON.parse(prescription.medications || '[]');
      
      if (medications && medications.length > 0) {
        medications.forEach((med: any, index: number) => {
          const medName = med.name || med.generic_name || 'Unknown medication';
          const dosage = med.prescribed_dosage || med.common_dosages || '';
          const frequency = med.frequency || '';
          const duration = med.duration || '';
          
          addText(`${index + 1}. ${medName}`, leftMargin + 10, yPosition);
          yPosition -= 15;
          
          if (dosage) {
            addText(`   Dosage: ${dosage}`, leftMargin + 20, yPosition);
            yPosition -= 12;
          }
          
          if (frequency) {
            addText(`   Frequency: ${frequency}`, leftMargin + 20, yPosition);
            yPosition -= 12;
          }
          
          if (duration) {
            addText(`   Duration: ${duration}`, leftMargin + 20, yPosition);
            yPosition -= 12;
          }
          
          yPosition -= 10;
        });
      } else {
        addText('No medications prescribed', leftMargin + 10, yPosition);
        yPosition -= 20;
      }
    } catch (error) {
      console.error('Error parsing medications:', error);
      addText('Error displaying medications', leftMargin + 10, yPosition);
      yPosition -= 20;
    }

    // Instructions
    if (prescription.instructions && prescription.instructions.trim()) {
      yPosition -= 10;
      addText('Instructions:', leftMargin, yPosition, { bold: true, size: 14 });
      yPosition -= 20;
      addText(prescription.instructions, leftMargin, yPosition);
      yPosition -= 30;
    }

    // Date and Signature
    yPosition -= 20;
    const currentDate = new Date().toLocaleDateString();
    addText(`Date: ${currentDate}`, leftMargin, yPosition);
    yPosition -= 30;
    addText('Doctor Signature: ________________________', leftMargin, yPosition);

    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    
    // Upload to storage
    const fileName = `prescription-${prescription.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('new_prescription-templet')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update prescription with PDF URL
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ 
        pdf_url: fileName,
        pdf_bucket: 'new_prescription-templet'
      })
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Don't fail the request if update fails, PDF is still generated
    }

    console.log('PDF generated successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileName,
        message: 'PDF generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'PDF generation failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});