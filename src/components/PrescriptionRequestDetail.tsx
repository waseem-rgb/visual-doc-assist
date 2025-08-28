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
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionRequest {
  id: string;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  body_part: string;
  symptoms: string;
  probable_diagnosis: string;
  short_summary: string;
  basic_investigations: string;
  common_treatments: string;
  prescription_required: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  assigned_doctor_id: string | null;
}

interface PrescriptionRequestDetailProps {
  request: PrescriptionRequest;
  onBack: () => void;
  onUpdate: (updatedRequest: PrescriptionRequest) => void;
}

const PrescriptionRequestDetail = ({ request, onBack, onUpdate }: PrescriptionRequestDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [updatedInvestigations, setUpdatedInvestigations] = useState(request.basic_investigations || "");
  const [updatedTreatments, setUpdatedTreatments] = useState(request.common_treatments || "");
  const { toast } = useToast();

  const handleClaimCase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("prescription_requests")
        .update({
          status: 'in_progress',
          assigned_doctor_id: user?.id
        })
        .eq("id", request.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Case Claimed",
        description: "You have successfully claimed this case.",
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
          diagnosis: request.probable_diagnosis,
          medications,
          instructions,
          follow_up_notes: followUpNotes
        })
        .select()
        .single();

      if (prescError) throw prescError;

      // Update request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from("prescription_requests")
        .update({ 
          status: 'completed',
          basic_investigations: updatedInvestigations,
          common_treatments: updatedTreatments
        })
        .eq("id", request.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // TODO: Call edge function to generate PDF
      // This would invoke the PDF generation service
      
      toast({
        title: "Prescription Generated",
        description: "Prescription has been approved and generated successfully.",
      });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
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
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
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
              </CardContent>
            </Card>

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
                
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Patient
                </Button>
                
                {request.status === 'completed' && (
                  <Button variant="outline" className="w-full">
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
                    Probable Diagnosis (AI Generated)
                  </Label>
                  <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                    {request.probable_diagnosis || "No diagnosis available"}
                  </p>
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

                {!isReferral && request.status === 'in_progress' && (
                  <>
                    <div>
                      <Label htmlFor="medications">Prescription Medications</Label>
                      <Textarea
                        id="medications"
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        placeholder="List medications with dosage and frequency..."
                        className="mt-1"
                      />
                    </div>

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