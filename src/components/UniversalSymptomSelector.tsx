import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, Move, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Canvas as FabricCanvas, Circle, FabricImage, Point } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSymptomContentForBodyPart, type SymptomContent } from "@/services/symptomService";
import { SafeCanvasWrapper } from "./SafeCanvasWrapper";

interface SymptomItem {
  id: string;
  text: string;
  category?: string;
  diagnosis?: string;
  summary?: string;
}

interface TextRegion {
  id: string;
  text: string;
  diagnosis: string;
  summary: string;
  coordinates: {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
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
  const selectionMarkerRef = useRef<Circle | null>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fabricImageRef = useRef<FabricImage | null>(null);
  const textRegionsRef = useRef<TextRegion[]>([]);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [fabricImage, setFabricImage] = useState<FabricImage | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showConfirmationPopover, setShowConfirmationPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [symptomContentData, setSymptomContentData] = useState<SymptomContent | null>(null);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Get symptom content for current body part
  const textRegions = symptomContentData?.regions || [];
  const hasRegions = textRegions.length > 0;
  
  // Compute available symptoms - prioritize Supabase data over props
  const availableSymptoms = symptomContentData?.fallbackSymptoms?.length 
    ? symptomContentData.fallbackSymptoms 
    : symptoms;
  
  // Log which symptom list is being used for debugging
  console.log(`🔍 [UniversalSymptomSelector] Body part: ${bodyPart}, Using ${symptomContentData?.fallbackSymptoms?.length ? 'Supabase' : 'prop'} symptoms (${availableSymptoms.length} items)`);
  console.log(`📋 [UniversalSymptomSelector] Available symptoms:`, availableSymptoms.map(s => s.text));

  // Calculate canvas dimensions based on actual container size
  const calculateCanvasDimensions = () => {
    if (!canvasContainerRef.current) {
      // Fallback to screen-based calculation
      const availableWidth = isFullscreen ? window.innerWidth * 0.85 : Math.min(1000, window.innerWidth * 0.75);
      const availableHeight = isFullscreen ? window.innerHeight * 0.75 : Math.min(600, window.innerHeight * 0.65);
      
      setCanvasDimensions({
        width: Math.round(availableWidth),
        height: Math.round(availableHeight)
      });
      return;
    }

    // Use actual container dimensions
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    console.log('📐 [UniversalSymptomSelector] Container dimensions:', containerRect.width, 'x', containerRect.height);
    
    if (containerRect.width > 0 && containerRect.height > 0) {
      setCanvasDimensions({
        width: Math.floor(containerRect.width),
        height: Math.floor(containerRect.height)
      });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    calculateCanvasDimensions();
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
      setImageFailed(false);
      setSelectedSymptom(null);
      setZoomLevel(1);
      setIsFullscreen(true);
      setShowConfirmationPopover(false);
      setClickPosition(null);
      setIsPanning(false);
      setDetectedText(null);
      setSymptomContentData(null);
      setIsLoadingSymptoms(false);
      setIsSubmitted(false);
      setFabricCanvas(null);
      setFabricImage(null);
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

  // Load symptom data when dialog opens or body part changes
  useEffect(() => {
    if (open && bodyPart) {
      setIsLoadingSymptoms(true);
      getSymptomContentForBodyPart(bodyPart)
        .then((data) => {
          setSymptomContentData(data);
          setIsLoadingSymptoms(false);
        })
        .catch((error) => {
          console.error('Failed to load symptom data:', error);
          setSymptomContentData(null);
          setIsLoadingSymptoms(false);
        });
    }
  }, [open, bodyPart]);

  // Reset selected symptom when body part changes
  useEffect(() => {
    setSelectedSymptom(null);
    setShowConfirmationPopover(false);
    setClickPosition(null);
    if (selectionMarkerRef.current && fabricCanvas) {
      fabricCanvas.remove(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
      fabricCanvas.renderAll();
    }
  }, [bodyPart]);

  // Update refs when data changes
  useEffect(() => {
    textRegionsRef.current = textRegions;
  }, [textRegions]);

  // Canvas event handlers
  const handleCanvasReady = (canvas: FabricCanvas) => {
    console.log('✅ [SAFE] Canvas is ready for interaction');
    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);
    
    // Add event listeners
    setupCanvasEvents(canvas);
  };

  const handleImageLoaded = (canvas: FabricCanvas, image: FabricImage) => {
    console.log('✅ [SAFE] Image loaded successfully');
    fabricImageRef.current = image;
    setFabricImage(image);
    setImageLoaded(true);
    setImageFailed(false);
  };

  const handleCanvasError = (error: string) => {
    console.error('💥 [SAFE] Canvas error:', error);
    setImageFailed(true);
    setImageLoaded(false);
    toast({
      title: "Canvas Error",
      description: error,
      variant: "destructive"
    });
  };

  const setupCanvasEvents = (canvas: FabricCanvas) => {
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    let hoverIndicator: Circle | null = null;

    // Mouse down
    canvas.on('mouse:down', (event) => {
      const evt = event.e as MouseEvent;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      isDragging = false;
    });

    // Mouse move for dragging and hover effects
    canvas.on('mouse:move', (event) => {
      const evt = event.e as MouseEvent;
      const pointer = canvas.getPointer(event.e);
      
      if (evt.buttons === 1) {
        const deltaX = evt.clientX - lastPosX;
        const deltaY = evt.clientY - lastPosY;
        
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          isDragging = true;
          const vpt = canvas.viewportTransform!;
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          canvas.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      } else {
        // Handle hover effects when not dragging
        handleCanvasHover(pointer, canvas);
      }
    });

    // Mouse up for click detection
    canvas.on('mouse:up', (event) => {
      if (!isDragging) {
        const pointer = canvas.getPointer(event.e);
        handleCanvasClick(pointer);
      }
      isDragging = false;
    });

    // Helper function for hover effects
    const handleCanvasHover = (pointer: { x: number; y: number }, canvas: FabricCanvas) => {
      // Use refs for stable access to current data
      const currentRegions = textRegionsRef.current;
      const currentImage = fabricImageRef.current;
      
      // Find matching symptom region
      const matchedRegion = currentRegions.find(region => {
        if (!currentImage) return false;
        
        const imgLeft = currentImage.left!;
        const imgTop = currentImage.top!;
        const imgWidth = currentImage.width! * currentImage.scaleX!;
        const imgHeight = currentImage.height! * currentImage.scaleY!;
        
        const regionLeft = imgLeft + (region.coordinates.xPct / 100) * imgWidth;
        const regionTop = imgTop + (region.coordinates.yPct / 100) * imgHeight;
        const regionWidth = (region.coordinates.wPct / 100) * imgWidth;
        const regionHeight = (region.coordinates.hPct / 100) * imgHeight;
        
        const isInRegion = pointer.x >= regionLeft && 
               pointer.x <= regionLeft + regionWidth &&
               pointer.y >= regionTop && 
               pointer.y <= regionTop + regionHeight;
        
        if (isInRegion) {
          console.log('🎯 [HOVER] Found region:', region.text, 'at coords:', {
            pointer, 
            region: { left: regionLeft, top: regionTop, width: regionWidth, height: regionHeight }
          });
        }
        
        return isInRegion;
      });

      // Remove existing hover indicator
      if (hoverIndicator) {
        canvas.remove(hoverIndicator);
        hoverIndicator = null;
      }

      // Add new hover indicator if hovering over a region
      if (matchedRegion && !isSubmitted) {
        console.log('🔵 [HOVER] Creating blue dot at:', pointer);
        hoverIndicator = new Circle({
          left: pointer.x - 8,
          top: pointer.y - 8,
          radius: 8,
          fill: 'rgba(59, 130, 246, 0.9)',
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false
        });
        
        canvas.add(hoverIndicator);
        canvas.bringObjectToFront(hoverIndicator);
        canvas.requestRenderAll();
        
        // Change cursor to pointer
        canvas.defaultCursor = 'pointer';
      } else {
        canvas.defaultCursor = 'default';
      }
    };

    // Zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.5, Math.min(3, zoom));
      
      const point = new Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, zoom);
      setZoomLevel(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  };

  // Handle canvas click
  const handleCanvasClick = (pointer: { x: number; y: number }) => {
    console.log('🖱️ Click detected at:', pointer);
    
    // Use refs for stable access to current data
    const currentRegions = textRegionsRef.current;
    const currentImage = fabricImageRef.current;
    
    // Find matching symptom region
    const matchedRegion = currentRegions.find(region => {
      if (!currentImage) return false;
      
      const imgLeft = currentImage.left!;
      const imgTop = currentImage.top!;
      const imgWidth = currentImage.width! * currentImage.scaleX!;
      const imgHeight = currentImage.height! * currentImage.scaleY!;
      
      const regionLeft = imgLeft + (region.coordinates.xPct / 100) * imgWidth;
      const regionTop = imgTop + (region.coordinates.yPct / 100) * imgHeight;
      const regionWidth = (region.coordinates.wPct / 100) * imgWidth;
      const regionHeight = (region.coordinates.hPct / 100) * imgHeight;
      
      const isInRegion = pointer.x >= regionLeft && 
             pointer.x <= regionLeft + regionWidth &&
             pointer.y >= regionTop && 
             pointer.y <= regionTop + regionHeight;
      
      if (isInRegion) {
        console.log('🎯 [CLICK] Found region:', region.text);
      }
      
      return isInRegion;
    });

    if (matchedRegion) {
      console.log('✅ [CLICK] Selected region:', matchedRegion.text);
      setSelectedSymptom({
        id: matchedRegion.id,
        text: matchedRegion.text,
        diagnosis: matchedRegion.diagnosis,
        summary: matchedRegion.summary
      });
    } else {
      console.log('❌ [CLICK] No region found at click position');
      setSelectedSymptom(null);
    }

    // Position and show confirmation popover  
    setClickPosition(pointer);
    setPopoverPosition({ 
      x: Math.min(window.innerWidth / 2, window.innerWidth - 340), 
      y: Math.min(window.innerHeight / 2, window.innerHeight - 220) 
    });
    setShowConfirmationPopover(true);
  };

  // Handle zoom controls
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!fabricCanvas) return;

    let newZoom = zoomLevel;
    if (direction === 'in') {
      newZoom = Math.min(zoomLevel * 1.3, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(zoomLevel / 1.3, 0.5);
    } else {
      newZoom = 1;
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    }

    setZoomLevel(newZoom);
    
    if (direction !== 'reset') {
      const center = new Point(canvasDimensions.width / 2, canvasDimensions.height / 2);
      fabricCanvas.zoomToPoint(center, newZoom);
    }
    
    fabricCanvas.renderAll();
  };

  // Handle symptom confirmation
  const handleConfirmSelection = () => {
    if (!selectedSymptom) return;
    
    setShowConfirmationPopover(false);
    setIsSubmitted(true);
    
    // Add selection marker
    if (clickPosition && fabricCanvas) {
      if (selectionMarkerRef.current) {
        fabricCanvas.remove(selectionMarkerRef.current);
      }

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
      selectionMarkerRef.current = circle;
      fabricCanvas.renderAll();
    }
    
    onSymptomSubmit({ id: selectedSymptom.id, text: selectedSymptom.text });
  };

  // Handle fallback symptom selection
  const handleFallbackSymptomClick = (symptom: SymptomItem) => {
    setSelectedSymptom(symptom);
    setShowConfirmationPopover(false);
    setIsSubmitted(true);
    onSymptomSubmit({ id: symptom.id, text: symptom.text });
  };

  const handleSubmit = () => {
    if (selectedSymptom) {
      handleConfirmSelection();
    }
  };

  const handleClearSelection = () => {
    setShowConfirmationPopover(false);
    setSelectedSymptom(null);
    setClickPosition(null);
    
    if (selectionMarkerRef.current && fabricCanvas) {
      fabricCanvas.remove(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
      fabricCanvas.renderAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-none ${isFullscreen ? 'w-[95vw] h-[95vh]' : 'w-[90vw] h-[85vh]'} p-0 bg-background border-border`}
        aria-describedby="symptom-selector-description"
      >
        <DialogTitle className="sr-only">
          Select Your {bodyPart} Symptom - Interactive Body Map
        </DialogTitle>
        
        <div id="symptom-selector-description" className="sr-only">
          Select a symptom by clicking on the body diagram or choosing from the symptom list. Use zoom and pan controls to navigate the image.
        </div>

        <div className="flex h-full">
          {/* Left Side - Canvas */}
          <div className={`${isFullscreen ? 'w-5/6' : 'w-4/5'} relative bg-muted/20 border-r border-border`}>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Select Your {bodyPart} Symptom</h2>
                  <p className="text-sm text-muted-foreground">
                    Patient: {patientData.name} | Age: {patientData.age} | Gender: {patientData.gender}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-foreground border-border hover:bg-muted"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    {isFullscreen ? 'Minimize' : 'Fullscreen'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="pt-20 h-full flex flex-col">
              <div 
                ref={canvasContainerRef}
                className="flex-1 relative overflow-hidden"
                style={{ minHeight: '400px' }}
              >
                <SafeCanvasWrapper
                  imageUrl={imageUrl}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  onCanvasReady={handleCanvasReady}
                  onImageLoaded={handleImageLoaded}
                  onError={handleCanvasError}
                />
              </div>

              {/* Controls */}
              {imageLoaded && (
                <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-background/95 backdrop-blur rounded-lg p-2 border border-border shadow-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('out')}
                    className="text-foreground border-border hover:bg-muted"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-foreground px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('in')}
                    className="text-foreground border-border hover:bg-muted"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('reset')}
                    className="text-foreground border-border hover:bg-muted"
                  >
                    Reset
                  </Button>
                  <div className="flex items-center space-x-2 ml-4 text-sm text-muted-foreground">
                    <Move className="h-4 w-4" />
                    <span>Drag to Pan</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Left Click + Drag
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="absolute top-24 left-4 bg-background/95 backdrop-blur rounded-lg p-3 border border-border shadow-lg max-w-xs">
                <p className="text-sm text-muted-foreground">
                  {hasRegions 
                    ? "Click on the image to select a symptom area, or choose from the list on the right."
                    : "Select a symptom from the list on the right or click anywhere on the image."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Symptom List */}
          <div className={`${isFullscreen ? 'w-1/6' : 'w-1/5'} bg-background border-l border-border flex flex-col min-h-0`}>
            <div className="p-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground mb-2">Available Symptoms</h3>
              <p className="text-sm text-muted-foreground">
                Select a symptom from the list below or click on the image
              </p>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {isLoadingSymptoms ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableSymptoms.map((symptom) => (
                        <Card
                          key={symptom.id}
                          className="cursor-pointer border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 active:scale-95"
                          onClick={() => handleFallbackSymptomClick(symptom)}
                        >
                          <CardContent className="p-3">
                            <p className="text-sm text-foreground leading-relaxed">
                              {symptom.text}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Confirmation Popover */}
        {showConfirmationPopover && (
          <div
            className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm"
            style={{
              left: popoverPosition.x,
              top: popoverPosition.y,
            }}
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">
                {selectedSymptom ? 'Confirm Selection' : 'Select Symptom'}
              </h4>
              
              {selectedSymptom ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">{selectedSymptom.text}</p>
                  {selectedSymptom.diagnosis && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Diagnosis:</strong> {selectedSymptom.diagnosis}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleConfirmSelection}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClearSelection}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No specific symptom found for this area. Choose from common symptoms:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableSymptoms.slice(0, 3).map((symptom) => (
                      <button
                        key={symptom.id}
                        className="block w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors"
                        onClick={() => handleFallbackSymptomClick(symptom)}
                      >
                        {symptom.text.substring(0, 60)}...
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={handleClearSelection}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;