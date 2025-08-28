import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loadImageFromStorage } from "@/lib/storageUtils";
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
    "Fever",
    "Headache", 
    "Fatigue",
    "Nausea",
    "Vomiting",
    "Diarrhea",
    "Constipation",
    "Dizziness",
    "Shortness of breath",
    "Chest pain",
    "Abdominal pain",
    "Joint pain",
    "Muscle aches",
    "Sleep problems",
    "Loss of appetite",
    "Weight loss",
    "Weight gain",
    "Anxiety",
    "Depression",
    "Skin rash"
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

      {selectedSymptoms.length > 0 && (
        <div className="text-center">
          <Button className="gradient-primary" size="lg">
            Continue with Symptom Analysis
          </Button>
        </div>
      )}

      {/* Universal Symptom Selector */}
      {currentSymptom && symptomImages[currentSymptom] && (
        <UniversalSymptomSelector
          open={showSelector}
          onClose={() => setShowSelector(false)}
          imageUrl={symptomImages[currentSymptom]}
          bodyPart={currentSymptom}
          patientData={patientData}
          symptoms={[
            { id: "1", text: "Mild discomfort" },
            { id: "2", text: "Moderate pain" },
            { id: "3", text: "Severe pain" },
            { id: "4", text: "Burning sensation" },
            { id: "5", text: "Throbbing" },
            { id: "6", text: "Sharp pain" },
            { id: "7", text: "Dull ache" },
            { id: "8", text: "Tingling" },
            { id: "9", text: "Numbness" },
            { id: "10", text: "Swelling" }
          ]}
          onSymptomSubmit={handleSymptomSubmit}
        />
      )}
    </div>
  );
};

export default GeneralSymptoms;