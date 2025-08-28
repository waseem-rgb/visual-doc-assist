import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, Move } from "lucide-react";
import { Canvas as FabricCanvas, Circle, FabricImage, Point } from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSymptomContentForBodyPart, type SymptomContent } from "@/services/symptomService";

interface SymptomItem {
  id: string;
  text: string;
  category?: string;
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
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showConfirmationPopover, setShowConfirmationPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [symptomContentData, setSymptomContentData] = useState<SymptomContent | null>(null);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);

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

  // Cleanup canvas on unmount only
  useEffect(() => {
    return () => {
      if (fabricCanvas && !fabricCanvas.disposed) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.warn('Canvas disposal error:', error);
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
      if (fabricCanvas && !fabricCanvas.disposed) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.warn('Canvas disposal error:', error);
        }
        setFabricCanvas(null);
      }
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

  // Initialize Fabric canvas and load image
  useEffect(() => {
    if (!open || !canvasRef.current || canvasDimensions.width === 0 || canvasDimensions.height === 0) {
      return;
    }

    // Dispose existing canvas if any
    if (fabricCanvas && !fabricCanvas.disposed) {
      try {
        fabricCanvas.dispose();
      } catch (error) {
        console.warn('Canvas disposal error:', error);
      }
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
        radius: 3,
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
        left: pointer.x - 3,
        top: pointer.y - 3,
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

    // Handle panning and clicking with single mouse:down handler
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    const mouseDownPositionRef = { current: null as { x: number; y: number } | null };

    canvas.on('mouse:down', (event) => {
      if (!imageReadyRef.current) return;
      
      const pointer = canvas.getPointer(event.e);
      const evt = event.e as MouseEvent;
      
      // Check for panning (middle mouse, Ctrl, or Shift)
      if ((evt as any).button === 1 || evt.ctrlKey || evt.shiftKey) {
        isDragging = true;
        canvas.selection = false;
        canvas.setCursor('grabbing');
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        setIsPanning(true);
        evt.preventDefault();
        return;
      }
      
      // Store mouse down position for click detection
      mouseDownPositionRef.current = { x: pointer.x, y: pointer.y };
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

    canvas.on('mouse:up', (event) => {
      const pointer = canvas.getPointer(event.e);
      
      if (isDragging) {
        isDragging = false;
        canvas.selection = true;
        canvas.setCursor('crosshair');
        setIsPanning(false);
        return;
      }
      
      // Check if this was a click (not a drag) by measuring movement
      const mouseDown = mouseDownPositionRef.current;
      if (!mouseDown) return;
      
      const movement = Math.sqrt(
        Math.pow(pointer.x - mouseDown.x, 2) + Math.pow(pointer.y - mouseDown.y, 2)
      );
      
      // Only process as click if movement is less than threshold (5px)
      if (movement < 5) {
        // Check if click is within any text region using normalized coordinates
        const clickedRegion = textRegions.find(region => {
          if (!fabricImageRef.current) return false;
          
          const img = fabricImageRef.current;
          const imgLeft = img.left!;
          const imgTop = img.top!;
          const imgWidth = img.width! * img.scaleX!;
          const imgHeight = img.height! * img.scaleY!;
          
          // Convert normalized coordinates to canvas coordinates
          const x = imgLeft + (region.coordinates.xPct / 100) * imgWidth;
          const y = imgTop + (region.coordinates.yPct / 100) * imgHeight;
          const width = (region.coordinates.wPct / 100) * imgWidth;
          const height = (region.coordinates.hPct / 100) * imgHeight;
          
          return pointer.x >= x && pointer.x <= x + width && 
                 pointer.y >= y && pointer.y <= y + height;
        });
        
        if (clickedRegion) {
          // Remove any existing marker
          if (selectionMarkerRef.current) {
            canvas.remove(selectionMarkerRef.current);
            selectionMarkerRef.current = null;
          }
          
          // Directly select the detected text
          setSelectedSymptom({ id: clickedRegion.id, text: clickedRegion.text });
          setDetectedText(clickedRegion.text);
          setClickPosition({ x: pointer.x, y: pointer.y });
          
          // Show confirmation popover
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            setPopoverPosition({ 
              x: rect.left + pointer.x + window.scrollX, 
              y: rect.top + pointer.y + window.scrollY
            });
          }
          setShowConfirmationPopover(true);
          
        } else if (hasRegions) {
          // No text region detected but regions exist - do nothing, just show instruction
          setClickPosition(null);
          setShowConfirmationPopover(false);
        } else {
          // No regions exist, show fallback options
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            setClickPosition({ x: pointer.x, y: pointer.y });
            setPopoverPosition({ 
              x: rect.left + pointer.x + window.scrollX, 
              y: rect.top + pointer.y + window.scrollY
            });
            setShowConfirmationPopover(true);
          }
        }
      }
      
      mouseDownPositionRef.current = null;
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
      if (canvas && !canvas.disposed) {
        try {
          canvas.dispose();
        } catch (error) {
          console.warn('Canvas cleanup disposal error:', error);
        }
      }
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

  // Handle symptom confirmation
  const handleConfirmSelection = () => {
    if (!clickPosition || !fabricCanvas || !selectedSymptom) return;
    
    setShowConfirmationPopover(false);
    
    // Remove any existing marker
    if (selectionMarkerRef.current) {
      fabricCanvas.remove(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
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
      evented: false,
      data: { type: 'selection-marker' }
    });

    fabricCanvas.add(circle);
    selectionMarkerRef.current = circle;
    fabricCanvas.renderAll();
  };

  // Handle symptom selection from fallback list (when no regions)
  const handleFallbackSymptomClick = (symptom: SymptomItem) => {
    if (!clickPosition || !fabricCanvas) return;
    
    setSelectedSymptom(symptom);
    setShowConfirmationPopover(false);
    
    // Remove any existing marker
    if (selectionMarkerRef.current) {
      fabricCanvas.remove(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
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
      evented: false,
      data: { type: 'selection-marker' }
    });

    fabricCanvas.add(circle);
    selectionMarkerRef.current = circle;
    fabricCanvas.renderAll();
  };

  // Submit selection
  const handleSubmit = () => {
    if (selectedSymptom && selectionMarkerRef.current) {
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
    setShowConfirmationPopover(false);
    if (selectionMarkerRef.current && fabricCanvas) {
      fabricCanvas.remove(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
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
                {(!imageLoaded || isLoadingSymptoms) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        {isLoadingSymptoms ? 'Loading symptom data...' : 'Loading image...'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Fabric Canvas - Always rendered */}
                <canvas 
                  ref={canvasRef}
                  className="block cursor-crosshair"
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  key={`canvas-${bodyPart}-${imageUrl}`}
                />
              </div>
            </div>

            {/* Instructions and Selected Symptom Display */}
            <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur rounded-lg p-4 border max-h-48 overflow-y-auto">
              {!selectedSymptom ? (
                !hasRegions ? (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 text-center">
                      <strong>No specific regions mapped for {bodyPart}</strong><br />
                      Click anywhere on the image to select from available symptoms.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-center">
                    <strong>Click on any text paragraph</strong> to select that specific symptom description
                  </p>
                )
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
                    {detectedText && detectedText !== selectedSymptom.text && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium text-primary">Full Description:</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {detectedText}
                        </p>
                      </div>
                    )}
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

        </div>

        {/* Confirmation Popover - Show only the selected paragraph or fallback options */}
        {showConfirmationPopover && (
          <div 
            className="fixed z-50 w-80 bg-popover border rounded-md shadow-md p-4"
            style={{
              left: Math.min(popoverPosition.x, window.innerWidth - 320),
              top: Math.min(popoverPosition.y, window.innerHeight - 200)
            }}
          >
            {selectedSymptom ? (
              // Show confirmation for detected paragraph
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-green-600">Paragraph Selected</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowConfirmationPopover(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedSymptom.text}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowConfirmationPopover(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1"
                    onClick={handleConfirmSelection}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              // Show fallback symptoms when no regions exist
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Select Your Symptom</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowConfirmationPopover(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <ScrollArea className="h-64 mt-2">
                  <div className="space-y-1">
                    {/* Show database fallback symptoms first */}
                    {symptomContentData?.fallbackSymptoms?.map((symptom) => (
                      <Button
                        key={symptom.id}
                        variant="ghost"
                        className="w-full h-auto p-2 text-left justify-start whitespace-normal hover:bg-primary/5 text-xs"
                        onClick={() => handleFallbackSymptomClick(symptom)}
                      >
                        <span className="leading-relaxed">{symptom.text}</span>
                      </Button>
                    ))}
                    {/* Show passed symptoms as backup */}
                    {symptoms.map((symptom) => (
                      <Button
                        key={symptom.id}
                        variant="ghost"
                        className="w-full h-auto p-2 text-left justify-start whitespace-normal hover:bg-primary/5 text-xs"
                        onClick={() => handleFallbackSymptomClick(symptom)}
                      >
                        <span className="leading-relaxed">{symptom.text}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;