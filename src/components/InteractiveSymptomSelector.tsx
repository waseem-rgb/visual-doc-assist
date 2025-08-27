import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Canvas as FabricCanvas, Circle } from "fabric";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
  const [cursor, setCursor] = useState<Circle | null>(null);
  const [currentHoveredArea, setCurrentHoveredArea] = useState<string | null>(null);

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

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      // Wait for image to load and DOM to settle
      const timer = setTimeout(() => {
        initializeFabricCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageUrl]);

  // Handle window resize to keep canvas responsive
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvas && canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          fabricCanvas.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight
          });
          fabricCanvas.renderAll();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

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

  const initializeFabricCanvas = () => {
    if (!canvasRef.current || !imageUrl) return;

    // Get the container dimensions to make canvas responsive
    const container = canvasRef.current.parentElement;
    if (!container) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: "transparent",
      selection: false,
    });

    // Create the movable cursor circle with cleaner appearance
    const cursorCircle = new Circle({
      left: 100,
      top: 100,
      radius: 12,
      fill: "rgba(59, 130, 246, 0.7)",
      stroke: "rgba(255, 255, 255, 0.9)",
      strokeWidth: 2,
      selectable: true,
      moveCursor: 'move',
      hoverCursor: 'move',
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
    });

    canvas.add(cursorCircle);
    setCursor(cursorCircle);

    // Handle cursor movement and mouse events
    canvas.on('object:moving', (e) => {
      if (e.target === cursorCircle) {
        checkTextAreaIntersection(e.target as Circle);
      }
    });

    // Handle click to select symptom - improved event handling
    canvas.on('mouse:up', (e) => {
      if (currentHoveredArea && e.target === cursorCircle) {
        toggleSymptomSelection(currentHoveredArea);
      }
    });

    // Add mouse move tracking for better responsiveness
    canvas.on('mouse:move', (e) => {
      if (cursor && e.pointer) {
        // Update cursor position to follow mouse with proper offset
        cursor.set({
          left: e.pointer.x - cursor.radius,
          top: e.pointer.y - cursor.radius
        });
        canvas.renderAll();
        checkTextAreaIntersection(cursor);
      }
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  };

  const checkTextAreaIntersection = (circle: Circle) => {
    const circleLeft = circle.left || 0;
    const circleTop = circle.top || 0;
    const circleRadius = circle.radius || 0;

    let hoveredArea = null;

    for (const area of textAreas) {
      // Check if circle center is within text area bounds
      if (
        circleLeft >= area.x && 
        circleLeft <= area.x + area.width &&
        circleTop >= area.y && 
        circleTop <= area.y + area.height
      ) {
        hoveredArea = area.id;
        break;
      }
    }

    if (hoveredArea !== currentHoveredArea) {
      setCurrentHoveredArea(hoveredArea);
      
      if (hoveredArea) {
        const area = textAreas.find(a => a.id === hoveredArea);
        if (area) {
          toast.info(`Hovering: ${area.symptomText.substring(0, 50)}...`);
        }
      }
    }
  };

  const toggleSymptomSelection = (areaId: string) => {
    const area = textAreas.find(a => a.id === areaId);
    if (!area) return;

    setSelectedSymptoms(prev => 
      prev.includes(area.symptomText) 
        ? prev.filter(symptom => symptom !== area.symptomText)
        : [...prev, area.symptomText]
    );

    toast.success(
      selectedSymptoms.includes(area.symptomText) 
        ? "Symptom deselected" 
        : "Symptom selected"
    );
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
            <Card className="h-[80vh]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Interactive {bodyPart} Selector</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Move your mouse to position the blue circle, click to select symptoms</span>
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
                      </div>
                      
                      <div className="relative border border-gray-200 rounded-lg shadow-lg overflow-hidden h-full">
                        <TransformComponent>
                          <div className="relative w-full h-full">
                            {/* Background Image */}
                            <img 
                              src={imageUrl} 
                              alt={`${bodyPart} symptom diagram`}
                              className="w-full h-auto block"
                              draggable={false}
                              style={{ maxHeight: '100%', objectFit: 'contain' }}
                            />
                            {/* Interactive Canvas Overlay */}
                            <canvas 
                              ref={canvasRef} 
                              className="absolute top-0 left-0 w-full h-full z-20 pointer-events-auto" 
                              style={{ 
                                background: 'transparent',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }} 
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
            {currentHoveredArea && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const area = textAreas.find(a => a.id === currentHoveredArea);
                    return area ? (
                      <p className="text-sm">{area.symptomText}</p>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Selected Symptoms Summary */}
            {selectedSymptoms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Symptoms ({selectedSymptoms.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedSymptoms.map((symptom, index) => (
                      <div key={index} className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-xs">{symptom}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gradient-primary" size="lg">
                    Continue with Selected Symptoms
                  </Button>
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
                  <p>• Drag the blue circle over symptom paragraphs</p>
                  <p>• Click when hovering over a symptom to select it</p>
                  <p>• Selected symptoms appear in the panel</p>
                  <p>• Continue when you've selected all relevant symptoms</p>
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