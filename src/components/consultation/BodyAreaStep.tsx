import { useState } from 'react';
import { useConsultationStore } from '@/store/consultationStore';
import { StickyFooterActions } from '@/components/common/StickyFooterActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BodyMap from '@/components/BodyMap';
import { Target, CheckCircle } from 'lucide-react';

interface BodyAreaStepProps {
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function BodyAreaStep({ onNext, onBack }: BodyAreaStepProps) {
  const { 
    patientData, 
    selectedBodyParts, 
    setSelectedBodyParts,
    currentView,
    setCurrentView,
    selectionStep,
    setSelectionStep
  } = useConsultationStore();

  const [showBodyMap, setShowBodyMap] = useState(true);

  const handleBodyPartSelection = (parts: string[]) => {
    setSelectedBodyParts(parts);
  };

  const isValid = selectedBodyParts.length > 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Select Affected Areas</CardTitle>
            <CardDescription>
              Touch the areas on the body diagram where {patientData.name} is experiencing symptoms.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Selected Body Parts */}
        {selectedBodyParts.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Selected Areas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBodyParts.map((part) => (
                  <Badge key={part} variant="default" className="text-xs">
                    {part}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Body Map */}
        {showBodyMap && (
          <Card className="flex-1">
            <CardContent className="p-2">
              <BodyMap
                gender={patientData.gender as 'male' | 'female'}
                patientData={patientData}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <StickyFooterActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid}
        nextLabel="Select Symptoms"
      >
        {selectedBodyParts.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectedBodyParts.length} area{selectedBodyParts.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </StickyFooterActions>
    </div>
  );
}