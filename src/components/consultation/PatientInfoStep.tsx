import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { StickyFooterActions } from "@/components/common/StickyFooterActions";
import { User, Calendar, Users, Phone, FileCheck } from "lucide-react";
import { useConsultationStore, PatientData } from "@/store/consultationStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientInfoStepProps {
  onNext: () => void;
  onBack: () => void;
  onReset?: () => void;
}

export function PatientInfoStep({ onNext, onBack }: PatientInfoStepProps) {
  const [searchParams] = useSearchParams();
  const { patientData, setPatientData, selectedSymptoms, symptomNotes, diagnosis, resetConsultation } = useConsultationStore();
  const [formData, setFormData] = useState<PatientData>(patientData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isImported = searchParams.get('imported') === 'true';

  useEffect(() => {
    console.log('🔍 [PATIENT INFO] Setting patient data in store:', formData);
    setPatientData(formData);
  }, [formData, setPatientData]);

  const handleInputChange = (field: keyof PatientData, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    console.log('🔍 [PATIENT INFO] Updated patient data:', updatedData);
    console.log('🔍 [PATIENT INFO] Phone number:', updatedData.phone);
  };

  const handleSubmitImportedConsultation = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to submit consultation',
          variant: 'destructive'
        });
        return;
      }

      // Create prescription request with imported data
      const { data: prescriptionRequest, error } = await supabase
        .from('prescription_requests')
        .insert({
          customer_id: user.user.id,
          external_source: 'daigasst-health-ai',
          patient_name: formData.name,
          patient_age: formData.age,
          patient_gender: formData.gender,
          patient_phone: formData.phone,
          body_part: 'Imported Analysis',
          symptoms: selectedSymptoms.join(', ') + (symptomNotes ? `\n\nNotes: ${symptomNotes}` : ''),
          probable_diagnosis: diagnosis || 'Analysis imported from DAIGASST Health AI',
          short_summary: 'Consultation imported from DAIGASST Health AI system',
          prescription_required: true,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Consultation Submitted',
        description: 'Your consultation has been submitted to the doctor for review.',
      });

      // Reset consultation data and navigate to dashboard
      resetConsultation();
      window.location.href = '/customer-dashboard';

    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit consultation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name.trim() && formData.age.trim() && formData.gender && formData.phone.trim() &&
    (formData.gender !== 'female' || parseInt(formData.age) <= 18 || formData.isPregnant);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 space-y-6">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              {isImported ? <FileCheck className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-xl">
              {isImported ? 'Imported Patient Information' : 'Patient Information'}
            </CardTitle>
            {isImported && (
              <p className="text-sm text-muted-foreground">
                This data was imported from DAIGASST Health AI. Please review and submit to doctor.
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                <User className="inline h-4 w-4 mr-2" />
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter patient's full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-medium">
                <Calendar className="inline h-4 w-4 mr-2" />
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="h-12 text-base"
                min="0"
                max="120"
              />
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                <Users className="inline h-4 w-4 mr-2" />
                Gender
              </Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex flex-row gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" className="h-5 w-5" />
                  <Label htmlFor="male" className="text-base cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" className="h-5 w-5" />
                  <Label htmlFor="female" className="text-base cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">
                <Phone className="inline h-4 w-4 mr-2" />
                Mobile Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter mobile number (required for SMS notifications)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="h-12 text-base"
                required
              />
              <p className="text-sm text-muted-foreground">
                We'll send prescription updates to this number via SMS
              </p>
            </div>

            {/* Pregnancy Question - Only for females over 18 */}
            {formData.gender === 'female' && parseInt(formData.age) > 18 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Are you currently pregnant?
                </Label>
                <RadioGroup
                  value={formData.isPregnant || ''}
                  onValueChange={(value) => handleInputChange('isPregnant', value)}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pregnant-yes" className="h-5 w-5" />
                    <Label htmlFor="pregnant-yes" className="text-base cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pregnant-no" className="h-5 w-5" />
                    <Label htmlFor="pregnant-no" className="text-base cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isImported ? (
        <div className="p-4 space-y-4">
          <Button
            onClick={handleSubmitImportedConsultation}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base"
          >
            {isSubmitting ? 'Submitting...' : 'Submit to Doctor for Review'}
          </Button>
          <StickyFooterActions
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!isValid}
            nextLabel="Continue Editing"
            backLabel="Back"
          />
        </div>
      ) : (
        <StickyFooterActions
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!isValid}
          nextLabel="Continue to Body Areas"
        />
      )}
    </div>
  );
}