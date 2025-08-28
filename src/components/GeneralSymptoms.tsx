import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loadImageFromStorage } from "@/lib/storageUtils";
import { getSymptomContentForBodyPart } from "@/data/symptomContent";
import UniversalSymptomSelector from "./UniversalSymptomSelector";

interface GeneralSymptomsProps {
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
}

const GeneralSymptoms = ({ patientData }: GeneralSymptomsProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomImages, setSymptomImages] = useState<{ [key: string]: string }>({});
  const [currentSymptom, setCurrentSymptom] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const commonSymptoms = [
    "BEHAVIOUR PROBLEMS",
    "FEVER",
    "GENERAL PAIN", 
    "MOBILITY",
    "MOOD CHANGE",
    "NAUSEA AND VOMITING",
    "WEIGHT LOSS",
    "SEIZURES",
    "WEIGHT GAIN",
    "SKIN LUMPS AND BUMPS",
    "SKIN MOLES AND DISCOLOURATION",
    "SKIN RASHES",
    "DIZZINESS AND FAINTING",
    "FATIGUE"
  ];

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSymptomImageClick = (symptom: string) => {
    if (symptomImages[symptom]) {
      setCurrentSymptom(symptom);
      setShowSelector(true);
    }
  };

  const handleSymptomSubmit = (symptomData: { id: string, text: string }) => {
    console.log('Symptom selected:', symptomData);
    setShowSelector(false);
    // Here you would typically save the symptom selection or proceed to next step
  };

  const handleContinueAnalysis = () => {
    // For now, let's simulate proceeding to next step
    console.log('Continuing with selected symptoms:', selectedSymptoms);
    // You could navigate to a results page or show a diagnosis
  };

  // Load images for selected symptoms
  useEffect(() => {
    const loadSymptomImages = async () => {
      for (const symptom of selectedSymptoms) {
        if (!symptomImages[symptom]) {
          try {
            const { url } = await loadImageFromStorage(symptom, 'Symptom_Images');
            if (url) {
              setSymptomImages(prev => ({
                ...prev,
                [symptom]: url
              }));
            }
          } catch (error) {
            console.log(`No image found for symptom: ${symptom}`);
          }
        }
      }
    };

    if (selectedSymptoms.length > 0) {
      loadSymptomImages();
    }
  }, [selectedSymptoms, symptomImages]);

  // Get symptom content for this symptom to pass correct fallback data
  const symptomContentData = getSymptomContentForBodyPart(currentSymptom || "");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4">Describe Your Symptoms</h3>
        <p className="text-muted-foreground mb-6">
          Select from common symptoms below. Click on any image to pinpoint the exact location.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Common Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {commonSymptoms.map((symptom) => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={symptom}
                  checked={selectedSymptoms.includes(symptom)}
                  onCheckedChange={() => handleSymptomToggle(symptom)}
                />
                <Label
                  htmlFor={symptom}
                  className="text-sm cursor-pointer"
                >
                  {symptom}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected symptoms summary with clickable images */}
      {selectedSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20"
                    onClick={() => handleSymptomToggle(symptom)}
                  >
                    {symptom} ×
                  </span>
                ))}
              </div>

              {/* Display clickable images for selected symptoms */}
              {Object.keys(symptomImages).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Click on any image to pinpoint exact location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSymptoms.map((symptom) => 
                      symptomImages[symptom] && (
                        <div key={`image-${symptom}`} className="space-y-2">
                          <h5 className="text-sm font-medium">{symptom}</h5>
                          <div 
                            className="relative cursor-pointer group"
                            onClick={() => handleSymptomImageClick(symptom)}
                          >
                            <img
                              src={symptomImages[symptom]}
                              alt={`${symptom} visualization`}
                              className="w-full h-48 object-cover rounded-lg border transition-all group-hover:ring-2 group-hover:ring-primary group-hover:shadow-lg"
                              onError={(e) => {
                                console.log(`Failed to load image for ${symptom}`);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                                Click to select location
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Universal Symptom Selector */}
      {currentSymptom && symptomImages[currentSymptom] && (
      <UniversalSymptomSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        bodyPart={currentSymptom}
        gender={patientData.gender === 'Male' ? 'male' : 'female'}
        view="front"
        onSymptomsSelected={(symptoms) => {
          console.log('Symptoms selected:', symptoms);
          setShowSelector(false);
        }}
      />
      )}
    </div>
  );
};

export default GeneralSymptoms;