import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, Move } from "lucide-react";
import { Canvas as FabricCanvas, Circle, FabricImage, Point } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SymptomItem {
  id: string;
  text: string;
  category?: string;
}

interface TextRegion {
  id: string;
  text: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCircleRef = useRef<Circle | null>(null);
  const fabricImageRef = useRef<FabricImage | null>(null);
  const imageReadyRef = useRef<boolean>(false);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [highlightCircle, setHighlightCircle] = useState<Circle | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showSymptomPopover, setShowSymptomPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [detectedText, setDetectedText] = useState<string | null>(null);

  // Define text regions for the NAUSEA AND VOMITING image
  const getTextRegionsForBodyPart = (bodyPart: string): TextRegion[] => {
    if (bodyPart === "NAUSEA AND VOMITING") {
      return [
        {
          id: "nausea_general",
          text: "Nausea, usually with earache, dizziness, and reduced hearing. Nausea, usually with dizziness and vertigo, ringing in ears and pain. Dizziness, tinnitus (ringing sounds) in both ears, and hearing loss, with feelings of nausea. Usually a long-term condition, with recurrent episodes.",
          coordinates: { x: 430, y: 10, width: 200, height: 120 }
        },
        {
          id: "gastroenteritis",
          text: "Often one-sided headache, with blurred vision, and flashing lights. Rash, fever, headache, stiff neck, and generally unwell. Can rapidly result in unconsciousness if untreated. This is a medical emergency; dial 999",
          coordinates: { x: 104, y: 20, width: 180, height: 100 }
        },
        {
          id: "abdominal_pain",
          text: "Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
          coordinates: { x: 8, y: 200, width: 150, height: 120 }
        },
        {
          id: "stomach_pain",
          text: "Often cramping in children. Most common in the developing world. Chronic constipation causes a build-up in bowel and affects children. Failure to grow and put on weight. Abdominal pain and diarrhoea, with rash, tiredness. Common in the developing world.",
          coordinates: { x: 650, y: 200, width: 180, height: 150 }
        },
        {
          id: "blood_symptoms",
          text: "Vomiting with flu-like symptoms, blood in urine, and back pain. More common in women. Seek medical attention soon if symptoms severe. Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
          coordinates: { x: 650, y: 400, width: 200, height: 180 }
        },
        {
          id: "appetite_loss",
          text: "Loss of appetite, nausea, vomiting, fatigue, weakness, itching, lethargy, swelling, shortness of breath, muscle cramps, and headache.",
          coordinates: { x: 650, y: 580, width: 180, height: 80 }
        }
      ];
    }
    return [];
  };

