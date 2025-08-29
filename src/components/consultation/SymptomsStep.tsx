import { useState } from 'react';
import { useConsultationStore } from '@/store/consultationStore';
import { StickyFooterActions } from '@/components/common/StickyFooterActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MobileSymptomSelector } from '@/components/symptoms/MobileSymptomSelector';
import { Activity, CheckCircle, FileText } from 'lucide-react';

interface SymptomsStepProps {
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function SymptomsStep({ onNext, onBack }: SymptomsStepProps) {
  const { 
    selectedBodyParts,
    selectedSymptoms, 
    setSelectedSymptoms,
    symptomNotes,
    setSymptomNotes,
    patientData
  } = useConsultationStore();

  const [showSelector, setShowSelector] = useState(false);

  const handleSymptomSelection = (symptoms: string[]) => {
    setSelectedSymptoms(symptoms);
    setShowSelector(false);
  };

  const isValid = selectedSymptoms.length > 0;
  const bodyPart = selectedBodyParts[0] || 'general';

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Describe Symptoms</CardTitle>
            <CardDescription>
              Select the symptoms {patientData.name} is experiencing in the selected body areas.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Selected Symptoms</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Symptom Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <MobileSymptomSelector
              bodyPart={bodyPart}
              patientData={patientData}
              selectedSymptoms={selectedSymptoms}
              onSymptomsSelected={handleSymptomSelection}
            />
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                <FileText className="inline h-4 w-4 mr-2" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Describe any additional symptoms, duration, severity, or other relevant details..."
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <StickyFooterActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid}
        nextLabel="Review & Generate"
      >
        {selectedSymptoms.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </StickyFooterActions>
    </div>
  );
}