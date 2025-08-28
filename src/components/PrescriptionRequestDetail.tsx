import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin,
  Stethoscope,
  FileText,
  Phone,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react';

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
  assigned_doctor_id: string | null;
  created_at: string;
}

interface PrescriptionRequestDetailProps {
  request: PrescriptionRequest;
  onBack: () => void;
}

const PrescriptionRequestDetail: React.FC<PrescriptionRequestDetailProps> = ({
  request,
  onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [editableInvestigations, setEditableInvestigations] = useState(request.basic_investigations || '');
  const [editableTreatments, setEditableTreatments] = useState(request.common_treatments || '');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  
  const { toast } = useToast();

  const handleClaimCase = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('prescription_requests')
        .update({
          status: 'in_progress',
          assigned_doctor_id: session.user.id
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'Case Claimed',
        description: 'You have successfully claimed this case.',
      });
      onBack();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrescription = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create prescription record
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          request_id: request.id,
          doctor_id: session.user.id,
          patient_name: request.patient_name,
          patient_age: request.patient_age,
          patient_gender: request.patient_gender,
          diagnosis: request.probable_diagnosis,
          medications,
          instructions,
          follow_up_notes: followUpNotes
        });

      if (prescriptionError) throw prescriptionError;

      // Update request status to completed
      const { error: updateError } = await supabase
        .from('prescription_requests')
        .update({
          status: 'completed',
          basic_investigations: editableInvestigations,
          common_treatments: editableTreatments
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast({
        title: 'Prescription Generated',
        description: 'Prescription has been created and case marked as completed.',
      });
      onBack();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = () => {
    toast({
      title: 'Call Feature',
      description: 'Integration with calling system would be implemented here.',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const isReferralCase = !request.prescription_required;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {isReferralCase ? 'Referral Case' : 'Prescription Case'} - {request.patient_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created on {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(request.status)}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-base font-semibold">{request.patient_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-base">{request.patient_age}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-base">{request.patient_gender}</p>
                  </div>
                  <div className="col-span-full">
                    <Label className="text-sm font-medium text-muted-foreground">Affected Body Part</Label>
                    <p className="text-base">{request.body_part}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Clinical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Symptoms</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{request.symptoms || 'No symptoms recorded'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Probable Diagnosis</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{request.probable_diagnosis || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Clinical Summary</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{request.short_summary || 'No summary available'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Investigations and Treatments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  {isReferralCase ? 'Referral Details' : 'Treatment Plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="investigations">
                    {isReferralCase ? 'Recommended Investigations' : 'Basic Investigations'}
                  </Label>
                  <Textarea
                    id="investigations"
                    value={editableInvestigations}
                    onChange={(e) => setEditableInvestigations(e.target.value)}
                    placeholder={`Enter ${isReferralCase ? 'recommended investigations' : 'basic investigations'}...`}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="treatments">
                    {isReferralCase ? 'Referral Notes' : 'Common Treatments'}
                  </Label>
                  <Textarea
                    id="treatments"
                    value={editableTreatments}
                    onChange={(e) => setEditableTreatments(e.target.value)}
                    placeholder={`Enter ${isReferralCase ? 'referral notes and specialist recommendations' : 'common treatments'}...`}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {!isReferralCase && (
                  <>
                    <div>
                      <Label htmlFor="medications">Medications & Dosage</Label>
                      <Textarea
                        id="medications"
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        placeholder="Enter prescribed medications with dosage..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Patient Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Enter instructions for the patient..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="followUp">Follow-up Notes</Label>
                      <Textarea
                        id="followUp"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Enter follow-up recommendations..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Manage this {isReferralCase ? 'referral' : 'prescription'} case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.status === 'pending' && (
                  <Button 
                    className="w-full" 
                    onClick={handleClaimCase}
                    disabled={loading}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Claim Case
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCallPatient}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Patient
                </Button>

                {(request.status === 'in_progress' || request.status === 'pending') && (
                  <Button 
                    className="w-full" 
                    onClick={handleGeneratePrescription}
                    disabled={loading || (!isReferralCase && (!medications.trim() || !instructions.trim()))}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isReferralCase ? 'Complete Referral' : 'Generate Prescription'}
                  </Button>
                )}

                {request.status === 'completed' && (
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download {isReferralCase ? 'Referral' : 'Prescription'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Case Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Case Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {request.status === 'in_progress' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Case Claimed</p>
                        <p className="text-xs text-muted-foreground">In progress</p>
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'completed' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Case Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {isReferralCase ? 'Referral' : 'Prescription'} generated
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionRequestDetail;