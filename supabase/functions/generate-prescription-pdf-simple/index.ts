import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1/es'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility function to strip markdown formatting
const stripMarkdown = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
    .replace(/`(.*?)`/g, '$1') // Remove code `text`
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .trim();
};

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

    const { requestId, doctorId, isReferral } = await req.json();
    
    console.log('VrDoc PDF generation request:', { requestId, doctorId, isReferral });

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Missing requestId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    // Service role client for database operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user to verify doctor role
    const { data: user, error: userError } = await userSupabase.auth.getUser();
    
    if (userError || !user?.user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For referrals, skip doctor role check (customers can generate referrals)
    // For regular prescriptions, verify doctor role
    let isUserDoctor = false;
    if (!isReferral) {
      const { data: userRoles, error: roleError } = await userSupabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.user.id)
        .single();

      if (roleError || !userRoles || userRoles.role !== 'doctor') {
        console.error('Unauthorized: User is not a doctor', roleError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Doctor role required for prescriptions' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      isUserDoctor = true;
    }

    // Fetch prescription request data using admin client
    const { data: requestData, error: requestError } = await adminSupabase
      .from('prescription_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      console.error('Prescription request not found:', requestError);
      return new Response(
        JSON.stringify({ error: 'Prescription request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to fetch existing prescription or create one for referral cases
    let prescription;
    let doctor;
    let referralText = null;

    if (isReferral || !requestData.prescription_required) {
      // For referral cases, fetch the referral text from New Master table
      const diagnosis = requestData.database_diagnosis || requestData.probable_diagnosis;
      console.log('Looking for referral info for diagnosis:', diagnosis);
      
      let { data: masterData, error: masterError } = await adminSupabase
        .from('New Master')
        .select('"prescription_Y-N", "Probable Diagnosis"')
        .ilike('"Probable Diagnosis"', `%${diagnosis}%`)
        .maybeSingle();

      // If no match found with diagnosis, try with symptoms as fallback
      if (!masterData && requestData.symptoms) {
        console.log('Trying with symptoms:', requestData.symptoms);
        const { data: symptomData } = await adminSupabase
          .from('New Master')
          .select('"prescription_Y-N", "Probable Diagnosis"')
          .ilike('Symptoms', `%${requestData.symptoms}%`)
          .maybeSingle();
        masterData = symptomData;
      }

      referralText = masterData?.['prescription_Y-N'] || 'specialist';
      console.log('Referral text found:', referralText, 'for diagnosis:', masterData?.['Probable Diagnosis']);

      // Create a referral prescription if it doesn't exist - use NULL doctor_id
      const { data: existingPrescription } = await adminSupabase
        .from('prescriptions')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (!existingPrescription) {
        const { data: newPrescription, error: createError } = await adminSupabase
          .from('prescriptions')
          .insert({
            request_id: requestId,
            doctor_id: null, // Use NULL instead of system UUID
            patient_name: requestData.patient_name,
            patient_age: requestData.patient_age,
            patient_gender: requestData.patient_gender,
            diagnosis: requestData.database_diagnosis || requestData.probable_diagnosis || 'Referral required',
            medications: '[]',
            instructions: `Referred to: ${referralText}`,
            prescription_date: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating referral prescription:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create referral prescription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        prescription = newPrescription;
      } else {
        prescription = existingPrescription;
      }

      // Set system doctor for referrals
      doctor = {
        full_name: 'VrDoc System',
        specialization: 'Referral Service',
        license_number: 'VRDOC-REF-001',
        phone: 'N/A'
      };
    } else {
      // For regular prescriptions, fetch the actual prescription and doctor
      const { data: existingPrescription, error: prescriptionError } = await adminSupabase
        .from('prescriptions')
        .select('*')
        .eq('request_id', requestId)
        .eq('doctor_id', doctorId)
        .single();

      if (prescriptionError || !existingPrescription) {
        console.error('Prescription not found:', prescriptionError);
        return new Response(
          JSON.stringify({ error: 'Prescription not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: doctorProfile, error: doctorError } = await adminSupabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (doctorError || !doctorProfile) {
        console.error('Doctor not found:', doctorError);
        return new Response(
          JSON.stringify({ error: 'Doctor profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      prescription = existingPrescription;
      doctor = doctorProfile;
    }

    // Create PDF with VrDoc template
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 800;
    const leftMargin = 50;
    const rightMargin = 545;
    const pageWidth = 495;

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

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number = 12) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = testLine.length * (fontSize * 0.6); // Approximate width
        
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };

    // 1. Green Header with VrDoc
    page.drawRectangle({
      x: 0,
      y: yPosition - 5,
      width: 595,
      height: 50,
      color: rgb(0.2, 0.6, 0.2), // Green color
    });

    addText('VrDoc', leftMargin, yPosition + 15, { 
      bold: true, 
      size: 24,
      color: rgb(1, 1, 1) // White text
    });

    yPosition -= 70;

    // 2. Doctor Information (Left side)
    addText(`Dr. ${doctor.full_name}`, leftMargin, yPosition, { bold: true, size: 14 });
    yPosition -= 15;
    addText(`${doctor.specialization || 'General Medicine'}`, leftMargin, yPosition, { size: 11 });
    yPosition -= 12;
    addText(`License: ${doctor.license_number || 'N/A'}`, leftMargin, yPosition, { size: 11 });
    yPosition -= 12;
    addText(`Phone: ${doctor.phone || 'N/A'}`, leftMargin, yPosition, { size: 11 });
    
    // Patient Information (Right side - same level as doctor)
    const patientStartY = yPosition + 39;
    addText(`Patient: ${requestData.patient_name}`, rightMargin - 200, patientStartY, { bold: true, size: 12 });
    addText(`Age: ${requestData.patient_age}`, rightMargin - 200, patientStartY - 15, { size: 11 });
    addText(`Gender: ${requestData.patient_gender}`, rightMargin - 200, patientStartY - 30, { size: 11 });
    addText(`Mobile: ${requestData.patient_phone || 'N/A'}`, rightMargin - 200, patientStartY - 45, { size: 11 });
    addText(`Date: ${new Date().toLocaleDateString()}`, rightMargin - 200, patientStartY - 60, { size: 11 });

    yPosition -= 50;

    // Horizontal line separator
    page.drawLine({
      start: { x: leftMargin, y: yPosition },
      end: { x: rightMargin, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPosition -= 25;

    // 3. C/o- (Chief complaint from symptoms)
    if (requestData.symptoms && requestData.symptoms.trim()) {
      addText('C/o-', leftMargin, yPosition, { bold: true, size: 12 });
      yPosition -= 15;
      
      const symptomLines = wrapText(requestData.symptoms, pageWidth - 50);
      for (const line of symptomLines) {
        addText(line, leftMargin + 20, yPosition, { size: 11 });
        yPosition -= 12;
      }
      yPosition -= 10;
    }

    // 4. H/o- (History from clinical_history)
    if (requestData.clinical_history && requestData.clinical_history.trim()) {
      addText('H/o-', leftMargin, yPosition, { bold: true, size: 12 });
      yPosition -= 15;
      
      const historyLines = wrapText(requestData.clinical_history, pageWidth - 50);
      for (const line of historyLines) {
        addText(line, leftMargin + 20, yPosition, { size: 11 });
        yPosition -= 12;
      }
      yPosition -= 10;
    }

    // 5. Medication History (only if exists)
    if (requestData.medication_history && requestData.medication_history.trim()) {
      addText('Current Medications:', leftMargin, yPosition, { bold: true, size: 12 });
      yPosition -= 15;
      
      const medicationLines = wrapText(requestData.medication_history, pageWidth - 50);
      for (const line of medicationLines) {
        addText(line, leftMargin + 20, yPosition, { size: 11 });
        yPosition -= 12;
      }
      yPosition -= 15;
    }

    // 6. DIAGNOSIS (use diagnosis from prescription table)
    if (prescription.diagnosis && prescription.diagnosis.trim()) {
      addText('DIAGNOSIS:', leftMargin, yPosition, { bold: true, size: 13 });
      yPosition -= 18;
      
      const diagnosisLines = wrapText(prescription.diagnosis, pageWidth);
      for (const line of diagnosisLines) {
        addText(line, leftMargin, yPosition, { size: 12, bold: true });
        yPosition -= 15;
      }
      yPosition -= 10;
    }

    // 7. Rx Section (with regular Rx text or referral text)
    addText('Rx', leftMargin, yPosition, { bold: true, size: 16 });
    yPosition -= 25;

    // For referral cases, show referral text instead of medications
    if (referralText && (isReferral || !requestData.prescription_required)) {
      addText(`Referred to: ${referralText}`, leftMargin + 20, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
    } else {
      // Parse and display prescribed medications for regular prescriptions
      try {
        // Handle both string and array cases
        let medications;
        if (typeof prescription.medications === 'string') {
          medications = JSON.parse(prescription.medications || '[]');
        } else {
          medications = prescription.medications || [];
        }
        
        if (medications && medications.length > 0) {
          medications.forEach((med: any, index: number) => {
            const medName = stripMarkdown(med.name || med.generic_name || 'Unknown medication');
            const dosage = stripMarkdown(med.prescribed_dosage || med.common_dosages || '');
            const frequency = stripMarkdown(med.frequency || '');
            const duration = stripMarkdown(med.duration || '');
            const instructions = stripMarkdown(med.instructions || '');
            
            // Medication name
            addText(`${index + 1}. ${medName}`, leftMargin + 20, yPosition, { bold: true, size: 11 });
            yPosition -= 15;
            
            // Dosage and frequency on same line if both exist
            let dosageText = '';
            if (dosage && frequency) {
              dosageText = `${dosage}, ${frequency}`;
            } else if (dosage) {
              dosageText = dosage;
            } else if (frequency) {
              dosageText = frequency;
            }
            
            if (dosageText) {
              addText(`   ${dosageText}`, leftMargin + 30, yPosition, { size: 10 });
              yPosition -= 12;
            }
            
            if (duration) {
              addText(`   Duration: ${duration}`, leftMargin + 30, yPosition, { size: 10 });
              yPosition -= 12;
            }
            
            if (instructions) {
              const instructionLines = wrapText(instructions, pageWidth - 80);
              instructionLines.forEach(line => {
                addText(`   ${line}`, leftMargin + 30, yPosition, { size: 9 });
                yPosition -= 10;
              });
            }
            
            yPosition -= 8;
          });
        } else {
          addText('No medications prescribed', leftMargin + 20, yPosition, { size: 11 });
          yPosition -= 20;
        }
      } catch (error) {
        console.error('Error parsing medications:', error);
        addText('Error displaying medications', leftMargin + 20, yPosition, { size: 11 });
        yPosition -= 20;
      }
    }

    yPosition -= 15;

    // 8. INVESTIGATIONS (only for regular prescriptions, not referrals)
    if (!isReferral && !referralText && requestData.basic_investigations && requestData.basic_investigations.trim()) {
      addText('INVESTIGATIONS:', leftMargin, yPosition, { bold: true, size: 13 });
      yPosition -= 18;
      
      const investigationLines = wrapText(requestData.basic_investigations, pageWidth);
      for (const line of investigationLines) {
        addText(line, leftMargin, yPosition, { size: 11 });
        yPosition -= 13;
      }
      yPosition -= 15;
    }

    // Instructions (only for regular prescriptions, not referrals)
    if (!isReferral && !referralText && prescription.instructions && prescription.instructions.trim() && !prescription.instructions.includes('Referred to:')) {
      addText('Instructions:', leftMargin, yPosition, { bold: true, size: 12 });
      yPosition -= 15;
      
      const cleanInstructions = stripMarkdown(prescription.instructions);
      const instructionLines = wrapText(cleanInstructions, pageWidth);
      for (const line of instructionLines) {
        addText(line, leftMargin, yPosition, { size: 11 });
        yPosition -= 13;
      }
      yPosition -= 20;
    }

    // 9. Digital Signature Section
    yPosition = Math.min(yPosition, 150); // Ensure signature is at bottom
    
    // Signature line
    page.drawLine({
      start: { x: rightMargin - 200, y: yPosition },
      end: { x: rightMargin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    addText('Digital Signature', rightMargin - 180, yPosition - 15, { size: 10 });
    addText(`Dr. ${doctor.full_name}`, rightMargin - 180, yPosition - 30, { bold: true, size: 11 });
    addText(`${doctor.license_number || 'License: N/A'}`, rightMargin - 180, yPosition - 45, { size: 9 });

    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    
    // Upload to private storage bucket
    const fileName = `vrdoc-prescription-${prescription.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await adminSupabase.storage
      .from('prescriptions')
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
    const { error: updateError } = await adminSupabase
      .from('prescriptions')
      .update({ 
        pdf_url: fileName,
        pdf_bucket: 'prescriptions'
      })
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Don't fail the request if update fails, PDF is still generated
    }

    console.log('VrDoc PDF generated successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileName,
        message: 'VrDoc PDF generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('VrDoc PDF generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'VrDoc PDF generation failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
