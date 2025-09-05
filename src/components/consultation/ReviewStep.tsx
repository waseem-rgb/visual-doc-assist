import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsultationStore } from '@/store/consultationStore';
import { StickyFooterActions } from '@/components/common/StickyFooterActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  User, 
  MapPin, 
  Activity, 
  FileText, 
  Loader2,
  Download 
} from 'lucide-react';

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function ReviewStep({ onBack, onReset }: ReviewStepProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    patientData,
    selectedBodyParts,
    selectedSymptoms,
    symptomNotes,
    resetConsultation
  } = useConsultationStore();

  const handleGeneratePrescription = async () => {
    setIsGenerating(true);
    
    try {
      // Determine prescription requirement by checking database for symptoms
      let prescriptionRequired = false;
      let isReferralCase = false;
      let referralSpecialist = '';
      
      // Rule 1: Children under 10 years -> Pediatrician
      const patientAge = parseInt(patientData.age);
      if (patientAge < 10) {
        isReferralCase = true;
        referralSpecialist = 'Pediatrician';
        console.log('🔍 [REVIEW STEP] Patient under 10, referring to Pediatrician');
      }
      
      // Rule 2: Pregnant females -> Gynecologist
      if (patientData.gender === 'female' && patientData.isPregnant === 'yes') {
        isReferralCase = true;
        referralSpecialist = 'Gynecologist';
        console.log('🔍 [REVIEW STEP] Pregnant female, referring to Gynecologist');
      }
      
      console.log('🔍 [REVIEW STEP] Checking prescription requirement for symptoms:', selectedSymptoms);
      
      // Check database for prescription requirements based on symptoms (only if not already a referral case)
      if (!isReferralCase) {
        const { data: masterData, error: masterError } = await supabase
          .from('New Master')
          .select('"prescription_Y-N"')
          .ilike('Symptoms', `%${selectedSymptoms[0]}%`) // Check first symptom
          .maybeSingle();

        if (!masterError && masterData) {
          const prescriptionYN = masterData['prescription_Y-N']?.toLowerCase() || '';
          console.log('🔍 [REVIEW STEP] prescription_Y-N value:', prescriptionYN);
          
          // Check for doctor review keywords
          const doctorReviewKeywords = ['doctors review and prescription', 'doctor review', 'prescription', 'y'];
          const requiresDoctorReview = doctorReviewKeywords.some(keyword => prescriptionYN.includes(keyword));
          
          // Check for referral indicators
          const referralIndicators = ['cardiologist', 'ent', 'dermatologist', 'specialist', 'emergency', 'hospital', 'department', 'referral'];
          const hasReferralIndicators = referralIndicators.some(indicator => prescriptionYN.includes(indicator));
          
          prescriptionRequired = requiresDoctorReview && !hasReferralIndicators;
          isReferralCase = hasReferralIndicators || prescriptionYN === 'n' || (!requiresDoctorReview && prescriptionYN !== '');
          
          console.log('🔍 [REVIEW STEP] Final decision - prescriptionRequired:', prescriptionRequired, 'isReferralCase:', isReferralCase);
        }
      }

      // Debug logging
      console.log('🔍 [DEBUG] Patient data in ReviewStep:', patientData);
      console.log('🔍 [DEBUG] Patient phone:', patientData.phone);

      // Create prescription request record with correct flags
      const requestData = {
        body_part: selectedBodyParts.join(', '),
        chief_complaint: selectedSymptoms.join(', '),
        patient_name: patientData.name,
        patient_age: patientData.age,
        patient_gender: patientData.gender,
        patient_phone: patientData.phone,
        status: prescriptionRequired ? 'pending' as const : 'completed' as const,
        symptoms: selectedSymptoms.join(', '),
        prescription_required: prescriptionRequired,
        clinical_history: referralSpecialist ? `Automatic referral to ${referralSpecialist}. ${symptomNotes || 'Mobile consultation'}` : (symptomNotes || 'Mobile consultation')
      };

      console.log('🔍 [DEBUG] Request data being inserted:', requestData);

      const { data: prescriptionRequest, error: requestError } = await supabase
        .from('prescription_requests')
        .insert([requestData])
        .select()
        .single();

      console.log('🔍 [DEBUG] Inserted prescription request:', prescriptionRequest);

      if (requestError) throw requestError;

      // Generate prescription/referral PDF
      const { data: pdfResult, error: pdfError } = await supabase.functions
        .invoke('generate-prescription-pdf-simple', {
          body: {
            requestId: prescriptionRequest.id,
            isReferral: isReferralCase
          }
        });

      if (pdfError) throw pdfError;

      // Send SMS notification for consultation review completion
      if (patientData.phone && prescriptionRequest) {
        try {
          console.log('📱 [REVIEW STEP] Sending SMS notification');
          const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-sms-notification', {
            body: {
              to: patientData.phone,
              type: prescriptionRequired ? 'prescription_requested' : 'referral_submitted',
              patientName: patientData.name,
              isReferral: isReferralCase,
              referralSpecialist: referralSpecialist || undefined
            }
          });

          if (smsError) {
            console.error('📱 [REVIEW STEP] SMS Error:', smsError);
            toast({
              title: "SMS Failed",
              description: "Consultation submitted but SMS notification failed",
              variant: "destructive"
            });
          } else {
            console.log('📱 [REVIEW STEP] SMS sent successfully:', smsResult);
            toast({
              title: "SMS Notification Sent",
              description: `${prescriptionRequired ? 'Prescription request' : 'Consultation result'} sent to ${patientData.phone}`,
            });
          }
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          toast({
            title: "SMS Failed",
            description: "Consultation submitted but SMS notification failed",
            variant: "destructive"
          });
        }
      }

      // Send SMS notification to doctor for prescription requests
      if (prescriptionRequired && prescriptionRequest) {
        try {
          console.log('📱 [REVIEW STEP] Sending doctor notification SMS');
          const { data: doctorSmsResult, error: doctorSmsError } = await supabase.functions.invoke('send-sms-notification', {
            body: {
              to: '7993448425',
              type: 'prescription_requested',
              message: `New prescription request from ${patientData.name} (${patientData.age}y, ${patientData.gender}). Symptoms: ${selectedSymptoms.join(', ')}. Body parts: ${selectedBodyParts.join(', ')}. Please review in the doctor portal.`,
              patientName: patientData.name
            }
          });

          if (doctorSmsError) {
            console.error('📱 [REVIEW STEP] Doctor SMS Error:', doctorSmsError);
          } else {
            console.log('📱 [REVIEW STEP] Doctor SMS sent successfully:', doctorSmsResult);
          }
        } catch (doctorSmsError) {
          console.error('Failed to send doctor SMS notification:', doctorSmsError);
        }
      }

      toast({
        title: referralSpecialist ? `Referred to ${referralSpecialist}` : 
               prescriptionRequired ? "Sent for Doctor Review" : "Referral Generated Successfully",
        description: referralSpecialist ? `Your consultation has been automatically referred to a ${referralSpecialist}.` :
                    prescriptionRequired 
                    ? "Your request has been sent to a doctor for review and prescription."
                    : "Your consultation has been processed and referral document is ready.",
      });

      // Reset consultation and navigate to dashboard
      resetConsultation();
      navigate('/customer/dashboard');
      
    } catch (error) {
      console.error('Error generating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to generate prescription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Review Consultation</CardTitle>
            <CardDescription>
              Please review the information before generating your prescription.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{patientData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span className="font-medium">{patientData.age} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium capitalize">{patientData.gender}</span>
            </div>
            {patientData.gender === 'female' && parseInt(patientData.age) > 18 && patientData.isPregnant && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pregnant:</span>
                <span className="font-medium capitalize">{patientData.isPregnant}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affected Areas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Affected Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedBodyParts.map((part, index) => (
                <Badge key={index} variant="secondary">
                  {part}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom, index) => (
                <Badge key={index} variant="outline">
                  {symptom}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {symptomNotes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {symptomNotes}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button
              onClick={handleGeneratePrescription}
              disabled={isGenerating}
              className="w-full h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Prescription...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Prescription
                </>
              )}
            </Button>
            
            <Button
              onClick={onReset}
              variant="outline"
              className="w-full h-12 text-base"
              disabled={isGenerating}
            >
              Start New Consultation
            </Button>
          </CardContent>
        </Card>
      </div>

      <StickyFooterActions
        onBack={onBack}
        backLabel="Edit Symptoms"
      />
    </div>
  );
}