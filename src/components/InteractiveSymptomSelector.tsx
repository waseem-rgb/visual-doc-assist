import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { loadImageFromStorage } from "@/lib/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import UniversalSymptomSelector from "./UniversalSymptomSelector";

interface InteractiveSymptomSelectorProps {
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  onBack: () => void;
}

interface SymptomItem {
  id: string;
  text: string;
  category?: string;
}

const InteractiveSymptomSelector = ({ bodyPart, patientData, onBack }: InteractiveSymptomSelectorProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [finalSelection, setFinalSelection] = useState<{id: string, text: string} | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  // Universal symptom definitions - works for any body part
  const getUniversalSymptoms = (bodyPart: string): SymptomItem[] => {
    const bodyPartUpper = bodyPart.toUpperCase();
    
    // Define symptoms based on body part categories
    if (bodyPartUpper.includes('HAIR') || bodyPartUpper.includes('SCALP')) {
      return [
        { id: "hair-loss-general", text: "Hair loss, hair thinning, or receding hairline that occurs gradually over time or suddenly" },
        { id: "scalp-conditions", text: "Scalp problems including dryness, itching, flaking, or irritation with possible dandruff" },
        { id: "hair-texture-changes", text: "Changes in hair texture - hair becoming coarse, fine, brittle, or losing natural shine" },
        { id: "scalp-skin-changes", text: "Visible changes to scalp skin including redness, scaling, or patches of different color/texture" },
        { id: "patchy-hair-loss", text: "Patchy areas of hair loss creating bald spots or uneven hair distribution" },
        { id: "scalp-sensitivity", text: "Scalp sensitivity or pain when touching head or hair, burning or stinging sensations" },
        { id: "excessive-shedding", text: "Excessive daily hair shedding - more hair than usual in brush, on pillow, or in shower" },
        { id: "scalp-odor", text: "Unusual scalp odor or discharge, oily/flaky substances creating unpleasant smell" }
      ];
    } else if (bodyPartUpper.includes('EAR')) {
      return [
        { id: "hearing-loss-gradual", text: "Gradually increasing hearing loss affecting both ears, difficulty with conversation in noise" },
        { id: "blocked-ear", text: "Blocked ear sensation with mild discomfort and reduced hearing" },
        { id: "reduced-hearing", text: "Reduced hearing requiring high TV volume, quieter speech, may follow recent cold" },
        { id: "hearing-unequal", text: "Unequal hearing loss in both ears, improved hearing in noisy backgrounds, tinnitus" },
        { id: "vertigo-dizziness", text: "Vertigo worsened by head position changes, tinnitus, hearing loss, ear pressure" },
        { id: "hearing-one-sided", text: "One-sided hearing loss with tinnitus, balance issues, headaches, facial numbness" },
        { id: "dizziness-attacks", text: "Attacks of dizziness, hearing loss, and tinnitus lasting minutes to days" },
        { id: "sudden-hearing-loss", text: "Sudden hearing loss, usually one-sided - requires immediate medical attention" },
        { id: "ear-pain-bleeding", text: "Hearing loss following brief intense pain, possible bleeding or discharge from ear" },
        { id: "sudden-dizziness-nausea", text: "Sudden dizziness with nausea, vomiting, and feeling unsteady" },
        { id: "tinnitus-noises", text: "Noises from inside head - ringing, whistling, hissing sounds, possible hearing loss" }
      ];
    } else if (bodyPartUpper.includes('GENITAL') || bodyPartUpper.includes('MALE')) {
      return [
        { id: "penile-discharge", text: "Discharge from penis with burning during urination - clear, white, yellow, or green" },
        { id: "testicular-pain", text: "Pain or discomfort in one or both testicles, swelling of testicles or scrotum" },
        { id: "genital-sores", text: "Sores, ulcers, or lesions on penis, testicles, or surrounding area - painful or painless" },
        { id: "urinary-burning", text: "Burning, stinging, or pain during urination, increased frequency or difficulty urinating" },
        { id: "erectile-dysfunction", text: "Difficulty achieving or maintaining erection sufficient for sexual intercourse" },
        { id: "scrotal-swelling", text: "Swelling in scrotum, feeling of heaviness or dragging sensation" },
        { id: "groin-pain", text: "Pain in groin area that may radiate to testicles or lower abdomen" }
      ];
    } else {
      // Generic symptoms for any other body part
      return [
        { id: "pain-aching", text: "Persistent pain, aching, or discomfort in this area" },
        { id: "swelling-inflammation", text: "Swelling, inflammation, or visible enlargement" },
        { id: "skin-changes", text: "Changes in skin color, texture, or appearance" },
        { id: "numbness-tingling", text: "Numbness, tingling, or loss of sensation" },
        { id: "stiffness-mobility", text: "Stiffness or reduced range of motion" },
        { id: "warmth-heat", text: "Unusual warmth or heat in the area" },
        { id: "discharge-bleeding", text: "Any unusual discharge, bleeding, or fluid" },
        { id: "itching-irritation", text: "Itching, burning, or general irritation" }
      ];
    }
  };

  const symptoms: SymptomItem[] = getUniversalSymptoms(bodyPart);

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
        .select('"Probable Diagnosis"')
        .ilike('Symptoms', `%${finalSelection.text}%`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching diagnosis:', error);
        // If exact match fails, try with symptom ID keywords
        const keywords = finalSelection.id.replace(/-/g, ' ');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('New Master')
          .select('"Probable Diagnosis"')
          .ilike('Symptoms', `%${keywords}%`)
          .maybeSingle();
        
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
                  <p className="text-gray-700 leading-relaxed">
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

      {/* Fullscreen Universal Selector */}
      {imageUrl && (
        <UniversalSymptomSelector
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={imageUrl}
          bodyPart={bodyPart}
          patientData={patientData}
          symptoms={symptoms}
          onSymptomSubmit={handleSymptomSubmit}
        />
      )}
    </div>
  );
};

export default InteractiveSymptomSelector;