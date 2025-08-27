import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info, ZoomIn, ZoomOut } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadImageFromStorage } from "@/lib/storageUtils";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymptom, setSelectedSymptom] = useState<{id: string, x: number, y: number, text: string} | null>(null);
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [currentHoveredArea, setCurrentHoveredArea] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectionLocked, setSelectionLocked] = useState(false);

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
    fetchSymptomsFromDatabase();
  }, [bodyPart]);

  const fetchSymptomImage = async () => {
    try {
      setLoading(true);
      
      console.log(`🔍 Loading image for body part: "${bodyPart}"`);
      
      const result = await loadImageFromStorage(bodyPart);
      
      if (result.url && result.filename) {
        setImageUrl(result.url);
        toast.success(`✅ Loaded: ${result.filename}`);
        console.log(`✅ Successfully loaded image: ${result.filename}`);
      } else {
        console.error(`❌ ${result.error}`);
        toast.error(result.error || `Image not found for "${bodyPart}"`);
      }
    } catch (err) {
      console.error("💥 Unexpected error loading image:", err);
      toast.error("Failed to load symptom diagram");
    } finally {
      setLoading(false);
    }
  };

  const fetchSymptomsFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('New Master')
        .select('Symptoms')
        .ilike('Part of body_and general full body symptom', `%${bodyPart}%`)
        .not('Symptoms', 'is', null);

      if (error) {
        console.error("Error fetching symptoms:", error);
        return;
      }

      if (data && data.length > 0) {
        const symptomTexts = data
          .map(row => row.Symptoms?.trim())
          .filter(Boolean)
          .filter((text, index, arr) => arr.indexOf(text) === index);
        
        setAvailableSymptoms(symptomTexts);
      }
    } catch (err) {
      console.error("Error fetching symptoms:", err);
    }
  };

  // Handle mouse movement with CSS cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCursorPosition({ x, y });
    
    // Check text area intersection with zoom-adjusted coordinates
    checkTextAreaIntersection(x / zoomLevel, y / zoomLevel);
  };

  const handleMouseEnter = () => {
    setShowCursor(true);
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
    setCurrentHoveredArea(null);
  };

  const handleClick = () => {
    if (selectionLocked || !currentHoveredArea) return;
    
    const area = textAreas.find(a => a.id === currentHoveredArea);
    if (!area) return;

    // Single select - set the symptom
    setSelectedSymptom({
      id: currentHoveredArea,
      x: cursorPosition.x,
      y: cursorPosition.y,
      text: area.symptomText
    });
    setSelectionLocked(true);
    setShowCursor(false);
    toast.success("Symptom selected");
  };

  const changeSelection = () => {
    setSelectedSymptom(null);
    setSelectionLocked(false);
    setShowCursor(true);
  };

  // Calculate dynamic circle size based on zoom level
  const getCircleSize = () => {
    const baseSize = 20; // Slightly smaller base size
    const minSize = 8;   // Smaller minimum size
    const maxSize = 32;  // Smaller maximum size
    
    // Inverse relationship with zoom - smaller circle when zoomed in
    const dynamicSize = baseSize / Math.sqrt(zoomLevel);
    return Math.max(minSize, Math.min(maxSize, dynamicSize));
  };

  const checkTextAreaIntersection = (x: number, y: number) => {
    if (selectionLocked) return; // Don't check intersection when locked

    let hoveredArea = null;

    for (const area of textAreas) {
      // Check if cursor position is within text area bounds
      if (
        x >= area.x && 
        x <= area.x + area.width &&
        y >= area.y && 
        y <= area.y + area.height
      ) {
        hoveredArea = area.id;
        break;
      }
    }

    setCurrentHoveredArea(hoveredArea);
    // Removed toast notification for hover
  };

  const toggleSymptomSelection = () => {
    // Removed this function as it's not needed for single select
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
                <h1 className="text-2xl font-bold">Interactive {bodyPart} Symptoms</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Interactive Canvas with Zoom */}
          <div className="lg:col-span-3">
            <Card className="h-[90vh]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Interactive {bodyPart} Selector</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>{selectionLocked ? 'Selection locked - use side panel to change' : 'Click to select a symptom'}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-6">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={3}
                  wheel={{ step: 0.1 }}
                  pinch={{ step: 5 }}
                  doubleClick={{ disabled: false, mode: "zoomIn", step: 0.3 }}
                  onTransformed={(ref) => {
                    if (ref.state.scale) {
                      setZoomLevel(ref.state.scale);
                    }
                  }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <div className="h-full">
                      {/* Zoom Controls */}
                      <div className="flex justify-end space-x-2 mb-2">
                        <Button onClick={() => zoomIn()} size="sm" variant="outline">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => zoomOut()} size="sm" variant="outline">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => resetTransform()} size="sm" variant="outline">
                          Reset
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center">
                          Zoom: {Math.round(zoomLevel * 100)}%
                        </div>
                      </div>
                      
                      <div 
                        ref={containerRef}
                        className="relative border border-gray-200 rounded-lg shadow-lg overflow-hidden h-full cursor-none"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleClick}
                      >
                        {/* Fixed green circle for selected symptom */}
                        {selectedSymptom && (
                          <div
                            className="absolute bg-green-500 border-2 border-white rounded-full shadow-lg pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: selectedSymptom.x,
                              top: selectedSymptom.y,
                              width: `${getCircleSize()}px`,
                              height: `${getCircleSize()}px`,
                            }}
                          />
                        )}

                        {/* Moving blue/green cursor */}
                        {showCursor && !selectionLocked && (
                          <div
                            className="absolute bg-blue-500 border-2 border-white rounded-full shadow-lg pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                            style={{
                              left: cursorPosition.x,
                              top: cursorPosition.y,
                              width: `${getCircleSize()}px`,
                              height: `${getCircleSize()}px`,
                              background: currentHoveredArea ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'
                            }}
                          />
                        )}
                        
                        {/* Image with zoom/pan */}
                        <TransformComponent>
                          <div className="relative w-full h-full">
                            <img 
                              src={imageUrl} 
                              alt={`${bodyPart} symptom diagram`}
                              className="w-full h-auto block pointer-events-none"
                              draggable={false}
                              style={{ maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        </TransformComponent>
                      </div>
                    </div>
                  )}
                </TransformWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Selection Panel */}
          <div className="lg:col-span-1 space-y-4">
            {!selectionLocked && currentHoveredArea && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Hover</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const area = textAreas.find(a => a.id === currentHoveredArea);
                    return area ? (
                      <div>
                        <p className="text-sm font-medium mb-2">{area.id.replace(/-/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{area.symptomText}</p>
                        <Button 
                          className="w-full mt-3" 
                          size="sm"
                          onClick={() => handleClick()}
                        >
                          Select This Symptom
                        </Button>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Selected Symptom Display */}
            {selectedSymptom && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Selected Symptom
                    <div className="w-3 h-3 bg-green-500 rounded-full border border-white flex-shrink-0"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <p className="text-sm font-medium mb-2">
                      {selectedSymptom.id.replace(/-/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{selectedSymptom.text}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={changeSelection}
                    >
                      Change My Symptom Selection
                    </Button>
                    <Button className="w-full" size="lg">
                      Submit My Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {!selectedSymptom ? (
                    <>
                      <p>• Move mouse over symptom areas</p>
                      <p>• Click to select one symptom</p>
                      <p>• Use zoom controls for better visibility</p>
                    </>
                  ) : (
                    <>
                      <p>• Your symptom has been selected</p>
                      <p>• Use "Change" to select different symptom</p>
                      <p>• Use "Submit" to proceed with current selection</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSymptomSelector;