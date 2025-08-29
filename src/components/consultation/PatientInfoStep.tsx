import { useState, useEffect } from 'react';
import { useConsultationStore, PatientData } from '@/store/consultationStore';
import { StickyFooterActions } from '@/components/common/StickyFooterActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Calendar, Users } from 'lucide-react';

interface PatientInfoStepProps {
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function PatientInfoStep({ onNext, onBack }: PatientInfoStepProps) {
  const { patientData, setPatientData } = useConsultationStore();
  const [formData, setFormData] = useState<PatientData>(patientData);

  useEffect(() => {
    setPatientData(formData);
  }, [formData, setPatientData]);

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name.trim() && formData.age.trim() && formData.gender;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 space-y-6">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Patient Information</CardTitle>
            <CardDescription>
              Let's start by collecting some basic information about the patient.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                <User className="inline h-4 w-4 mr-2" />
                Patient Name
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
          </CardContent>
        </Card>
      </div>

      <StickyFooterActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid}
        nextLabel="Select Body Area"
      />
    </div>
  );
}