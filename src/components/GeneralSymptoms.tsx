import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loadImageFromStorage } from "@/lib/storageUtils";

interface GeneralSymptomsProps {
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
}

const GeneralSymptoms = ({ patientData }: GeneralSymptomsProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState("");
  const [symptomImages, setSymptomImages] = useState<{ [key: string]: string }>({});

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
          Select from common symptoms or describe your own symptoms in detail.
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

      <Card>
        <CardHeader>
          <CardTitle>Additional Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="custom-symptoms">
              Describe any other symptoms or provide more details
            </Label>
            <Textarea
              id="custom-symptoms"
              placeholder="Please describe your symptoms in detail, including when they started, severity, and any factors that make them better or worse..."
              value={customSymptoms}
              onChange={(e) => setCustomSymptoms(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected symptoms summary with images */}
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

              {/* Display images for selected symptoms */}
              {Object.keys(symptomImages).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Symptom Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSymptoms.map((symptom) => 
                      symptomImages[symptom] && (
                        <div key={`image-${symptom}`} className="space-y-2">
                          <h5 className="text-sm font-medium">{symptom}</h5>
                          <img
                            src={symptomImages[symptom]}
                            alt={`${symptom} visualization`}
                            className="w-full h-48 object-cover rounded-lg border"
                            onError={(e) => {
                              console.log(`Failed to load image for ${symptom}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
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

      {(selectedSymptoms.length > 0 || customSymptoms.trim()) && (
        <div className="text-center">
          <Button className="gradient-primary" size="lg">
            Continue with Symptom Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeneralSymptoms;