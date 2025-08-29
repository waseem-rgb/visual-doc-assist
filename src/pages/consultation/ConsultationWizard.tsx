import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsultationStore } from '@/store/consultationStore';
import { MobileLayout } from '@/layouts/MobileLayout';
import { PatientInfoStep } from '@/components/consultation/PatientInfoStep';
import { BodyAreaStep } from '@/components/consultation/BodyAreaStep';
import { SymptomsStep } from '@/components/consultation/SymptomsStep';
import { ReviewStep } from '@/components/consultation/ReviewStep';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

const STEPS = [
  { id: 'patient', title: 'Patient Info', component: PatientInfoStep },
  { id: 'body', title: 'Body Area', component: BodyAreaStep },
  { id: 'symptoms', title: 'Symptoms', component: SymptomsStep },
  { id: 'review', title: 'Review', component: ReviewStep },
];

export function ConsultationWizard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentStep, setCurrentStep, resetConsultation } = useConsultationStore();

  // If not mobile, redirect to regular consultation page
  useEffect(() => {
    if (!isMobile) {
      navigate('/consultation', { replace: true });
    }
  }, [isMobile, navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleReset = () => {
    resetConsultation();
    navigate('/');
  };

  if (!isMobile) {
    return null; // Will redirect via useEffect
  }

  const CurrentStepComponent = STEPS[currentStep].component;
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <MobileLayout 
      title={`Step ${currentStep + 1}: ${STEPS[currentStep].title}`}
      showBackButton={true}
      hideBottomNav={true}
      className="pb-0"
    >
      {/* Progress Bar */}
      <div className="px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          onReset={handleReset}
        />
      </div>
    </MobileLayout>
  );
}