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

    // Update prescription record with file path instead of signed URL
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ pdf_url: fileName })  // Store filename/path instead of signed URL
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
    
    // Use built-in fonts to avoid loading errors
    let helvetica, helveticaBold;
    try {
      helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    } catch (fontError) {
      console.log('Font loading failed');
      throw fontError;
    }
    
    const { width, height } = page.getSize();
    
    // Light blue background for the main content
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.95, 0.97, 1), // Light blue background
    });
    
    let currentY = height - 40;
    
    // Helper function to get salutation based on gender
    const getSalutation = (gender: string) => {
      const genderLower = gender?.toLowerCase();
      if (genderLower?.includes('male') && !genderLower?.includes('female')) {
        return 'Mr';
      } else if (genderLower?.includes('female')) {
        return 'Ms';
      }
      return 'Mr'; // default
    };

    // Logo area on right side (eRxlife branding in original colors)
    page.drawRectangle({
      x: width - 150,
      y: height - 100,
      width: 120,
      height: 60,
      color: rgb(1, 1, 1), // White background for logo
    });
    
    // eRxlife logo text in purple color
    page.drawText('eRxlife', {
      x: width - 120,
      y: height - 50,
      size: 18,
      font: helveticaBold,
      color: rgb(0.5, 0.4, 0.7), // Purple color for eRxlife
    });

    // Date and Place in top right
    const currentDate = new Date().toLocaleDateString();
    page.drawText(`Place: Bangalore`, {
      x: width - 150,
      y: height - 120,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Date: ${currentDate}`, {
      x: width - 150,
      y: height - 135,
      size: 10,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Doctor Information (using default values)
    page.drawText('Dr Mohammed waseem afsar', {
      x: 50,
      y: currentY,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 20;
    page.drawText('MBBS', {
      x: 50,
      y: currentY,
      size: 12,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 25;
    
    // Horizontal line separator
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 2,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 30;

    // Patient Information with salutation
    const patientGender = data.prescription?.patient_gender || data.request?.patient_gender || 'male';
    const salutation = getSalutation(patientGender);
    const patientName = data.prescription?.patient_name || data.request?.patient_name || 'Patient';
    
    page.drawText(`${salutation} ${patientName}`, {
      x: 50,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 20;
    const age = data.prescription?.patient_age || data.request?.patient_age || 'N/A';
    const gender = data.prescription?.patient_gender || data.request?.patient_gender || 'N/A';
    page.drawText(`${age} years, ${gender}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 30;

    // Symptoms Section
    page.drawText('Symptoms:', {
      x: 50,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 20;
    // Get complete symptoms from the request
    const symptoms = data.request?.selected_symptoms || data.request?.symptoms || 'Not specified';
    const bodyPart = data.request?.body_part || '';
    const combinedSymptoms = bodyPart ? `${bodyPart}: ${symptoms}` : symptoms;
    
    const symptomLines = wrapText(combinedSymptoms, 65);
    for (const line of symptomLines) {
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 12,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 15;
    }
    
    currentY -= 20;
    
    // H/O (History of chronic illness) Section
    if (data.request?.chronic_conditions || data.request?.medical_history) {
      page.drawText('H/O:', {
        x: 50,
        y: currentY,
        size: 14,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      currentY -= 20;
      const history = data.request?.chronic_conditions || data.request?.medical_history || 'None';
      const historyLines = wrapText(history, 65);
      for (const line of historyLines) {
        page.drawText(line, {
          x: 50,
          y: currentY,
          size: 12,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 15;
      }
      currentY -= 20;
    }

    // Diagnosis Section (centered)
    currentY -= 20;
    const diagnosis = data.prescription?.diagnosis || data.request?.probable_diagnosis || 'To be determined';
    
    // Center the diagnosis text
    const diagnosisWidth = diagnosis.length * 8; // Approximate width calculation
    const centerX = (width - diagnosisWidth) / 2;
    
    page.drawText(diagnosis, {
      x: Math.max(50, centerX),
      y: currentY,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    currentY -= 40;

    // Investigations Section
    if (data.request?.basic_investigations || data.prescription?.investigations) {
      page.drawText('Investigations:', {
        x: 50,
        y: currentY,
        size: 14,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      currentY -= 20;
      const investigations = data.request?.basic_investigations || data.prescription?.investigations || 'As required';
      const investigationLines = wrapText(investigations, 65);
      for (const line of investigationLines) {
        page.drawText(line, {
          x: 50,
          y: currentY,
          size: 12,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 15;
      }
      currentY -= 20;
    }

    // Rx Symbol above medications (centered)
    const rxSymbol = 'Rx';
    const rxWidth = rxSymbol.length * 20; // Approximate width for larger text
    const rxCenterX = (width - rxWidth) / 2;
    
    page.drawText(rxSymbol, {
      x: rxCenterX,
      y: currentY,
      size: 36,
      font: helveticaBold,
      color: rgb(0.5, 0.4, 0.7), // Purple color to match eRxlife branding
    });
    
    currentY -= 50;

    // Medications Section (middle aligned)
    if (data.prescription?.medications) {
      try {
        const medications = JSON.parse(data.prescription.medications);
        medications.forEach((med: any, index: number) => {
          const medName = med.name || med.medication_name || 'Medication';
          const medText = `${index + 1}. ${medName} - ${med.prescribed_dosage || med.dosage || ''} - ${med.frequency || 'Once daily'} for ${med.duration || '7 days'}`;
          
          // Center align medication text
          const medTextWidth = medText.length * 6; // Approximate width
          const medCenterX = Math.max(50, (width - medTextWidth) / 2);
          
          page.drawText(medText, {
            x: medCenterX,
            y: currentY,
            size: 12,
            font: helvetica,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 20;
          
          if (med.instructions) {
            const instText = `   Instructions: ${med.instructions}`;
            const instTextWidth = instText.length * 5;
            const instCenterX = Math.max(70, (width - instTextWidth) / 2);
            
            page.drawText(instText, {
              x: instCenterX,
              y: currentY,
              size: 10,
              font: helvetica,
              color: rgb(0.3, 0.3, 0.3),
            });
            currentY -= 15;
          }
          currentY -= 10;
        });
      } catch (e) {
        console.error('Error parsing medications:', e);
        const noMedText = 'No medications prescribed';
        const noMedWidth = noMedText.length * 8;
        const noMedCenterX = (width - noMedWidth) / 2;
        
        page.drawText(noMedText, {
          x: noMedCenterX,
          y: currentY,
          size: 12,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 30;
      }
    }

    // Add some space before signature
    currentY = Math.min(currentY - 40, 150);

    // Horizontal line above signature
    page.drawLine({
      start: { x: 50, y: currentY + 30 },
      end: { x: width - 50, y: currentY + 30 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Digital Signature (bottom right)
    page.drawText('Dr. Mohammed Waseem Afsar', {
      x: width - 250,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('Reg No: 14188', {
      x: width - 250,
      y: currentY - 20,
      size: 12,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('Dr Mohammed Waseem Afsar', {
      x: width - 250,
      y: currentY - 40,
      size: 12,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
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