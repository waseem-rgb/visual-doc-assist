import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Stethoscope,
  Phone,
  CheckCircle,
  Download,
  AlertCircle,
  Send,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MedicationSelector from "./MedicationSelector";

interface PrescriptionRequest {
  id: string;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  body_part: string;
  symptoms: string;
  probable_diagnosis: string;
  database_diagnosis?: string;
  ai_diagnosis?: string;
  selected_diagnosis_type?: string;
  short_summary: string;
  basic_investigations: string;
  common_treatments: string;
  prescription_required: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  assigned_doctor_id: string | null;
  is_referral?: boolean;
  referral_type?: string | null;
  patient_phone?: string;
  clinical_history?: string;
  chief_complaint?: string;
  physical_examination?: string;
  medication_history?: string;
  analysis_pdf_url?: string;
  test_report_pdf_url?: string;
  external_source?: string;
}

interface PrescriptionRequestDetailProps {
  request: PrescriptionRequest;
  onBack: () => void;
  onUpdate: (updatedRequest: PrescriptionRequest) => void;
}

const PrescriptionRequestDetail = ({ request, onBack, onUpdate }: PrescriptionRequestDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [sendingToGramaSathi, setSendingToGramaSathi] = useState(false);
  const [prescribedMedications, setPrescribedMedications] = useState<any[]>([]);
  const [instructions, setInstructions] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [updatedInvestigations, setUpdatedInvestigations] = useState(request.basic_investigations || "");
  const [updatedTreatments, setUpdatedTreatments] = useState(request.common_treatments || "");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<'database' | 'ai'>(() => {
    // Default to whichever diagnosis is available, prioritizing database
    if (request.database_diagnosis) return 'database';
    if (request.ai_diagnosis) return 'ai';
    return 'database';
  });
  const { toast } = useToast();

  const handleClaimCase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to claim a case");
      }
      
      const { data, error } = await supabase
        .from("prescription_requests")
        .update({
          status: 'in_progress',
          assigned_doctor_id: user.id
        })
        .eq("id", request.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Case not found or could not be updated");
      }

      // Send SMS notification to patient
      console.log('📱 SMS Debug - patient_phone:', request.patient_phone);
      
      if (request.patient_phone) {
        try {
          const { data: doctorProfile } = await supabase
            .from('doctor_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          console.log('📱 Sending SMS notification for case claimed...');
          const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-sms-notification', {
            body: {
              to: request.patient_phone,
              type: 'case_claimed',
              patientName: request.patient_name,
              doctorName: doctorProfile?.full_name || 'Dr. ' + user.email?.split('@')[0]
            }
          });

          if (smsError) {
            console.error('SMS Error:', smsError);
            throw smsError;
          }

          console.log('📱 SMS sent successfully:', smsResult);
          toast({
            title: "SMS Sent",
            description: `Patient notified at ${request.patient_phone}`,
          });
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          toast({
            title: "SMS Failed", 
            description: "Could not send notification to patient",
            variant: "destructive"
          });
        }
      } else {
        console.log('📱 No phone number available for SMS');
        toast({
          title: "No Phone Number",
          description: "Patient phone number not available for SMS notification",
          variant: "destructive"
        });
      }

      toast({
        title: "Case Claimed",
        description: "You have successfully claimed this case. Patient has been notified.",
      });

      onUpdate(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrescription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('download-prescription', {
        body: {
          requestId: request.id
        }
      });

      if (error) {
        console.error('Download error:', error);
        
        // If PDF not generated yet, try to generate it now
        if (error.message?.includes('PDF not yet generated') || error.message?.includes('not found')) {
          toast({
            title: "Generating PDF",
            description: "PDF is being generated. Please wait a moment and try again.",
          });
          
          // Trigger PDF generation
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setTimeout(async () => {
              try {
                await supabase.functions.invoke('generate-prescription-pdf-simple', {
                  body: {
                    requestId: request.id,
                    doctorId: user.id
                  }
                });
              } catch (genError) {
                console.error('PDF generation error:', genError);
              }
            }, 100);
          }
        } else {
          toast({
            title: "Download Error",
            description: "Failed to download prescription. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName || `prescription-${request.patient_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your prescription is being downloaded.",
        });
      } else {
        toast({
          title: "Download Error",
          description: "Prescription file not found or not ready yet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create prescription record
      const { data: prescriptionData, error: prescError } = await supabase
        .from("prescriptions")
        .insert({
          request_id: request.id,
          doctor_id: user?.id,
          patient_name: request.patient_name,
          patient_age: request.patient_age,
          patient_gender: request.patient_gender,
          diagnosis: selectedDiagnosis === 'ai' ? request.ai_diagnosis : request.database_diagnosis || request.probable_diagnosis,
          medications: JSON.stringify(prescribedMedications),
          instructions,
          follow_up_notes: followUpNotes,
          selected_diagnosis_type: selectedDiagnosis
        })
        .select()
        .single();

      if (prescError) throw prescError;

      // Update request status to completed immediately
      const { data: updatedRequest, error: updateError } = await supabase
        .from("prescription_requests")
        .update({ 
          status: 'completed',
          basic_investigations: updatedInvestigations,
          common_treatments: updatedTreatments,
          selected_diagnosis_type: selectedDiagnosis
        })
        .eq("id", request.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Show immediate success feedback
      toast({
        title: "Prescription Approved",
        description: "Prescription has been approved successfully. PDF will be generated shortly.",
      });

      // Start PDF generation in background (non-blocking)
      setTimeout(async () => {
        try {
          console.log('Starting immediate PDF generation for request:', request.id);
          await supabase.functions.invoke('generate-prescription-pdf-simple', {
            body: {
              requestId: request.id,
              doctorId: user?.id
            }
          });
          console.log('PDF generation completed successfully');
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError);
        }
      }, 100); // Start after 100ms to ensure UI updates first

      // Note: SMS notification to patient will be sent by the PDF generation function with download link

      onUpdate(updatedRequest);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToGramaSathi = async () => {
    setSendingToGramaSathi(true);
    try {
      const consultationData = {
        id: request.id,
        patient_name: request.patient_name,
        patient_age: request.patient_age,
        patient_gender: request.patient_gender,
        patient_phone: request.patient_phone,
        symptoms: request.symptoms,
        probable_diagnosis: selectedDiagnosis === 'ai' ? request.ai_diagnosis : request.database_diagnosis || request.probable_diagnosis,
        common_treatments: updatedTreatments,
        created_at: request.created_at,
        severity: 'moderate' // Default severity
      };

      const { data, error } = await supabase.functions.invoke('send-to-gramasathi', {
        body: { consultationData }
      });

      if (error) throw error;

      toast({
        title: "Sent to Grama-Sathi",
        description: "Consultation data has been successfully sent to Grama-Sathi project.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send consultation to Grama-Sathi.",
        variant: "destructive",
      });
    } finally {
      setSendingToGramaSathi(false);
    }
  };

  const handleCopyPhoneNumber = async (phoneNumber: string) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast({
        title: "Phone Number Copied",
        description: "Patient's phone number has been copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy phone number:', error);
      toast({
        title: "Copy Failed",
        description: "Could not copy phone number to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-primary';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isReferral = !request.prescription_required;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Badge className={getStatusColor(request.status)}>
            {request.status.replace('_', ' ')}
          </Badge>
          {isReferral && (
            <Badge variant="outline" className="bg-accent text-primary border-primary/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              Referral Required
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{request.patient_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{request.patient_age} years</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium">{request.patient_gender}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Body Part</p>
                  <p className="font-medium">{request.body_part}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                {request.external_source === 'daigasst-health-ai' && (
                  <div>
                    <p className="text-muted-foreground">Source</p>
                    <p className="font-medium text-primary">DAIGASST Health AI</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DAIGASST Reports */}
            {request.external_source === 'daigasst-health-ai' && (request.analysis_pdf_url || request.test_report_pdf_url) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    DAIGASST Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.analysis_pdf_url && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(request.analysis_pdf_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Analysis Report
                    </Button>
                  )}
                  {request.test_report_pdf_url && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(request.test_report_pdf_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Test Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.status === 'pending' && (
                  <Button 
                    className="w-full" 
                    onClick={handleClaimCase}
                    disabled={loading}
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Claim Case
                  </Button>
                )}
                
                {request.patient_phone ? (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Patient Contact</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono font-medium">{request.patient_phone}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPhoneNumber(request.patient_phone!)}
                          className="p-1 h-auto"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`tel:${request.patient_phone}`, '_self')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call {request.patient_phone}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    <Phone className="h-4 w-4 mr-2" />
                    No Phone Number Available
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSendToGramaSathi}
                  disabled={sendingToGramaSathi}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingToGramaSathi ? 'Sending...' : 'Send to Grama-Sathi'}
                </Button>
                
                {request.status === 'completed' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleDownloadPrescription}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Prescription
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medical Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clinical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Clinical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Patient Reported Symptoms
                  </Label>
                  <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                    {request.symptoms || "No symptoms reported"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    MEDICATION HISTORY - ANY MEDICATION CUSTOMER IS CURRENTLY TAKING
                  </Label>
                  <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                    {request.medication_history || "No current medications reported"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                    Probable Diagnosis Options
                  </Label>
                  <div className="space-y-4">
                    {/* Database Diagnosis */}
                    {request.database_diagnosis && (
                      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border">
                        <input
                          type="checkbox"
                          id="database-diagnosis"
                          checked={selectedDiagnosis === 'database'}
                          onChange={() => setSelectedDiagnosis('database')}
                          disabled={request.status === 'completed'}
                          className="mt-1 h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <Label htmlFor="database-diagnosis" className="text-sm font-medium text-green-700 block mb-1">
                            Database Diagnosis
                          </Label>
                          <p className="text-sm text-gray-700">
                            {request.database_diagnosis}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Diagnosis */}
                    {request.ai_diagnosis && (
                      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border">
                        <input
                          type="checkbox"
                          id="ai-diagnosis"
                          checked={selectedDiagnosis === 'ai'}
                          onChange={() => setSelectedDiagnosis('ai')}
                          disabled={request.status === 'completed'}
                          className="mt-1 h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <Label htmlFor="ai-diagnosis" className="text-sm font-medium text-primary block mb-1">
                            AI Generated Diagnosis
                          </Label>
                          <p className="text-sm text-gray-700">
                            {request.ai_diagnosis}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fallback if no new diagnoses available */}
                    {(!request.database_diagnosis && !request.ai_diagnosis) && (
                      <div className="p-3 bg-muted/30 rounded-md border">
                        <Label className="text-sm font-semibold text-muted-foreground block mb-1">
                          Probable Diagnosis (Legacy)
                        </Label>
                        <p className="text-sm text-gray-700">
                          {request.probable_diagnosis || "No diagnosis available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Summary
                  </Label>
                  <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                    {request.short_summary || "No summary available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isReferral ? "Referral Information" : "Treatment Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="investigations">
                    {isReferral ? "Recommended Specialist" : "Basic Investigations"}
                  </Label>
                  <Textarea
                    id="investigations"
                    value={updatedInvestigations}
                    onChange={(e) => setUpdatedInvestigations(e.target.value)}
                    placeholder={
                      isReferral 
                        ? "Specialist type and reason for referral..."
                        : "Blood tests, imaging, etc..."
                    }
                    className="mt-1"
                    disabled={request.status === 'completed'}
                  />
                </div>

                <div>
                  <Label htmlFor="treatments">
                    {isReferral ? "Interim Care Instructions" : "Recommended Treatments"}
                  </Label>
                  <Textarea
                    id="treatments"
                    value={updatedTreatments}
                    onChange={(e) => setUpdatedTreatments(e.target.value)}
                    placeholder={
                      isReferral
                        ? "Care instructions until specialist visit..."
                        : "Medications, therapy, lifestyle changes..."
                    }
                    className="mt-1"
                    disabled={request.status === 'completed'}
                  />
                </div>

                {!isReferral && (
                  <>
                    <div>
                      <Label>Prescription Medications</Label>
                      <div className="mt-2">
                        <MedicationSelector
                          onMedicationsChange={setPrescribedMedications}
                          disabled={request.status === 'completed'}
                          diagnosis={selectedDiagnosis === 'ai' ? request.ai_diagnosis : request.database_diagnosis || request.probable_diagnosis}
                          patientAge={request.patient_age}
                          patientGender={request.patient_gender}
                        />
                      </div>
                    </div>

                    {request.status === 'in_progress' && (
                      <>
                        <div>
                          <Label htmlFor="instructions">Patient Instructions</Label>
                          <Textarea
                            id="instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Special instructions for the patient..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="followUp">Follow-up Notes</Label>
                          <Textarea
                            id="followUp"
                            value={followUpNotes}
                            onChange={(e) => setFollowUpNotes(e.target.value)}
                            placeholder="When to return, warning signs to watch for..."
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {request.status === 'in_progress' && (
                  <Button 
                    onClick={handleApproveAndGenerate}
                    disabled={loading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isReferral ? "Generate Referral Letter" : "Approve & Generate Prescription"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionRequestDetail;