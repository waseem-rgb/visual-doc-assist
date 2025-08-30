import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { loadImageFromStorage } from "@/lib/storageUtils";
import { getSymptomContentForBodyPart } from "@/data/symptomContent";
import UniversalSymptomSelector from "./UniversalSymptomSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GeneralSymptomsProps {
  patientData: {
    name: string;
    age: string;
    gender: string;
    phone?: string;
  };
}

const GeneralSymptoms = ({ patientData }: GeneralSymptomsProps) => {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomImages, setSymptomImages] = useState<{ [key: string]: string }>({});
  const [currentSymptom, setCurrentSymptom] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showClinicalForm, setShowClinicalForm] = useState(false);
  const [prescriptionSubmitted, setPrescriptionSubmitted] = useState(false);
  
  // Clinical form state
  const [clinicalData, setClinicalData] = useState({
    duration: '',
    severity: '',
    previousTreatment: '',
    allergies: '',
    currentMedications: '',
    additionalInfo: ''
  });

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
    if (symptomImages[symptom] && !prescriptionSubmitted) {
      setCurrentSymptom(symptom);
      setShowSelector(true);
    }
  };

  const handleSymptomSubmit = (symptomData: { id: string, text: string }) => {
    console.log('Symptom selected:', symptomData);
    setShowSelector(false);
    // Here you would typically save the symptom selection or proceed to next step
  };

  const handleRequestPrescription = () => {
    setShowClinicalForm(true);
  };

  const handleClinicalSubmit = async () => {
    try {
      // Determine if prescription is required based on age and gender
      const age = parseInt(patientData.age);
      const prescriptionRequired = age >= 18 && patientData.gender === 'female';

      // Create prescription request
      const { data: prescriptionRequest, error: requestError } = await supabase
        .from('prescription_requests')
        .insert({
          patient_name: patientData.name,
          patient_age: patientData.age,
          patient_gender: patientData.gender,
          patient_phone: patientData.phone || '',
          symptoms: selectedSymptoms.join(', '),
          body_part: 'general',
          clinical_history: `Duration: ${clinicalData.duration}\nSeverity: ${clinicalData.severity}\nPrevious Treatment: ${clinicalData.previousTreatment}\nAllergies: ${clinicalData.allergies}`,
          medication_history: clinicalData.currentMedications,
          chief_complaint: clinicalData.additionalInfo,
          status: prescriptionRequired ? 'pending' : 'completed',
          prescription_required: prescriptionRequired
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // If no prescription needed, auto-generate referral
      if (!prescriptionRequired) {
        const { error: pdfError } = await supabase.functions.invoke('generate-prescription-pdf-simple', {
          body: {
            requestId: prescriptionRequest.id,
            patientName: patientData.name,
            symptoms: selectedSymptoms.join(', '),
            isReferral: true
          }
        });
        
        if (pdfError) {
          console.error('Error generating referral PDF:', pdfError);
        }
      }

      setShowClinicalForm(false);
      setPrescriptionSubmitted(true);
      
      toast.success(
        prescriptionRequired 
          ? "Prescription request submitted! A doctor will review it within 15 minutes."
          : "Referral generated successfully! Check your dashboard for the document."
      );

      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error submitting prescription request:', error);
      toast.error('Failed to submit prescription request. Please try again.');
    }
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
                            className={`relative group ${prescriptionSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                            onClick={() => !prescriptionSubmitted && handleSymptomImageClick(symptom)}
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

      {/* Request Prescription Button */}
      {selectedSymptoms.length > 0 && !prescriptionSubmitted && (
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-4">Ready to Get Your Prescription?</h3>
            <p className="text-muted-foreground mb-6">
              Based on your selected symptoms, our medical team can provide you with a prescription or referral.
            </p>
            <Button 
              onClick={handleRequestPrescription}
              size="lg"
              className="w-full max-w-sm bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
            >
              Request Prescription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Prescription Status */}
      {prescriptionSubmitted && (
        <Card className="p-6">
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-600">Request Submitted</h3>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                Your request has been submitted successfully. 
                Our medical team is reviewing your case and will process it within 15 minutes.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You will be redirected to your dashboard shortly to track the status.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical History Form Modal */}
      {showClinicalForm && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 overflow-y-auto"
          style={{ 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClinicalForm(false);
            }
          }}
        >
          <div className="w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <Card className="w-full shadow-2xl border-2 bg-background">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Clinical History</CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  Please provide the following information to complete your prescription request
                </p>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">

                {/* Duration of Symptoms */}
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duration of Symptoms <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 3 days, 1 week, 2 months"
                    value={clinicalData.duration}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>

                {/* Severity */}
                <div className="space-y-3">
                  <Label>Severity <span className="text-muted-foreground">(Optional)</span></Label>
                  <RadioGroup
                    value={clinicalData.severity}
                    onValueChange={(value) => setClinicalData(prev => ({ ...prev, severity: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mild" id="mild" />
                      <Label htmlFor="mild">Mild</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate">Moderate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="severe" id="severe" />
                      <Label htmlFor="severe">Severe</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Previous Treatment */}
                <div className="space-y-2">
                  <Label htmlFor="previousTreatment">
                    Previous Treatments <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="previousTreatment"
                    placeholder="Describe any previous treatments or medications taken for this condition"
                    value={clinicalData.previousTreatment}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, previousTreatment: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Allergies */}
                <div className="space-y-2">
                  <Label htmlFor="allergies">
                    Known Allergies <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies to medications, foods, or substances"
                    value={clinicalData.allergies}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, allergies: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Current Medications */}
                <div className="space-y-2">
                  <Label htmlFor="currentMedications">
                    Current Medications <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="currentMedications"
                    placeholder="List any medications you are currently taking"
                    value={clinicalData.currentMedications}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, currentMedications: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">
                    Additional Information <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any other relevant information about your condition"
                    value={clinicalData.additionalInfo}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
              
              <div className="p-6 pt-0">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowClinicalForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleClinicalSubmit}
                    className="flex-1"
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </Card>
          </div>
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
          symptoms={symptomContentData?.fallbackSymptoms || []}
          onSymptomSubmit={handleSymptomSubmit}
        />
      )}
    </div>
  );
};

export default GeneralSymptoms;