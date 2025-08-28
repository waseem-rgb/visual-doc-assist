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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCircleRef = useRef<Circle | null>(null);
  const fabricImageRef = useRef<FabricImage | null>(null);
  const imageReadyRef = useRef<boolean>(false);
  const selectionMarkerRef = useRef<Circle | null>(null);
  const initializingRef = useRef<boolean>(false);
  
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const blobUrlRef = useRef<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
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

  // Calculate canvas dimensions based on screen size
  const calculateCanvasDimensions = () => {
    const availableWidth = isFullscreen ? window.innerWidth * 0.65 : Math.min(800, window.innerWidth * 0.6);
    const availableHeight = isFullscreen ? window.innerHeight * 0.85 : Math.min(600, window.innerHeight * 0.7);
    
    setCanvasDimensions({
      width: Math.round(availableWidth),
      height: Math.round(availableHeight)
    });
  };

  // Cleanup canvas on unmount only - with proper timing to avoid React conflicts
  useEffect(() => {
    return () => {
      // Delay disposal to let React handle DOM cleanup first
      setTimeout(() => {
        if (fabricCanvas && !fabricCanvas.disposed) {
          try {
            fabricCanvas.dispose();
          } catch (error) {
            console.warn('Canvas disposal error:', error);
          }
        }
      }, 0);
      
      // Cleanup blob URL on unmount
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (error) {
          console.warn('Failed to revoke blob URL on unmount:', error);
        }
      }
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    calculateCanvasDimensions();
  };

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

  // Reset state when dialog closes, imageUrl changes, or bodyPart changes
  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
      setImageFailed(false);
      imageReadyRef.current = false;
      setSelectedSymptom(null);
      selectionMarkerRef.current = null;
      hoverCircleRef.current = null;
      fabricImageRef.current = null;
      setZoomLevel(1);
      setIsFullscreen(true);
      setShowConfirmationPopover(false);
      setClickPosition(null);
      setIsPanning(false);
      setDetectedText(null);
      setSymptomContentData(null);
      setIsLoadingSymptoms(false);
      setIsSubmitted(false);
      initializingRef.current = false;
      
      // Safe canvas disposal - clear the reference first to prevent multiple disposals
      if (fabricCanvas && !fabricCanvas.disposed) {
        const canvasToDispose = fabricCanvas;
        setFabricCanvas(null); // Clear reference immediately
        
        // Dispose safely without interfering with React's DOM cleanup
        setTimeout(() => {
          try {
            canvasToDispose.clear();
            canvasToDispose.dispose();
          } catch (error) {
            console.warn('Canvas disposal error:', error);
          }
        }, 0);
      }
      
      // Clean up blob URL when dialog closes or URL changes (only blob URLs need cleanup)
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (error) {
          console.warn('Failed to revoke blob URL:', error);
        }
        blobUrlRef.current = null;
      }
    }
    
    // Track the current blob URL for cleanup (signed URLs and data URLs don't need cleanup)
    if (imageUrl && imageUrl.startsWith('blob:')) {
      blobUrlRef.current = imageUrl;
    }
  }, [open, imageUrl, bodyPart]);

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

  // Safe canvas initialization with race condition prevention
  useEffect(() => {
    console.log(`🎯 [CANVAS CHECK] Canvas useEffect triggered`);
    console.log(`📋 [PARAMS] open: ${open}, imageUrl: "${imageUrl}", canvasDimensions: ${canvasDimensions.width}x${canvasDimensions.height}`);
    console.log(`🎨 [CANVAS REF] canvasRef.current:`, !!canvasRef.current);
    
    if (!open || !canvasRef.current || !imageUrl || canvasDimensions.width === 0 || canvasDimensions.height === 0) {
      console.log(`❌ [CANVAS SKIP] Skipping canvas init - missing requirements`);
      console.log(`   - open: ${open}`);
      console.log(`   - canvasRef: ${!!canvasRef.current}`);  
      console.log(`   - imageUrl: "${imageUrl}"`);
      console.log(`   - dimensions: ${canvasDimensions.width}x${canvasDimensions.height}`);
      return;
    }

    // Prevent multiple initializations
    if (initializingRef.current) {
      console.log('🔄 Canvas initialization already in progress, skipping');
      return;
    }

    let cleanupTriggered = false;
    initializingRef.current = true;

    console.log('🎯 [SAFE CANVAS INIT] Starting safe canvas initialization');
    console.log('🔗 [IMAGE URL] Full URL:', imageUrl);

    const initCanvas = async () => {
      try {
        // Dispose existing canvas safely
        if (fabricCanvas && !fabricCanvas.disposed) {
          console.log('🧹 [SAFE CLEANUP] Disposing existing canvas');
          const oldCanvas = fabricCanvas;
          setFabricCanvas(null);
          
          // Small delay to let React handle state changes
          await new Promise(resolve => setTimeout(resolve, 10));
          
          if (!cleanupTriggered) {
            oldCanvas.clear();
            oldCanvas.dispose();
          }
        }

        if (cleanupTriggered || !canvasRef.current) {
          console.log('❌ [SAFE INIT] Aborted - cleanup triggered or no canvas ref');
          return;
        }

        // Create new canvas
        console.log('🎨 [SAFE CREATE] Creating new Fabric canvas');
        const newCanvas = new FabricCanvas(canvasRef.current, {
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          selection: false,
          hoverCursor: 'grab',
          moveCursor: 'grab',
          defaultCursor: 'grab',
          backgroundColor: '#f8fafc',
          enableRetinaScaling: true,
          interactive: true,
          allowTouchScrolling: false,
          stopContextMenu: true,
          fireRightClick: false,
          fireMiddleClick: false,
        });

        if (cleanupTriggered) {
          newCanvas.dispose();
          return;
        }

        // Load image
        console.log('🖼️ [SAFE LOAD] Loading image:', imageUrl.substring(0, 50) + '...');
        const img = await FabricImage.fromURL(imageUrl, { 
          crossOrigin: imageUrl.startsWith('http') ? 'anonymous' : undefined 
        });

        if (cleanupTriggered) {
          newCanvas.dispose();
          return;
        }

        // Scale and position image
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

        // Add to canvas
        newCanvas.add(img);
        fabricImageRef.current = img;

        // Create hover circle
        const hoverCircle = new Circle({
          radius: 3,
          fill: 'rgba(59, 130, 246, 0.4)',
          stroke: '#3b82f6',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          opacity: 0.9,
          visible: false
        });
        newCanvas.add(hoverCircle);
        hoverCircleRef.current = hoverCircle;

        // Add event handlers
        setupCanvasEvents(newCanvas);

        if (!cleanupTriggered) {
          setFabricCanvas(newCanvas);
          setImageLoaded(true);
          imageReadyRef.current = true;
          console.log('✅ [SAFE SUCCESS] Canvas initialized successfully');
        }

      } catch (error) {
        console.error('💥 [SAFE ERROR] Canvas initialization failed:', error);
        if (!cleanupTriggered) {
          setImageFailed(true);
          toast({
            title: "Image Loading Error",
            description: "The image couldn't be loaded, but you can still select symptoms from the list.",
            variant: "destructive"
          });
        }
      } finally {
        initializingRef.current = false;
      }
    };

    // Setup canvas event handlers
    const setupCanvasEvents = (canvas: FabricCanvas) => {
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      // Mouse movement for hover
      canvas.on('mouse:move', (event) => {
        if (!imageReadyRef.current || !fabricImageRef.current || !hoverCircleRef.current || cleanupTriggered) {
          return;
        }
        
        if (isDragging) {
          hoverCircleRef.current.set({ visible: false });
          canvas.renderAll();
          return;
        }
        
        const pointer = canvas.getPointer(event.e);
        const img = fabricImageRef.current;
        const imgLeft = img.left!;
        const imgTop = img.top!;
        const imgWidth = img.width! * img.scaleX!;
        const imgHeight = img.height! * img.scaleY!;
        
        const isWithinImage = pointer.x >= imgLeft && 
                             pointer.x <= imgLeft + imgWidth && 
                             pointer.y >= imgTop && 
                             pointer.y <= imgTop + imgHeight;
        
        if (isWithinImage) {
          hoverCircleRef.current.set({
            left: pointer.x - 3,
            top: pointer.y - 3,
            visible: true
          });
          canvas.setCursor('crosshair');
        } else {
          hoverCircleRef.current.set({ visible: false });
          canvas.setCursor('default');
        }
        
        canvas.renderAll();
      });

      // Mouse down for dragging/clicking
      canvas.on('mouse:down', (event) => {
        const pointer = canvas.getPointer(event.e);
        const evt = event.e as MouseEvent;
        
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        isDragging = false;
      });

      // Mouse move for dragging
      canvas.on('mouse:move', (event) => {
        const evt = event.e as MouseEvent;
        
        if (evt.buttons === 1) { // Left mouse button pressed
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

      // Zoom on mouse wheel
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

    initCanvas();

    return () => {
      console.log('🧹 [SAFE CLEANUP] Cleanup triggered');
      cleanupTriggered = true;
      initializingRef.current = false;
    };
  }, [open, imageUrl, canvasDimensions]);

  // Handle canvas click
  const handleCanvasClick = (pointer: { x: number; y: number }) => {
    console.log('🖱️ Click detected at:', pointer);
    
    // Find matching symptom region
    const matchedRegion = textRegions.find(region => {
      const imgBounds = fabricImageRef.current;
      if (!imgBounds) return false;
      
      const imgLeft = imgBounds.left!;
      const imgTop = imgBounds.top!;
      const imgWidth = imgBounds.width! * imgBounds.scaleX!;
      const imgHeight = imgBounds.height! * imgBounds.scaleY!;
      
      const regionLeft = imgLeft + (region.coordinates.xPct / 100) * imgWidth;
      const regionTop = imgTop + (region.coordinates.yPct / 100) * imgHeight;
      const regionWidth = (region.coordinates.wPct / 100) * imgWidth;
      const regionHeight = (region.coordinates.hPct / 100) * imgHeight;
      
      return pointer.x >= regionLeft && 
             pointer.x <= regionLeft + regionWidth &&
             pointer.y >= regionTop && 
             pointer.y <= regionTop + regionHeight;
    });

    if (matchedRegion) {
      setSelectedSymptom({
        id: matchedRegion.id,
        text: matchedRegion.text,
        diagnosis: matchedRegion.diagnosis,
        summary: matchedRegion.summary
      });
    } else {
      // Show fallback options
      setSelectedSymptom(null);
    }

    // Position and show confirmation popover
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const popoverX = Math.max(20, Math.min(rect.left + pointer.x + window.scrollX, window.innerWidth - 340));
      const popoverY = Math.max(20, Math.min(rect.top + pointer.y + window.scrollY, window.innerHeight - 220));
      
      setClickPosition(pointer);
      setPopoverPosition({ x: popoverX, y: popoverY });
      setShowConfirmationPopover(true);
    }
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
          <div className={`${isFullscreen ? 'w-2/3' : 'w-3/5'} relative bg-muted/20 border-r border-border`}>
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
              <div ref={containerRef} className="flex-1 relative overflow-hidden">
                {!imageLoaded && !imageFailed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground">Loading interactive diagram...</p>
                    </div>
                  </div>
                )}

                {imageFailed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-foreground">Image not available</p>
                        <p className="text-muted-foreground">Select a symptom from the list on the right</p>
                      </div>
                    </div>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  className={`block ${!imageLoaded ? 'hidden' : ''}`}
                  style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
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
          <div className={`${isFullscreen ? 'w-1/3' : 'w-2/5'} bg-background border-l border-border flex flex-col`}>
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Available Symptoms</h3>
              <p className="text-sm text-muted-foreground">
                Select a symptom from the list below or click on the image
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              {isLoadingSymptoms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {symptoms.map((symptom) => (
                    <Card
                      key={symptom.id}
                      className="cursor-pointer border border-border hover:border-primary/50 transition-colors"
                      onClick={() => handleFallbackSymptomClick(symptom)}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm text-foreground leading-relaxed">
                          {symptom.text}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
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
                    {symptoms.slice(0, 3).map((symptom) => (
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