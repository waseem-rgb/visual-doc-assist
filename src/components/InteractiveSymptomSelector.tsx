import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { loadImageFromStorage } from "@/lib/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import FullscreenSymptomLightbox from "./FullscreenSymptomLightbox";

interface InteractiveSymptomSelectorProps {
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  onBack: () => void;
}

interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  symptomText: string;
}

const InteractiveSymptomSelector = ({ bodyPart, patientData, onBack }: InteractiveSymptomSelectorProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [finalSelection, setFinalSelection] = useState<{id: string, text: string} | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  // Define text areas based on the ear anatomy image analysis
  const textAreas: TextArea[] = [
    { id: "hearing-loss-gradual", x: 50, y: 280, width: 200, height: 80, 
      symptomText: "Gradually increasing hearing loss affecting both ears. Develops with advancing age. Higher notes affected initially, then lower notes. Background noise makes it harder to hear conversation." },
    { id: "blocked-ear", x: 230, y: 290, width: 180, height: 60, 
      symptomText: "Blocked ear with possible mild discomfort and a reduction in hearing." },
    { id: "reduced-hearing", x: 50, y: 380, width: 200, height: 60, 
      symptomText: "Reduced hearing (such as needing the volume high on the television); speech that is quieter than normal. May have had a recent cold. More common in children." },
    { id: "hearing-loss-unequal", x: 230, y: 340, width: 180, height: 80, 
      symptomText: "Increasing level of hearing loss affecting both ears; may be unequal. Hearing may be improved when there is a noisy background. Tinnitus (noises in ears) and vertigo (dizziness) may be present." },
    { id: "vertigo-dizziness", x: 50, y: 450, width: 200, height: 80, 
      symptomText: "Vertigo (dizziness), worsened by change of head position; tinnitus (noises in ears); hearing loss. Fever, and feeling of fullness or pressure in the ear may also be present." },
    { id: "one-sided-hearing-loss", x: 230, y: 430, width: 180, height: 80, 
      symptomText: "One-sided, slowly developing hearing loss with tinnitus (noises in ears). Loss of balance may develop along with headaches and numbness or weakness of the face on the affected side." },
    { id: "attacks-dizziness", x: 50, y: 540, width: 200, height: 60, 
      symptomText: "Attacks of dizziness, hearing loss, and tinnitus (noises in ears). Lasts between a few minutes and several days." },
    { id: "sudden-hearing-loss", x: 230, y: 520, width: 180, height: 60, 
      symptomText: "Sudden hearing loss, usually on one side only. See doctor soon." },
    { id: "hearing-loss-brief-pain", x: 230, y: 590, width: 180, height: 60, 
      symptomText: "Slight hearing loss following brief, intense pain. There may be slight bleeding or discharge from ear." },
    { id: "sudden-dizziness-nausea", x: 50, y: 620, width: 200, height: 60, 
      symptomText: "Sudden onset of dizziness with nausea and vomiting. Associated with feeling of being unsteady." },
    { id: "noises-in-ears", x: 520, y: 350, width: 200, height: 80, 
      symptomText: "Development of noises that are coming from inside the head and not from outside. Nature of sounds may vary, including ringing, whistling, hissing. May be associated hearing loss." },
    { id: "vertigo-with-tinnitus", x: 520, y: 450, width: 200, height: 80, 
      symptomText: "Dizziness, worsened by change of head position; tinnitus; hearing loss. Fever, and feeling of fullness or pressure in the ear may also be present." },
    { id: "attacks-vertigo-tinnitus", x: 520, y: 540, width: 200, height: 60, 
      symptomText: "Attacks of dizziness, hearing loss, and tinnitus. Lasts between a few minutes and several days." },
    { id: "balance-loss-headaches", x: 520, y: 620, width: 200, height: 80, 
      symptomText: "One-sided, slowly developing hearing loss with tinnitus. Loss of balance may develop along with headaches and numbness or weakness of face on the affected side." }
  ];

  useEffect(() => {
    fetchSymptomImage();
  }, [bodyPart]);

  const fetchSymptomImage = async () => {
    try {
      setLoading(true);
      
      const result = await loadImageFromStorage(bodyPart);
      
      if (result.url && result.filename) {
        setImageUrl(result.url);
        // Open lightbox immediately once image is loaded
        setLightboxOpen(true);
      }
    } catch (err) {
      console.error("Error loading image:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomSubmit = (symptom: {id: string, text: string}) => {
    setFinalSelection(symptom);
    setLightboxOpen(false);
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const handleContinueToNextStep = async () => {
    if (!finalSelection) return;
    
    setLoadingDiagnosis(true);
    try {
      // Query the "New Master" table to find matching symptom and get probable diagnosis
      const { data, error } = await supabase
        .from('New Master')
        .select('Probable Diagnosis')
        .ilike('Symptoms', `%${finalSelection.text}%`)
        .single();

      if (error) {
        console.error('Error fetching diagnosis:', error);
        // If exact match fails, try with symptom ID keywords
        const keywords = finalSelection.id.replace(/-/g, ' ');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('New Master')
          .select('Probable Diagnosis')
          .ilike('Symptoms', `%${keywords}%`)
          .single();
        
        if (fallbackError) {
          console.error('Error fetching fallback diagnosis:', fallbackError);
          setDiagnosis('Unable to determine diagnosis. Please consult with a healthcare provider.');
        } else {
          setDiagnosis(fallbackData['Probable Diagnosis'] || 'No diagnosis information available.');
        }
      } else {
        setDiagnosis(data['Probable Diagnosis'] || 'No diagnosis information available.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setDiagnosis('Unable to determine diagnosis. Please consult with a healthcare provider.');
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  const handleRequestPrescription = () => {
    // TODO: Implement prescription request functionality
    console.log("Prescription requested for:", {
      patient: patientData,
      symptom: finalSelection,
      diagnosis: diagnosis
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading interactive symptom selector...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">Image Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No symptom diagram found for "{bodyPart}".
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Body Map
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{bodyPart} Symptoms</h1>
                <p className="text-sm text-muted-foreground">
                  Patient: {patientData.name} | Age: {patientData.age} | Gender: {patientData.gender}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {!finalSelection ? (
            <Card className="p-6">
              <CardContent className="text-center space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Symptom Selection</h2>
                  <p className="text-muted-foreground">
                    Click below to open the interactive symptom selector in fullscreen mode for better visibility.
                  </p>
                </div>
                
                {imageUrl && (
                  <div className="space-y-4">
                    <img 
                      src={imageUrl} 
                      alt={`${bodyPart} symptom preview`}
                      className="w-full max-w-md mx-auto rounded-lg shadow-md"
                    />
                    <Button onClick={openLightbox} size="lg" className="w-full max-w-sm">
                      Open Fullscreen Symptom Selector
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-xl text-center">Selected Symptom</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {finalSelection.id.replace(/-/g, ' ').toUpperCase()}
                  </h3>
                  <p className="text-muted-foreground">
                    {finalSelection.text}
                  </p>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFinalSelection(null);
                      setDiagnosis(null);
                    }}
                  >
                    Change Selection
                  </Button>
                  <Button 
                    onClick={handleContinueToNextStep}
                    disabled={loadingDiagnosis}
                  >
                    {loadingDiagnosis ? "Analyzing..." : "Continue to Next Step"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis Results */}
          {diagnosis && (
            <Card className="p-6 mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-center gradient-text">Probable Diagnosis</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <Stethoscope className="h-8 w-8 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-primary">Medical Assessment</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {diagnosis}
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Disclaimer:</strong> This is a preliminary assessment based on your symptoms. 
                    Please consult with a qualified healthcare provider for proper diagnosis and treatment.
                  </p>
                </div>

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
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {imageUrl && (
        <FullscreenSymptomLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={imageUrl}
          bodyPart={bodyPart}
          patientData={patientData}
          textAreas={textAreas}
          onSymptomSubmit={handleSymptomSubmit}
        />
      )}
    </div>
  );
};

export default InteractiveSymptomSelector;