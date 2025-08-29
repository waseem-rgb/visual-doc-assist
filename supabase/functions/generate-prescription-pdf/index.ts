import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

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
    
    console.log('PDF generation request received:', { requestId, doctorId });

    if (!requestId || !doctorId) {
      console.error('Missing required parameters:', { requestId, doctorId });
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
    console.log('Fetching prescription data for requestId:', requestId, 'doctorId:', doctorId);
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
      console.error('Error fetching prescription:', prescriptionError);
      console.log('Query parameters used:', { requestId, doctorId });
      return new Response(
        JSON.stringify({ error: 'Prescription not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Prescription data fetched successfully:', prescription.id);

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

    // Generate professional PDF without template dependency
    console.log('Generating professional PDF for prescription:', prescription.id);

    // Generate professional PDF
    const pdfContent = await generateProfessionalPDF({ 
      prescription, 
      doctor, 
      request: prescription.prescription_requests 
    });
    
    // Upload PDF to new_prescription-templet bucket as requested
    const fileName = `prescription-${prescription.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('new_prescription-templet')
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

    // Create fresh signed URL for immediate access
    const { data: signedUrlData } = await supabase.storage
      .from('new_prescription-templet')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Store the file path instead of the signed URL to avoid expiration issues
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ 
        pdf_url: fileName,  // Store file path instead of signed URL
        pdf_bucket: 'new_prescription-templet'  // Store bucket name for future reference
      })
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Error updating prescription with PDF path:', updateError);
    }

    console.log(`Prescription PDF generated successfully for prescription ${prescription.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: signedUrlData?.signedUrl,
        fileName,
        filePath: fileName
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

// Generate Indian standard prescription PDF format
async function generateProfessionalPDF(data: any): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Use built-in fonts to avoid loading errors
    let timesRoman, timesBold;
    try {
      timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      timesBold = await pdfDoc.embedFont(StandardFonts.TimesBold);
    } catch (fontError) {
      console.log('Font loading failed, using Helvetica as fallback');
      timesRoman = await pdfDoc.embedFont(StandardFonts.Helvetica);
      timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
    
    const { width, height } = page.getSize();
    
    // Light green background for header area (matching Indian format)
    page.drawRectangle({
      x: 0,
      y: height - 140,
      width: width,
      height: 140,
      color: rgb(0.90, 0.95, 0.90), // Very light green
    });
    
    let currentY = height - 30;
    
    // Header - Medical Prescription (centered)
    page.drawText('Medical Prescription', {
      x: width / 2 - 85,
      y: currentY,
      size: 20,
      font: timesBold,
      color: rgb(0.2, 0.6, 0.2), // Medical green
    });
    
    // VrDoc logo/branding (top right)
    page.drawText('VrDoc', {
      x: width - 80,
      y: currentY + 5,
      size: 14,
      font: timesBold,
      color: rgb(0.5, 0.3, 0.8), // Purple like in image
    });
    
    currentY -= 35;
    
    // Doctor Information (left side)
    page.drawText(`Dr. ${data.doctor?.full_name || 'Doctor Name'}`, {
      x: 50,
      y: currentY,
      size: 14,
      font: timesBold,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    currentY -= 18;
    page.drawText(`Specialization: ${data.doctor?.specialization || 'General Medicine'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    currentY -= 16;
    page.drawText(`License: ${data.doctor?.license_number || 'N/A'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    // Date (top right corner)
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    page.drawText(`Date: ${currentDate}`, {
      x: width - 120,
      y: height - 75,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    currentY -= 50; // Move to main content area
    
    // Patient Information Section
    page.drawText('PATIENT INFORMATION', {
      x: 50,
      y: currentY,
      size: 13,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    page.drawText(`Name: ${data.prescription?.patient_name || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 18;
    page.drawText(`Age: ${data.prescription?.patient_age || 'N/A'}    Gender: ${data.prescription?.patient_gender || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 30;
    
    // Clinical History Sections (Indian format)
    // C/o- (Chief complaint/symptom with duration)
    page.drawText('C/o-', {
      x: 50,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('( symptom with duration )', {
      x: 85,
      y: currentY,
      size: 10,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    currentY -= 18;
    const symptoms = data.request?.symptoms || data.request?.body_part || 'No symptoms reported';
    const symptomLines = wrapText(symptoms, 70);
    for (const line of symptomLines.slice(0, 2)) { // Limit to 2 lines
      page.drawText(line, {
        x: 70,
        y: currentY,
        size: 11,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 15;
    }
    
    currentY -= 10;
    
    // H/o- (History)
    page.drawText('H/o-', {
      x: 50,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('( history of any chronic illness and personal history of smoking or alcohol )', {
      x: 85,
      y: currentY,
      size: 10,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    currentY -= 18;
    // Extract chronic illness, smoking, alcohol from symptoms text if available
    const historyText = 'No significant history reported';
    page.drawText(historyText, {
      x: 70,
      y: currentY,
      size: 11,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    
    // Medication history- (Indian format)
    page.drawText('Medication history-', {
      x: 50,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('any medication customer is currently taking', {
      x: 170,
      y: currentY,
      size: 10,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    currentY -= 18;
    const medicationHistory = data.request?.medication_history || 'No current medications reported';
    const medHistoryLines = wrapText(medicationHistory, 70);
    for (const line of medHistoryLines.slice(0, 2)) { // Limit to 2 lines
      page.drawText(line, {
        x: 70,
        y: currentY,
        size: 11,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 15;
    }
    
    currentY -= 25;
    
    // Diagnosis Section
    page.drawText('DIAGNOSIS', {
      x: width / 2 - 30,
      y: currentY,
      size: 14,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    const diagnosis = data.prescription?.diagnosis || data.request?.probable_diagnosis || 'Unable to determine diagnosis. Please consult with a healthcare provider.';
    const diagnosisLines = wrapText(diagnosis, 65);
    for (const line of diagnosisLines.slice(0, 3)) { // Limit to 3 lines
      page.drawText(line, {
        x: 70,
        y: currentY,
        size: 12,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 16;
    }
    
    currentY -= 25;
    
    // Rx Section (Indian prescription symbol)
    page.drawText('℞', {
      x: width / 2 - 10,
      y: currentY,
      size: 28,
      font: timesBold,
      color: rgb(0.2, 0.4, 0.8), // Blue color for Rx symbol
    });
    
    currentY -= 35;
    
    // Medications Section
    if (data.prescription?.medications) {
      try {
        const medications = JSON.parse(data.prescription.medications);
        medications.forEach((med: any, index: number) => {
          const medName = med.name || med.medication_name || 'Medication';
          const dosage = med.prescribed_dosage || med.dosage || '';
          const frequency = med.frequency || '';
          const duration = med.duration || '';
          
          // Format like: "1. pantocid 40 mg tab Twice daily 7 days"
          let prescriptionLine = `${index + 1}. ${medName}`;
          if (dosage) prescriptionLine += ` ${dosage}`;
          if (frequency) prescriptionLine += ` ${frequency}`;
          if (duration) prescriptionLine += ` ${duration}`;
          
          page.drawText(prescriptionLine, {
            x: 80,
            y: currentY,
            size: 12,
            font: timesBold,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 18;
          
          // Add "Take before food" or instructions if available
          if (med.instructions) {
            page.drawText(`    ${med.instructions}`, {
              x: 100,
              y: currentY,
              size: 10,
              font: timesRoman,
              color: rgb(0.3, 0.3, 0.3),
            });
            currentY -= 15;
          }
        });
      } catch (parseError) {
        console.error('Error parsing medications:', parseError);
        page.drawText('1. Medication as prescribed', {
          x: 80,
          y: currentY,
          size: 12,
          font: timesBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 18;
      }
    } else {
      page.drawText('No medications prescribed', {
        x: 80,
        y: currentY,
        size: 12,
        font: timesRoman,
        color: rgb(0.4, 0.4, 0.4),
      });
      currentY -= 18;
    }
    
    currentY -= 30;
    
    // Investigations Section (left side)
    page.drawText('INVESTIGATIONS', {
      x: 50,
      y: currentY,
      size: 13,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 20;
    const investigations = data.request?.basic_investigations || 'CBC';
    const investigationLines = wrapText(investigations, 30);
    for (const line of investigationLines.slice(0, 3)) {
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 11,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 15;
    }
    
    // Digital Signature (bottom right)
    const signatureY = 120;
    page.drawText('Digital Signature:', {
      x: width - 200,
      y: signatureY + 20,
      size: 11,
      font: timesRoman,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    page.drawText(`Dr. ${data.doctor?.full_name || 'Doctor Name'}`, {
      x: width - 200,
      y: signatureY,
      size: 12,
      font: timesBold,
      color: rgb(0.2, 0.6, 0.2),
    });
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Helper function to wrap text
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}