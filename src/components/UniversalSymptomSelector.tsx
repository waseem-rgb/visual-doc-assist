import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { Canvas as FabricCanvas, Circle } from "fabric";
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
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [highlightCircle, setHighlightCircle] = useState<Circle | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle image load event with dynamic sizing
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.log('✅ Image loaded successfully:', img.naturalWidth, 'x', img.naturalHeight);
    
    // Calculate dynamic display dimensions based on available space
    const availableWidth = isFullscreen ? window.innerWidth * 0.7 : Math.min(800, window.innerWidth * 0.6);
    const availableHeight = isFullscreen ? window.innerHeight * 0.8 : Math.min(600, window.innerHeight * 0.7);
    
    let displayWidth = img.naturalWidth;
    let displayHeight = img.naturalHeight;
    
    // Scale to fit available space while maintaining aspect ratio
    const widthRatio = availableWidth / displayWidth;
    const heightRatio = availableHeight / displayHeight;
    const scale = Math.min(widthRatio, heightRatio, 1); // Don't scale up
    
    displayWidth = Math.round(displayWidth * scale);
    displayHeight = Math.round(displayHeight * scale);
    
    setDisplayDimensions({
      width: displayWidth,
      height: displayHeight
    });
    
    setImageLoaded(true);

    // Initialize canvas after image loads
    if (canvasRef.current && displayWidth > 0) {
      // Dispose existing canvas if any
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }

      const canvas = new FabricCanvas(canvasRef.current, {
        width: displayWidth,
        height: displayHeight,
        selection: false,
        hoverCursor: 'pointer',
        moveCursor: 'pointer',
        backgroundColor: 'transparent'
      });

      // Handle canvas clicks for marker placement
      canvas.on('mouse:down', (event) => {
        if (!selectedSymptom) {
          alert('Please select a symptom from the list first!');
          return;
        }

        const pointer = canvas.getPointer(event.e);
        
        // Remove existing marker
        if (highlightCircle) {
          canvas.remove(highlightCircle);
        }

        // Create new marker
        const circle = new Circle({
          left: pointer.x - 15,
          top: pointer.y - 15,
          radius: 15,
          fill: 'rgba(239, 68, 68, 0.8)',
          stroke: '#ffffff',
          strokeWidth: 3,
          selectable: false,
          evented: false
        });

        canvas.add(circle);
        setHighlightCircle(circle);
        canvas.renderAll();
        console.log('✅ Marker placed at:', pointer.x, pointer.y);
      });

      setFabricCanvas(canvas);
      console.log('🎨 Canvas initialized:', displayWidth, 'x', displayHeight);
    }
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Image failed to load:', e.currentTarget.src);
    setImageLoaded(false);
  };

  // Cleanup canvas
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [fabricCanvas]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    // Trigger image reload for new dimensions
    setTimeout(() => {
      if (imageRef.current) {
        handleImageLoad({ currentTarget: imageRef.current } as any);
      }
    }, 100);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
      setSelectedSymptom(null);
      setHighlightCircle(null);
      setZoomLevel(1);
      setIsFullscreen(false);
      if (fabricCanvas) {
        fabricCanvas.dispose();
        setFabricCanvas(null);
      }
    }
  }, [open]);

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!containerRef.current) return;

    let newZoom = zoomLevel;
    if (direction === 'in') {
      newZoom = Math.min(zoomLevel * 1.3, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(zoomLevel / 1.3, 0.5);
    } else {
      newZoom = 1;
    }

    setZoomLevel(newZoom);
    containerRef.current.style.transform = `scale(${newZoom})`;
  };

  // Handle symptom selection
  const handleSymptomClick = (symptom: SymptomItem) => {
    setSelectedSymptom(symptom);
    // Remove any existing markers
    if (highlightCircle && fabricCanvas) {
      fabricCanvas.remove(highlightCircle);
      setHighlightCircle(null);
      fabricCanvas.renderAll();
    }
    console.log('✅ Symptom selected:', symptom.text);
  };

  // Submit selection
  const handleSubmit = () => {
    if (selectedSymptom && highlightCircle) {
      onSymptomSubmit({
        id: selectedSymptom.id,
        text: selectedSymptom.text
      });
      console.log('✅ Symptom submitted:', selectedSymptom.text);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedSymptom(null);
    if (highlightCircle && fabricCanvas) {
      fabricCanvas.remove(highlightCircle);
      setHighlightCircle(null);
      fabricCanvas.renderAll();
    }
    console.log('✅ Selection cleared');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-screen max-h-screen w-screen h-screen' : 'max-w-[95vw] max-h-[95vh] w-full h-full'} p-0`} 
        aria-describedby="symptom-selector-description"
      >
        <DialogTitle className="sr-only">Universal Symptom Selector - {bodyPart}</DialogTitle>
        <div id="symptom-selector-description" className="sr-only">
          Interactive symptom selector for {bodyPart}. Select a symptom from the list and click on the image to mark the location.
        </div>
        
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
                <div className="flex items-center space-x-2">
                  <Button onClick={toggleFullscreen} variant="ghost" size="sm">
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                  <Button onClick={onClose} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
            <div className="flex items-center justify-center h-full pt-16 pb-4 overflow-auto">
              <div 
                className="overflow-auto max-h-full max-w-full p-4"
                style={{
                  minHeight: 'fit-content',
                  minWidth: 'fit-content'
                }}
              >
                <div 
                  ref={containerRef}
                  className="relative border-2 border-gray-200 rounded-lg shadow-lg bg-white inline-block"
                  style={{ 
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                >
                {/* Background Image */}
                {imageUrl && (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt={`${bodyPart} symptom diagram`}
                    className="block max-w-none"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                     style={{
                       width: displayDimensions.width || 'auto',
                       height: displayDimensions.height || 'auto',
                       display: imageLoaded ? 'block' : 'none'
                     }}
                  />
                )}
                
                {/* Loading State */}
                {!imageLoaded && (
                  <div className="flex items-center justify-center w-96 h-96 bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading image...</p>
                    </div>
                  </div>
                )}
                
                 {/* Overlay Canvas for Markers */}
                 {imageLoaded && (
                   <canvas 
                     ref={canvasRef}
                     className="absolute top-0 left-0 pointer-events-auto"
                     style={{
                       width: displayDimensions.width,
                       height: displayDimensions.height
                     }}
                   />
                 )}
                </div>
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

          {/* Right Side - Symptom Selection */}
          <div className={`${isFullscreen ? 'w-1/3' : 'w-96'} bg-background border-l flex flex-col`}>
            {!selectedSymptom ? (
              /* Symptom List - Show only when no symptom is selected */
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
                            variant="outline"
                            className="w-full h-auto p-3 text-left justify-start whitespace-normal hover:bg-primary/5"
                            onClick={() => handleSymptomClick(symptom)}
                          >
                            <span className="text-xs leading-relaxed">{symptom.text}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Selected Symptom Display - Show only when symptom is selected */
              <div className="flex-1 p-4 flex flex-col">
                <Card className="border-primary/50 flex-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary">Selected Symptom</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground leading-relaxed">
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
                
                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
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
                    Submit Selection to Know Possible Condition
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;