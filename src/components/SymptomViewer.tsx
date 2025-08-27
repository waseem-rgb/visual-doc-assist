import { useState, useEffect } from "react";
import InteractiveSymptomSelector from "./InteractiveSymptomSelector";

interface SymptomViewerProps {
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  onBack: () => void;
}

const SymptomViewer = ({ bodyPart, patientData, onBack }: SymptomViewerProps) => {
  // Simply render the new InteractiveSymptomSelector
  return (
    <InteractiveSymptomSelector 
      bodyPart={bodyPart}
      patientData={patientData}
      onBack={onBack}
    />
  );
};

export default SymptomViewer;