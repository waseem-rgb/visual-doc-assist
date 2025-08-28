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
      .eq('request_id', requestId)
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

    // Generate professional PDF without template dependency
    console.log('Generating professional PDF for prescription:', prescription.id);

    // Generate professional PDF
    const pdfContent = await generateProfessionalPDF({ 
      prescription, 
      doctor, 
      request: prescription.prescription_requests 
    });
    
    // Upload PDF to storage
    const fileName = `prescription-${prescription.id}-${Date.now()}.pdf`;
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
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Error updating prescription with PDF URL:', updateError);
    }

    console.log(`Prescription PDF generated successfully for prescription ${prescription.id}`);
    
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

// Generate professional prescription PDF with medical styling
async function generateProfessionalPDF(data: any): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesBold);
    
    const { width, height } = page.getSize();
    
    // Medical green header (light medical green)
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.88, 0.95, 0.88), // Light medical green
    });
    
    // Off-white background for the rest
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height - 120,
      color: rgb(0.98, 0.98, 0.96), // Off-white
    });
    
    let currentY = height - 30;
    
    // Header - Clinic Name
    page.drawText('VrDoc - Medical Prescription', {
      x: 50,
      y: currentY,
      size: 24,
      font: timesBold,
      color: rgb(0.2, 0.5, 0.2), // Dark green
    });
    
    currentY -= 30;
    
    // Doctor Information
    page.drawText(`Dr. ${data.doctor?.full_name || 'Doctor Name'}`, {
      x: 50,
      y: currentY,
      size: 14,
      font: timesBold,
      color: rgb(0.2, 0.5, 0.2),
    });
    
    currentY -= 20;
    page.drawText(`Specialization: ${data.doctor?.specialization || 'General Medicine'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.5, 0.2),
    });
    
    currentY -= 15;
    page.drawText(`License: ${data.doctor?.license_number || 'N/A'}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.5, 0.2),
    });
    
    // Date (top right)
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: width - 150,
      y: height - 30,
      size: 12,
      font: timesRoman,
      color: rgb(0.2, 0.5, 0.2),
    });
    
    currentY -= 40; // Move to body section
    
    // Patient Information Section
    page.drawText('PATIENT INFORMATION', {
      x: 50,
      y: currentY,
      size: 14,
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
    
    currentY -= 20;
    page.drawText(`Age: ${data.prescription?.patient_age || 'N/A'}    Gender: ${data.prescription?.patient_gender || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 35;
    
    // Diagnosis Section
    page.drawText('DIAGNOSIS', {
      x: 50,
      y: currentY,
      size: 14,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    const diagnosis = data.prescription?.diagnosis || data.request?.probable_diagnosis || 'To be determined';
    const diagnosisLines = wrapText(diagnosis, 65);
    for (const line of diagnosisLines) {
      page.drawText(line, {
        x: 70,
        y: currentY,
        size: 12,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 15;
    }
    
    currentY -= 20;
    
    // Medications Section
    page.drawText('MEDICATIONS', {
      x: 50,
      y: currentY,
      size: 14,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    if (data.prescription?.medications) {
      try {
        const medications = JSON.parse(data.prescription.medications);
        medications.forEach((med: any, index: number) => {
          page.drawText(`${index + 1}. ${med.name || med.medication_name || 'Medication'}`, {
            x: 70,
            y: currentY,
            size: 12,
            font: timesBold,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 15;
          
          if (med.prescribed_dosage || med.dosage) {
            page.drawText(`   Dosage: ${med.prescribed_dosage || med.dosage}`, {
              x: 90,
              y: currentY,
              size: 11,
              font: timesRoman,
              color: rgb(0.1, 0.1, 0.1),
            });
            currentY -= 12;
          }
          
          if (med.frequency) {
            page.drawText(`   Frequency: ${med.frequency}`, {
              x: 90,
              y: currentY,
              size: 11,
              font: timesRoman,
              color: rgb(0.1, 0.1, 0.1),
            });
            currentY -= 12;
          }
          
          if (med.instructions) {
            const instLines = wrapText(`Instructions: ${med.instructions}`, 60);
            for (const line of instLines) {
              page.drawText(`   ${line}`, {
                x: 90,
                y: currentY,
                size: 11,
                font: timesRoman,
                color: rgb(0.1, 0.1, 0.1),
              });
              currentY -= 12;
            }
          }
          currentY -= 10;
        });
      } catch (e) {
        page.drawText('No medications prescribed', {
          x: 70,
          y: currentY,
          size: 12,
          font: timesRoman,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 20;
      }
    } else {
      page.drawText('No medications prescribed', {
        x: 70,
        y: currentY,
        size: 12,
        font: timesRoman,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 20;
    }
    
    currentY -= 20;
    
    // Instructions Section
    if (data.prescription?.instructions) {
      page.drawText('INSTRUCTIONS', {
        x: 50,
        y: currentY,
        size: 14,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      currentY -= 25;
      const instructionLines = wrapText(data.prescription.instructions, 65);
      for (const line of instructionLines) {
        page.drawText(line, {
          x: 70,
          y: currentY,
          size: 12,
          font: timesRoman,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 15;
      }
      currentY -= 20;
    }
    
    // Investigations Section
    if (data.request?.basic_investigations) {
      page.drawText('INVESTIGATIONS', {
        x: 50,
        y: currentY,
        size: 14,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      currentY -= 25;
      const investigationLines = wrapText(data.request.basic_investigations, 65);
      for (const line of investigationLines) {
        page.drawText(line, {
          x: 70,
          y: currentY,
          size: 12,
          font: timesRoman,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 15;
      }
      currentY -= 20;
    }
    
    // Follow-up Section
    if (data.prescription?.follow_up_notes) {
      page.drawText('FOLLOW-UP', {
        x: 50,
        y: currentY,
        size: 14,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      currentY -= 25;
      const followUpLines = wrapText(data.prescription.follow_up_notes, 65);
      for (const line of followUpLines) {
        page.drawText(line, {
          x: 70,
          y: currentY,
          size: 12,
          font: timesRoman,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 15;
      }
    }
    
    // Digital Signature
    page.drawText('Digital Signature:', {
      x: width - 200,
      y: 100,
      size: 12,
      font: timesBold,
      color: rgb(0.2, 0.5, 0.2),
    });
    
    page.drawText(`Dr. ${data.doctor?.full_name || 'Doctor Name'}`, {
      x: width - 200,
      y: 80,
      size: 14,
      font: timesBold,
      color: rgb(0.2, 0.5, 0.2),
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