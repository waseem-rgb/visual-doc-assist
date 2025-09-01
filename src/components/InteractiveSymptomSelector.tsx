import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Stethoscope, Clock } from "lucide-react";
import { loadImageFromStorage } from "@/lib/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [showClinicalForm, setShowClinicalForm] = useState(false);
  const [prescriptionSubmitted, setPrescriptionSubmitted] = useState(false);
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Clinical history form state
  const [clinicalData, setClinicalData] = useState({
    symptomDuration: '',
    durationUnit: 'days',
    chronicIllness: [] as string[],
    drugAllergies: '',
    smoking: '',
    alcohol: '',
    mobileNumber: '',
    medicationHistory: ''
  });

  // Universal symptom definitions - removed as UniversalSymptomSelector now handles this via Supabase
  // const getUniversalSymptoms = ... // Moved to UniversalSymptomSelector to use Supabase data
  
  // Empty symptoms array - let UniversalSymptomSelector fetch from Supabase
  const symptoms: SymptomItem[] = [];

  useEffect(() => {
    fetchSymptomImage();
  }, [bodyPart]);

  // Cleanup only blob URLs when component unmounts or bodyPart changes
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
          console.log('🧹 Cleaned up blob URL:', blobUrlRef.current);
        } catch (error) {
          console.warn('Failed to revoke blob URL:', error);
        }
        blobUrlRef.current = null;
      }
    };
  }, [bodyPart]);

  const fetchSymptomImage = async () => {
    try {
      setLoading(true);
      setImageError(null);
      console.log(`🎯 [IMAGE FETCH START] Fetching image for: "${bodyPart}"`);
      console.log(`📍 [BODY PART INFO] Original: "${bodyPart}", Length: ${bodyPart.length}, Trimmed: "${bodyPart.trim()}"`);
      console.log(`🔧 [LOADING STATE] Setting loading to true, imageError to null`);
      
      // Clean up previous blob URL if it exists (only blob URLs need cleanup now)
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
          console.log('🧹 Cleaned up previous blob URL:', blobUrlRef.current);
        } catch (error) {
          console.warn('Failed to revoke previous blob URL:', error);
        }
        blobUrlRef.current = null;
      }
      
      console.log(`🔍 [STARTING SEARCH] About to call loadImageFromStorage for "${bodyPart}"`);
      const result = await loadImageFromStorage(bodyPart, 'Symptom_Images');
      console.log(`📋 [SEARCH RESULT]`, result);
      console.log(`✅ [RESULT CHECK] result.url: ${result.url ? 'EXISTS' : 'NULL'}, result.filename: ${result.filename || 'NULL'}`);
      
      if (result.url && result.filename) {
        console.log(`✅ [IMAGE SUCCESS] Setting image URL:`, result.url.substring(0, 100) + '...');
        setImageUrl(result.url);
        
        // Only track blob URLs for cleanup, signed URLs and data URLs are self-managing
        if (result.url.startsWith('blob:')) {
          blobUrlRef.current = result.url;
        }
        
        console.log('📸 [IMAGE SET] Image URL set successfully, showing preview (not auto-opening lightbox)');
      } else {
        console.error('❌ [IMAGE FAILED] Failed to load specific image:', result.error);
        
        // Try fallback to generic head image for eye-related symptoms
        if (bodyPart.toUpperCase().includes('EYE') || bodyPart.toUpperCase().includes('VISION')) {
          console.log('🔄 [FALLBACK] Attempting fallback to head-front-detailed for eye symptoms');
          try {
            const fallbackResult = await loadImageFromStorage('head-front-detailed', 'Symptom_Images');
            if (fallbackResult.url) {
              setImageUrl(fallbackResult.url);
              console.log('✅ [FALLBACK SUCCESS] Using head image as fallback for eye symptoms');
              setLightboxOpen(true);
              return;
            }
          } catch (fallbackError) {
            console.log('❌ [FALLBACK FAILED] Fallback image also failed:', fallbackError);
          }
        }
        
        setImageError(result.error || 'Failed to load image');
        // Still allow user to proceed without image
        toast({
          title: "Image Not Available", 
          description: `No specific diagram available for "${bodyPart}". You can still describe your symptoms from the list below.`,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("💥 [FETCH ERROR] Unexpected error loading image:", err);
      setImageError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Loading Error",
        description: "There was an error loading the symptom diagram. You can still proceed with describing your symptoms.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log(`🏁 [FETCH COMPLETE] Image fetch process completed for "${bodyPart}"`);
    }
  };

  const handleSymptomSubmit = async (symptom: {id: string, text: string}) => {
    console.log('🎯 [SYMPTOM SUBMIT] Called with:', symptom);
    setFinalSelection(symptom);
    setLightboxOpen(false);
    console.log('🎯 [SYMPTOM SUBMIT] Updated states - finalSelection set, lightbox closed');
    
    // Automatically fetch diagnosis from database when symptom is selected
    setLoadingDiagnosis(true);
    console.log('🔍 [DIAGNOSIS FETCH] Fetching diagnosis for symptom:', symptom.text);
    
    try {
      // Multiple search strategies to find the best match in "New Master" table
      const searchTerms = [
        symptom.text,
        symptom.id.replace(/-/g, ' '),
        symptom.text.split(' ').slice(0, 3).join(' '), // First 3 words
        ...symptom.text.split(' ').filter(word => word.length > 3) // Individual significant words
      ];

      let bestMatch = null;
      
      for (const term of searchTerms) {
        console.log('🔍 [DIAGNOSIS FETCH] Trying search term:', term);
        
        const { data, error } = await supabase
          .from('New Master')
          .select('"Probable Diagnosis", "Symptoms"')
          .ilike('Symptoms', `%${term}%`)
          .not('Probable Diagnosis', 'is', null)
          .limit(5);

        if (!error && data && data.length > 0) {
          console.log('🔍 [DIAGNOSIS FETCH] Found matches:', data);
          bestMatch = data[0]; // Take first match
          break;
        }
      }

      if (bestMatch) {
        const diagnosis = bestMatch['Probable Diagnosis'];
        console.log('✅ [DIAGNOSIS FETCH] Found diagnosis:', diagnosis);
        setDiagnosis(diagnosis || 'No specific diagnosis information available.');
      } else {
        console.log('❌ [DIAGNOSIS FETCH] No matches found');
        setDiagnosis('Unable to determine specific diagnosis. Please consult with a healthcare provider.');
      }
    } catch (err) {
      console.error('Unexpected error in diagnosis fetch:', err);
      setDiagnosis('Unable to determine diagnosis. Please consult with a healthcare provider.');
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  // Debug logging when UniversalSymptomSelector is about to render
  useEffect(() => {
    console.log('🔍 [PARENT DEBUG] State check for UniversalSymptomSelector rendering:');
    console.log('   - imageUrl:', imageUrl ? `"${imageUrl.substring(0, 50)}..."` : 'NULL/UNDEFINED');
    console.log('   - showClinicalForm:', showClinicalForm);
    console.log('   - lightboxOpen:', lightboxOpen);
    console.log('   - bodyPart:', bodyPart);
    console.log('   - Will render?:', !!(imageUrl && !showClinicalForm && lightboxOpen));
    
    if (imageUrl && !showClinicalForm && lightboxOpen) {
      console.log('✅ [PARENT DEBUG] About to render UniversalSymptomSelector');
      console.log('📋 [PARENT DEBUG] Props being passed:');
      console.log('   - open:', lightboxOpen);
      console.log('   - imageUrl:', imageUrl);
      console.log('   - bodyPart:', bodyPart);
      console.log('   - imageUrl type:', typeof imageUrl);
      console.log('   - imageUrl length:', imageUrl?.length);
    } else {
      console.log('❌ [PARENT DEBUG] UniversalSymptomSelector will NOT render');
    }
  }, [imageUrl, showClinicalForm, lightboxOpen, bodyPart]);

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const handleContinueToNextStep = async () => {
    if (!finalSelection) return;
    
    setLoadingDiagnosis(true);
    console.log('🔍 [FINAL DIAGNOSIS FETCH] Fetching diagnosis for final selection:', finalSelection.text);
    
    try {
      // Multiple search strategies to find the best match in "New Master" table
      const searchTerms = [
        finalSelection.text,
        finalSelection.id.replace(/-/g, ' '),
        finalSelection.text.split(' ').slice(0, 3).join(' '), // First 3 words
        ...finalSelection.text.split(' ').filter(word => word.length > 3) // Individual significant words
      ];

      let bestMatch = null;
      
      for (const term of searchTerms) {
        console.log('🔍 [FINAL DIAGNOSIS FETCH] Trying search term:', term);
        
        const { data, error } = await supabase
          .from('New Master')
          .select('"Probable Diagnosis", "Symptoms"')
          .ilike('Symptoms', `%${term}%`)
          .not('Probable Diagnosis', 'is', null)
          .limit(5);

        if (!error && data && data.length > 0) {
          console.log('🔍 [FINAL DIAGNOSIS FETCH] Found matches:', data);
          bestMatch = data[0]; // Take first match
          break;
        }
      }

      if (bestMatch) {
        const diagnosis = bestMatch['Probable Diagnosis'];
        console.log('✅ [FINAL DIAGNOSIS FETCH] Found diagnosis:', diagnosis);
        setDiagnosis(diagnosis || 'No specific diagnosis information available.');
      } else {
        console.log('❌ [FINAL DIAGNOSIS FETCH] No matches found');
        setDiagnosis('Unable to determine specific diagnosis. Please consult with a healthcare provider.');
      }
    } catch (err) {
      console.error('Unexpected error in final diagnosis fetch:', err);
      setDiagnosis('Unable to determine diagnosis. Please consult with a healthcare provider.');
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  const handleRequestPrescription = () => {
    console.log('Request Prescription button clicked!');
    console.log('prescriptionSubmitted state:', prescriptionSubmitted);
    console.log('Request prescription clicked - showing clinical form');
    setShowClinicalForm(true);
    console.log('After handleRequestPrescription - showClinicalForm should be:', true);
  };

  const handleClinicalFormSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmittingPrescription) {
      console.log('Already submitting prescription, ignoring click');
      return;
    }

    // Validate required fields
    if (!clinicalData.mobileNumber.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Mobile number is required to proceed.",
        variant: "destructive"
      });
      return;
    }

    // Validate mobile number format (basic validation)
    const mobilePattern = /^[0-9]{10,15}$/;
    if (!mobilePattern.test(clinicalData.mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingPrescription(true);
    console.log('Starting prescription submission...');

    try {
      // Get additional data from New Master table
      const { data: masterData, error: masterError } = await supabase
        .from('New Master')
        .select('"Short Summary", "Basic Investigations", "Common Treatments", "prescription_Y-N"')
        .ilike('Symptoms', `%${finalSelection?.text}%`)
        .maybeSingle();

      if (masterError) {
        console.warn('Could not fetch additional data from New Master:', masterError);
      }

      // Prepare symptoms paragraph
      const symptomsText = finalSelection?.text || '';
      const durationText = clinicalData.symptomDuration && clinicalData.durationUnit ? 
        ` Duration: ${clinicalData.symptomDuration} ${clinicalData.durationUnit}.` : '';
      const chronicText = clinicalData.chronicIllness.length > 0 ? 
        ` Chronic conditions: ${clinicalData.chronicIllness.join(', ')}.` : '';
      const allergiesText = clinicalData.drugAllergies.trim() ? 
        ` Drug allergies: ${clinicalData.drugAllergies}.` : '';
      const medicationText = clinicalData.medicationHistory.trim() ? 
        ` Current medications: ${clinicalData.medicationHistory}.` : '';
      const lifestyleText = [
        clinicalData.smoking ? `Smoking: ${clinicalData.smoking}` : '',
        clinicalData.alcohol ? `Alcohol: ${clinicalData.alcohol}` : ''
      ].filter(Boolean).join(', ');
      const lifestyleFinal = lifestyleText ? ` Lifestyle: ${lifestyleText}.` : '';
      
      const fullSymptomsText = symptomsText + durationText + chronicText + allergiesText + medicationText + lifestyleFinal;

      // Determine if prescription is required based on database content
      const prescriptionYN = masterData?.['prescription_Y-N']?.toLowerCase() || '';
      console.log('🔍 [PRESCRIPTION CHECK] prescription_Y-N value:', prescriptionYN);
      
      // Check for doctor review keywords - these require doctor approval
      const doctorReviewKeywords = ['doctors review and prescription', 'doctor review', 'prescription', 'y'];
      const requiresDoctorReview = doctorReviewKeywords.some(keyword => prescriptionYN.includes(keyword));
      
      // Check for referral indicators - these go directly to referral
      const referralIndicators = ['cardiologist', 'ent', 'dermatologist', 'specialist', 'emergency', 'hospital', 'department', 'referral'];
      const isReferralCase = referralIndicators.some(indicator => prescriptionYN.includes(indicator));
      
      // Logic: 
      // - If contains doctor review keywords → needs doctor approval
      // - If contains referral keywords OR is 'n' → goes to referral
      // - Default for unclear cases → referral (safer option)
      const prescriptionRequired = requiresDoctorReview && !isReferralCase;
      const isReferralCase_final = isReferralCase || prescriptionYN === 'n' || (!requiresDoctorReview && prescriptionYN !== '');
      
      console.log('🔍 [DECISION] requiresDoctorReview:', requiresDoctorReview);
      console.log('🔍 [DECISION] isReferralCase:', isReferralCase);
      console.log('🔍 [DECISION] prescriptionRequired:', prescriptionRequired);
      console.log('🔍 [DECISION] isReferralCase_final:', isReferralCase_final);

      // Check if user is authenticated for tracking
      const { data: { user } } = await supabase.auth.getUser();

    // Generate AI diagnosis using the edge function
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-text-generation', {
      body: {
        prompt: `Based on these symptoms: "${fullSymptomsText}" and body part: "${bodyPart}", provide a probable diagnosis. Keep it concise and professional.`,
        systemMessage: 'You are a medical AI assistant. Provide a probable diagnosis based on the symptoms described. Keep responses concise and note that this should not replace professional medical advice.',
        maxTokens: 200
      }
    });

    let generatedAiDiagnosis = 'Unable to determine diagnosis. Please consult with a healthcare provider.';
    if (!aiError && aiResponse?.success) {
      generatedAiDiagnosis = aiResponse.generatedText;
      setAiDiagnosis(generatedAiDiagnosis);
    }

    // Store prescription request in database with both diagnoses
    const { data: insertedData, error } = await supabase
      .from('prescription_requests')
      .insert({
        patient_name: patientData.name,
        patient_age: patientData.age,
        patient_gender: patientData.gender,
        body_part: bodyPart,
        symptoms: fullSymptomsText,
        probable_diagnosis: diagnosis || 'To be determined', // Keep for backward compatibility
        database_diagnosis: diagnosis || 'To be determined',
        ai_diagnosis: generatedAiDiagnosis,
        short_summary: masterData?.['Short Summary'] || '',
        basic_investigations: masterData?.['Basic Investigations'] || '',
        common_treatments: masterData?.['Common Treatments'] || '',
        prescription_required: prescriptionRequired,
        status: prescriptionRequired ? 'pending' : 'completed', // Auto-complete referral cases
        customer_id: user?.id || null, // Track customer if authenticated
        customer_email: user?.email || null, // Track customer email if authenticated
        medication_history: clinicalData.medicationHistory.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Auto-generate referral prescription if it's a referral case
    if (isReferralCase_final && insertedData) {
      try {
        console.log('Auto-generating referral prescription for request:', insertedData.id);
        
        const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-prescription-pdf-simple', {
          body: {
            requestId: insertedData.id,
            isReferral: true
          }
        });

        if (pdfError) {
          console.error('Error auto-generating referral PDF:', pdfError);
          // Don't fail the whole request if PDF generation fails
        } else {
          console.log('Referral PDF auto-generated successfully:', pdfResult);
        }
      } catch (pdfError) {
        console.error('Unexpected error in referral PDF generation:', pdfError);
        // Don't fail the whole request if PDF generation fails
      }
    }

    // Immediately set submitted state
    setPrescriptionSubmitted(true);
    setShowClinicalForm(false);

    toast({
      title: "Request Submitted Successfully",
      description: user ? 
        `Your ${prescriptionRequired ? 'prescription' : 'referral'} request has been ${prescriptionRequired ? 'submitted. A doctor will review it within 15 minutes' : 'processed and ready for download'}. Check your dashboard for updates.` :
        `Your ${prescriptionRequired ? 'prescription' : 'referral'} request has been ${prescriptionRequired ? 'submitted. A doctor will review it within 15 minutes' : 'processed and ready for download'}. Sign up to track your consultations in your dashboard.`,
      duration: 8000
    });
    } catch (error: any) {
      console.error('Error submitting prescription request:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPrescription(false);
      console.log('Prescription submission completed');
    }
  };

  const handleChronicIllnessChange = (illness: string, checked: boolean) => {
    setClinicalData(prev => ({
      ...prev,
      chronicIllness: checked 
        ? [...prev.chronicIllness, illness]
        : prev.chronicIllness.filter(item => item !== illness)
    }));
  };

  if (!imageUrl && !imageError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading interactive symptom selector...</p>
        </div>
      </div>
    );
  }

  // Show fallback when image fails to load but still allow symptom selection
  if (!imageUrl && imageError) {
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
            <Card className="p-6">
              <CardContent className="text-center space-y-6">
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h2 className="text-xl font-semibold mb-4 text-yellow-800">Image Not Available</h2>
                  <p className="text-yellow-700 mb-4">
                    The symptom diagram for "{bodyPart}" couldn't be loaded, but you can still describe your symptoms from the list below.
                  </p>
                </div>
                
                {/* Symptom List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Please select your symptom:</h3>
                  <div className="grid gap-3">
                    {symptoms.map((symptom) => (
                      <Button
                        key={symptom.id}
                        variant="outline"
                        className="text-left h-auto p-4 whitespace-normal"
                        onClick={() => {
                          setFinalSelection(symptom);
                          handleContinueToNextStep();
                        }}
                      >
                        {symptom.text}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
                  onClick={() => {
                    console.log('Request Prescription button clicked!');
                    console.log('Current showClinicalForm state:', showClinicalForm);
                    console.log('prescriptionSubmitted state:', prescriptionSubmitted);
                    handleRequestPrescription();
                    console.log('After handleRequestPrescription - showClinicalForm should be:', true);
                  }}
                  size="lg"
                  className="w-full max-w-sm bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
                  disabled={prescriptionSubmitted}
                >
                  {prescriptionSubmitted ? "Prescription Requested" : "Request Prescription"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Prescription Status */}
          {prescriptionSubmitted && (
            <Card className="p-6 mt-6">
              <CardContent className="text-center space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-600">Prescription Being Prepared</h3>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    Your prescription request has been submitted successfully. 
                    Our medical team is reviewing your case and will send the prescription 
                    to your mobile number within 15 minutes.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Please keep your mobile phone accessible. 
                    You will receive the prescription via SMS or WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {/* Clinical History Form Modal */}
      {showClinicalForm ? (
        <div 
          key="clinical-modal"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 overflow-y-auto"
          style={{ 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              console.log('Backdrop clicked - closing modal');
              setShowClinicalForm(false);
            }
          }}
        >
          <div className="w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <Card className="w-full shadow-2xl border-2 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Clinical History</CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  Please provide the following information to complete your prescription request
                </p>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Duration of Symptoms */}
              <div className="space-y-2">
                <Label htmlFor="symptom-duration">
                  Duration of Symptoms <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="symptom-duration"
                    type="number"
                    placeholder="Enter duration"
                    value={clinicalData.symptomDuration}
                    onChange={(e) => setClinicalData(prev => ({ ...prev, symptomDuration: e.target.value }))}
                    className="flex-1"
                  />
                  <Select 
                    value={clinicalData.durationUnit} 
                    onValueChange={(value) => setClinicalData(prev => ({ ...prev, durationUnit: value }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chronic Illness */}
              <div className="space-y-3">
                <Label>
                  Any Chronic Illness <span className="text-muted-foreground">(Optional - Select all that apply)</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['Hypertension', 'Diabetes mellitus', 'Hypothyroidism', 'Asthma', 'Tuberculosis'].map((illness) => (
                    <div key={illness} className="flex items-center space-x-2">
                      <Checkbox
                        id={illness}
                        checked={clinicalData.chronicIllness.includes(illness)}
                        onCheckedChange={(checked) => handleChronicIllnessChange(illness, checked as boolean)}
                      />
                      <Label htmlFor={illness} className="text-sm">{illness}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drug Allergies */}
              <div className="space-y-2">
                <Label htmlFor="drug-allergies">
                  Allergy to any Drug <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="drug-allergies"
                  placeholder="Enter any known drug allergies"
                  value={clinicalData.drugAllergies}
                  onChange={(e) => setClinicalData(prev => ({ ...prev, drugAllergies: e.target.value }))}
                />
              </div>

              {/* Smoking History */}
              <div className="space-y-3">
                <Label>
                  History of Smoking <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <RadioGroup 
                  value={clinicalData.smoking} 
                  onValueChange={(value) => setClinicalData(prev => ({ ...prev, smoking: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="smoking-yes" />
                    <Label htmlFor="smoking-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="smoking-no" />
                    <Label htmlFor="smoking-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Alcohol History */}
              <div className="space-y-3">
                <Label>
                  History of Alcoholism <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <RadioGroup 
                  value={clinicalData.alcohol} 
                  onValueChange={(value) => setClinicalData(prev => ({ ...prev, alcohol: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="alcohol-yes" />
                    <Label htmlFor="alcohol-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="alcohol-no" />
                    <Label htmlFor="alcohol-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Medication History */}
              <div className="space-y-2">
                <Label htmlFor="medication-history">
                  MEDICATION HISTORY - ANY MEDICATION CUSTOMER IS CURRENTLY TAKING <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="medication-history"
                  placeholder="Enter any medications you are currently taking"
                  value={clinicalData.medicationHistory}
                  onChange={(e) => setClinicalData(prev => ({ ...prev, medicationHistory: e.target.value.toUpperCase() }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Please list all current medications including dosages if known.
                </p>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile-number">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={clinicalData.mobileNumber}
                  onChange={(e) => setClinicalData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Required field. You will receive your prescription on this number.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowClinicalForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleClinicalFormSubmit}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                  disabled={isSubmittingPrescription}
                >
                  {isSubmittingPrescription ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit & Generate Prescription"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      ) : null}

      {/* Fullscreen Universal Selector */}
      {imageUrl && !showClinicalForm ? (
        <UniversalSymptomSelector
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={imageUrl}
          bodyPart={bodyPart}
          patientData={patientData}
          symptoms={symptoms}
          onSymptomSubmit={handleSymptomSubmit}
        />
      ) : (
        (() => {
          console.log('🚫 [PARENT DEBUG] UniversalSymptomSelector NOT rendered:', {
            imageUrl: !!imageUrl,
            showClinicalForm,
            renderCondition: !!(imageUrl && !showClinicalForm)
          });
          return null;
        })()
      )}
    </div>
  );
};

export default InteractiveSymptomSelector;