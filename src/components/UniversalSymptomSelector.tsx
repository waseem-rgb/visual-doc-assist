import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { Canvas as FabricCanvas, Circle, FabricImage } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SymptomItem {
  id: string;
  text: string;
  category?: string;
}

interface UniversalSymptomSelectorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  symptoms: SymptomItem[];
  onSymptomSubmit: (symptom: { id: string, text: string }) => void;
}

const UniversalSymptomSelector = ({
  open,
  onClose,
  imageUrl,
  bodyPart,
  patientData,
  symptoms,
  onSymptomSubmit
}: UniversalSymptomSelectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [hoveredSymptom, setHoveredSymptom] = useState<string | null>(null);
  const [highlightCircle, setHighlightCircle] = useState<Circle | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: Math.min(window.innerWidth * 0.7, 1000),
      height: Math.min(window.innerHeight * 0.8, 700),
      selection: false,
      hoverCursor: 'pointer',
      moveCursor: 'pointer'
    });

    // Load background image
    if (imageUrl) {
      // Create Fabric Image object for background
      FabricImage.fromURL(imageUrl).then((img) => {
        // Scale image to fit canvas
        const scaleX = canvas.width! / img.width!;
        const scaleY = canvas.height! / img.height!;
        const scale = Math.min(scaleX, scaleY);
        
        img.scale(scale);
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false
        });
        
        canvas.backgroundImage = img;
        canvas.renderAll();
      }).catch((error) => {
        console.error('Error loading background image:', error);
      });
    }

    // Handle canvas clicks to place markers
    canvas.on('mouse:down', (event) => {
      if (!selectedSymptom) return;

      const pointer = canvas.getPointer(event.e);
      
      // Remove existing highlight circle
      if (highlightCircle) {
        canvas.remove(highlightCircle);
      }

      // Create selection marker
      const circle = new Circle({
        left: pointer.x - 10,
        top: pointer.y - 10,
        radius: 12,
        fill: 'rgba(34, 197, 94, 0.8)',
        stroke: '#ffffff',
        strokeWidth: 3,
        selectable: false,
        evented: false
      });

      canvas.add(circle);
      setHighlightCircle(circle);
      canvas.renderAll();
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [open, imageUrl]);

  // Handle zoom controls
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!fabricCanvas) return;

    let newZoom = zoomLevel;
    if (direction === 'in') {
      newZoom = Math.min(zoomLevel * 1.2, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(zoomLevel / 1.2, 0.5);
    } else {
      newZoom = 1;
    }

    fabricCanvas.setZoom(newZoom);
    setZoomLevel(newZoom);
    fabricCanvas.renderAll();
  };

  // Handle symptom selection from list
  const handleSymptomClick = (symptom: SymptomItem) => {
    setSelectedSymptom(symptom);
    
    // Remove any existing highlights
    if (highlightCircle) {
      fabricCanvas?.remove(highlightCircle);
      setHighlightCircle(null);
    }
  };

  // Handle symptom hover for highlighting
  const handleSymptomHover = (symptomId: string | null) => {
    setHoveredSymptom(symptomId);
  };

  // Submit selection
  const handleSubmit = () => {
    if (selectedSymptom) {
      onSymptomSubmit({
        id: selectedSymptom.id,
        text: selectedSymptom.text
      });
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedSymptom(null);
    if (highlightCircle) {
      fabricCanvas?.remove(highlightCircle);
      setHighlightCircle(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogTitle className="sr-only">Universal Symptom Selector - {bodyPart}</DialogTitle>
        
        <div className="flex h-full">
          {/* Left Side - Interactive Canvas */}
          <div className="flex-1 bg-gray-50 p-4 relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Select Your {bodyPart} Symptom</h2>
                  <p className="text-xs text-muted-foreground">
                    Patient: {patientData.name} | Age: {patientData.age} | Gender: {patientData.gender}
                  </p>
                </div>
                <Button onClick={onClose} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-20 right-4 z-40 flex flex-col space-y-2">
              <Button onClick={() => handleZoom('in')} size="sm" variant="outline">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button onClick={() => handleZoom('out')} size="sm" variant="outline">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button onClick={() => handleZoom('reset')} size="sm" variant="outline">
                Reset
              </Button>
              <div className="text-xs text-center bg-background/80 rounded px-2 py-1">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>

            {/* Canvas Container */}
            <div className="flex items-center justify-center h-full pt-16 pb-4">
              <div className="border-2 border-gray-200 rounded-lg shadow-lg bg-white">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur rounded-lg p-3 border">
              {!selectedSymptom ? (
                <p className="text-sm text-center">
                  <strong>Step 1:</strong> Choose a symptom from the list on the right that matches your condition.
                </p>
              ) : !highlightCircle ? (
                <p className="text-sm text-center text-primary">
                  <strong>Step 2:</strong> Click on the image where you experience this symptom to place a marker.
                </p>
              ) : (
                <div className="text-sm text-center text-green-600">
                  <p><strong>Perfect!</strong> You've selected "{selectedSymptom.text}" and placed a marker.</p>
                  <p>Review your selection on the right and submit when ready.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Symptom List */}
          <div className="w-96 bg-background border-l flex flex-col">
            {/* Symptom List */}
            <div className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Symptoms</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Click on a symptom that matches your condition
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-2 p-4">
                      {symptoms.map((symptom) => (
                        <Button
                          key={symptom.id}
                          variant={selectedSymptom?.id === symptom.id ? "default" : "outline"}
                          className={`w-full h-auto p-3 text-left justify-start whitespace-normal ${
                            hoveredSymptom === symptom.id ? 'ring-2 ring-primary/50' : ''
                          }`}
                          onClick={() => handleSymptomClick(symptom)}
                          onMouseEnter={() => handleSymptomHover(symptom.id)}
                          onMouseLeave={() => handleSymptomHover(null)}
                        >
                          <div className="flex items-start space-x-2">
                            {selectedSymptom?.id === symptom.id && (
                              <Check className="h-4 w-4 mt-1 text-primary-foreground" />
                            )}
                            <span className="text-xs leading-relaxed">{symptom.text}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Selected Symptom Display */}
            {selectedSymptom && (
              <div className="p-4 border-t">
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary">Selected Symptom</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedSymptom.text}
                      </p>
                    </div>
                    
                    {highlightCircle ? (
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-xs text-green-700 text-center">
                          ✓ Location marked on image
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-2 rounded-lg">
                        <p className="text-xs text-amber-700 text-center">
                          Click on the image to mark the location
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 border-t space-y-2">
              {selectedSymptom ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!highlightCircle}
                  >
                    Submit Selection
                  </Button>
                </>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-4">
                  Select a symptom from the list above to continue
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;