  // Calculate canvas dimensions based on screen size
  const calculateCanvasDimensions = () => {
    const availableWidth = isFullscreen ? window.innerWidth * 0.65 : Math.min(800, window.innerWidth * 0.6);
    const availableHeight = isFullscreen ? window.innerHeight * 0.85 : Math.min(600, window.innerHeight * 0.7);
    
    setCanvasDimensions({
      width: Math.round(availableWidth),
      height: Math.round(availableHeight)
    });
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
    calculateCanvasDimensions();
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
      imageReadyRef.current = false;
      setSelectedSymptom(null);
      setHighlightCircle(null);
      hoverCircleRef.current = null;
      fabricImageRef.current = null;
      setZoomLevel(1);
      setIsFullscreen(true);
      setShowSymptomPopover(false);
      setClickPosition(null);
      setIsPanning(false);
      if (fabricCanvas) {
        fabricCanvas.dispose();
        setFabricCanvas(null);
      }
    }
  }, [open]);

  // Initialize canvas dimensions on mount and fullscreen toggle
  useEffect(() => {
    calculateCanvasDimensions();
  }, [isFullscreen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen) {
        calculateCanvasDimensions();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Initialize Fabric canvas and load image
  useEffect(() => {
    if (!open || !canvasRef.current || canvasDimensions.width === 0 || canvasDimensions.height === 0) {
      return;
    }

    // Dispose existing canvas if any
    if (fabricCanvas) {
      fabricCanvas.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      selection: false,
      hoverCursor: 'crosshair',
      moveCursor: 'crosshair',
      defaultCursor: 'crosshair',
      backgroundColor: '#f8fafc',
      enableRetinaScaling: true,
      interactive: true,
      allowTouchScrolling: false
    });

    // Load image into Fabric canvas
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      // Scale image to fit canvas while maintaining aspect ratio
      const scaleX = canvasDimensions.width / img.width!;
      const scaleY = canvasDimensions.height / img.height!;
      const scale = Math.min(scaleX, scaleY, 1);
      
      img.scale(scale);
      img.set({
        left: (canvasDimensions.width - img.width! * scale) / 2,
        top: (canvasDimensions.height - img.height! * scale) / 2,
        selectable: false,
        evented: false
      });

      canvas.add(img);
      fabricImageRef.current = img;
      setImageLoaded(true);
      imageReadyRef.current = true;
      
      // Create the reusable hover circle now that image is ready
      const hoverCircle = new Circle({
        radius: 6,
        fill: 'rgba(59, 130, 246, 0.4)',
        stroke: '#3b82f6',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        opacity: 0.9,
        visible: false
      });
      canvas.add(hoverCircle);
      hoverCircleRef.current = hoverCircle;
      
      canvas.renderAll();
    }).catch((error) => {
      console.error('Failed to load image:', error);
      setImageLoaded(false);
      imageReadyRef.current = false;
    });

    // Handle mouse movement for hover circle
    canvas.on('mouse:move', (event) => {
      if (!imageReadyRef.current || !fabricImageRef.current || !hoverCircleRef.current) {
        return;
      }
      
      const pointer = canvas.getPointer(event.e);
      
      // Move the existing hover circle to cursor position
      hoverCircleRef.current.set({
        left: pointer.x - 6,
        top: pointer.y - 6,
        visible: true
      });
      
      canvas.renderAll();
    });

    // Handle mouse leave to hide hover circle
    canvas.on('mouse:out', () => {
      if (hoverCircleRef.current) {
        hoverCircleRef.current.set({ visible: false });
        canvas.renderAll();
      }
    });

    // Handle canvas clicks to detect text regions
    canvas.on('mouse:down', (event) => {
      if (!imageReadyRef.current || isPanning) return;
      
      const pointer = canvas.getPointer(event.e);
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      
      // Get text regions for this body part
      const textRegions = getTextRegionsForBodyPart(bodyPart);
      
      // Check if click is within any text region
      const clickedRegion = textRegions.find(region => {
        const { x, y, width, height } = region.coordinates;
        return pointer.x >= x && pointer.x <= x + width && 
               pointer.y >= y && pointer.y <= y + height;
      });
      
      if (clickedRegion) {
        // Directly select the detected text
        setSelectedSymptom({ id: clickedRegion.id, text: clickedRegion.text });
        setDetectedText(clickedRegion.text);
        setClickPosition({ x: pointer.x, y: pointer.y });
        
        // Remove any existing markers
        if (highlightCircle) {
          canvas.remove(highlightCircle);
        }

        // Create new marker at click position
        const circle = new Circle({
          left: pointer.x - 12,
          top: pointer.y - 12,
          radius: 12,
          fill: 'rgba(239, 68, 68, 0.8)',
          stroke: '#ffffff',
          strokeWidth: 3,
          selectable: false,
          evented: false
        });

        canvas.add(circle);
        setHighlightCircle(circle);
        canvas.renderAll();
      } else {
        // No text region detected, show generic popover
        const rect = canvasElement.getBoundingClientRect();
        setClickPosition({ x: pointer.x, y: pointer.y });
        setPopoverPosition({ 
          x: rect.left + pointer.x + window.scrollX, 
          y: rect.top + pointer.y + window.scrollY
        });
        setShowSymptomPopover(true);
      }
    });

    // Handle panning with space key or middle mouse
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if ((evt as any).button === 1 || evt.ctrlKey || evt.shiftKey) { // Middle mouse or Ctrl/Shift + click
        isDragging = true;
        canvas.selection = false;
        canvas.setCursor('grabbing');
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        setIsPanning(true);
        evt.preventDefault();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const evt = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      }
    });

    canvas.on('mouse:up', () => {
      if (isDragging) {
        isDragging = false;
        canvas.selection = true;
        canvas.setCursor('crosshair');
        setIsPanning(false);
      }
    });

    // Handle mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.5, Math.min(3, zoom)); // Limit zoom range
      
      const point = new Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, zoom);
      setZoomLevel(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    setFabricCanvas(canvas);

    // Cleanup function
    return () => {
      canvas.dispose();
    };
  }, [open, canvasDimensions, imageUrl]);


  // Handle zoom with Fabric.js integration
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!fabricCanvas) return;

    let newZoom = zoomLevel;
    if (direction === 'in') {
      newZoom = Math.min(zoomLevel * 1.3, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(zoomLevel / 1.3, 0.5);
    } else {
      newZoom = 1;
      // Reset viewport transform for reset
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    }

    setZoomLevel(newZoom);
    
    if (direction !== 'reset') {
      // Get center point of canvas for zoom
      const center = new Point(canvasDimensions.width / 2, canvasDimensions.height / 2);
      fabricCanvas.zoomToPoint(center, newZoom);
    }
    
    fabricCanvas.renderAll();
  };

  // Handle symptom selection from popover
  const handleSymptomClick = (symptom: SymptomItem) => {
    if (!clickPosition || !fabricCanvas) return;
    
    setSelectedSymptom(symptom);
    setShowSymptomPopover(false);
    
    // Remove any existing markers
    if (highlightCircle) {
      fabricCanvas.remove(highlightCircle);
    }

    // Create new marker at click position
    const circle = new Circle({
      left: clickPosition.x - 12,
      top: clickPosition.y - 12,
      radius: 12,
      fill: 'rgba(239, 68, 68, 0.8)',
      stroke: '#ffffff',
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    fabricCanvas.add(circle);
    // No need to move to front as marker is added last
    setHighlightCircle(circle);
    fabricCanvas.renderAll();
  };

  // Submit selection
  const handleSubmit = () => {
    if (selectedSymptom && highlightCircle) {
      onSymptomSubmit({
        id: selectedSymptom.id,
        text: selectedSymptom.text
      });
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedSymptom(null);
    setClickPosition(null);
    if (highlightCircle && fabricCanvas) {
      fabricCanvas.remove(highlightCircle);
      setHighlightCircle(null);
      fabricCanvas.renderAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-screen max-h-screen w-screen h-screen' : 'max-w-[95vw] max-h-[95vh] w-full h-full'} p-0`} 
        aria-describedby="symptom-selector-description"
      >
        <DialogTitle className="sr-only">Universal Symptom Selector - {bodyPart}</DialogTitle>
        <div id="symptom-selector-description" className="sr-only">
          Interactive symptom selector for {bodyPart}. Click anywhere on the image to select symptoms.
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
                  <Button onClick={toggleFullscreen} variant="ghost" size="sm" title="Toggle Fullscreen">
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    <span className="ml-1 text-xs">Fullscreen</span>
                  </Button>
                  <Button onClick={onClose} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Zoom and Pan Controls */}
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
              <div className="border-t pt-2">
                <div className="text-xs text-center bg-background/80 rounded px-2 py-1 mb-1">
                  <Move className="h-3 w-3 mx-auto mb-1" />
                  Drag to Pan
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Ctrl+Drag or Middle Click
                </p>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="flex items-center justify-center h-full pt-16 pb-4">
              <div 
                ref={containerRef}
                className="border-2 border-gray-200 rounded-lg shadow-lg bg-white inline-block select-none relative"
                style={{ 
                  width: canvasDimensions.width, 
                  height: canvasDimensions.height 
                }}
              >
                {/* Loading Overlay */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading image...</p>
                    </div>
                  </div>
                )}
                
                {/* Fabric Canvas - Always rendered */}
                <canvas 
                  ref={canvasRef}
                  className="block cursor-crosshair"
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                />
              </div>
            </div>

            {/* Instructions and Selected Symptom Display */}
            <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur rounded-lg p-4 border max-h-48 overflow-y-auto">
              {!selectedSymptom ? (
                <p className="text-sm text-center">
                  <strong>Click on any text paragraph</strong> to select that specific symptom description
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-center text-green-600">
                    <p><strong>Perfect!</strong> You've selected a symptom and placed a marker.</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 text-primary">Selected Symptom:</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedSymptom.text}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={handleClearSelection}
                    >
                      Clear Selection
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={!selectedSymptom}
                    >
                      Submit Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Selected Symptom Display - Hidden to prevent overlay */}
          <div className={`${isFullscreen ? 'w-0 overflow-hidden' : 'w-0 overflow-hidden'} bg-background border-l flex flex-col`}>
            {selectedSymptom ? (
              /* Always show selected symptom with action buttons */
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
                    
                    <div className="bg-green-50 p-2 rounded-lg">
                      <p className="text-xs text-green-700 text-center">
                        ✓ Location marked on image
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Action Buttons - Always Visible */}
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
                    disabled={!selectedSymptom}
                  >
                    Submit Selection to Know Possible Condition
                  </Button>
                </div>
              </div>
            ) : (
              /* Placeholder when no symptom selected */
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
                  </div>
                  <p className="text-sm">Click on the image to select a symptom</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptom Selection Popover - Fixed positioning */}
        {showSymptomPopover && (
          <div 
            className="fixed z-50 w-80 max-h-96 bg-popover border rounded-md shadow-md p-4"
            style={{
              left: Math.min(popoverPosition.x, window.innerWidth - 320),
              top: Math.min(popoverPosition.y, window.innerHeight - 400),
              maxHeight: '400px'
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Select Your Symptom</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSymptomPopover(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="h-80 mt-2">
                <div className="space-y-1">
                  {symptoms.map((symptom) => (
                    <Button
                      key={symptom.id}
                      variant="ghost"
                      className="w-full h-auto p-2 text-left justify-start whitespace-normal hover:bg-primary/5 text-xs"
                      onClick={() => handleSymptomClick(symptom)}
                    >
                      <span className="leading-relaxed">{symptom.text}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;