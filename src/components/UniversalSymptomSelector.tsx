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
      backgroundColor: '#f8fafc',
      enableRetinaScaling: true
    });

    console.log('🎨 Canvas initialized:', canvasDimensions.width, 'x', canvasDimensions.height);

    // Load image into Fabric canvas
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      console.log('✅ Image loaded into Fabric:', img.width, 'x', img.height);
      
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
      canvas.renderAll();

      console.log('✅ Image added to canvas and scaled');
    }).catch((error) => {
      console.error('❌ Failed to load image into Fabric:', error);
      setImageLoaded(false);
    });

    // Create hover circle that follows cursor
    const createHoverCircle = () => {
      return new Circle({
        radius: 15,
        fill: 'rgba(59, 130, 246, 0.3)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.8
      });
    };

    // Handle mouse movement for hover circle
    canvas.on('mouse:move', (event) => {
      if (!imageLoaded) return;
      
      const pointer = canvas.getPointer(event.e);
      
      // Remove existing hover circle
      if (hoverCircleRef.current) {
        canvas.remove(hoverCircleRef.current);
      }

      // Create and add new hover circle at cursor position
      const newHoverCircle = createHoverCircle();
      newHoverCircle.set({
        left: pointer.x - 15,
        top: pointer.y - 15
      });
      
      canvas.add(newHoverCircle);
      // No need to move to front as hover circle is added last
      hoverCircleRef.current = newHoverCircle;
      canvas.renderAll();
    });

    // Handle mouse leave to remove hover circle
    canvas.on('mouse:out', () => {
      if (hoverCircleRef.current) {
        canvas.remove(hoverCircleRef.current);
        hoverCircleRef.current = null;
        canvas.renderAll();
      }
    });

    // Handle canvas clicks to open symptom popover
    canvas.on('mouse:down', (event) => {
      if (!imageLoaded || isPanning) return;
      
      const pointer = canvas.getPointer(event.e);
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      
      const rect = canvasElement.getBoundingClientRect();
      
      setClickPosition({ x: pointer.x, y: pointer.y });
      setPopoverPosition({ 
        x: rect.left + pointer.x + window.scrollX, 
        y: rect.top + pointer.y + window.scrollY
      });
      setShowSymptomPopover(true);
      
      console.log('✅ Click detected at canvas:', pointer.x, pointer.y);
      console.log('✅ Popover position:', rect.left + pointer.x, rect.top + pointer.y);
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
    console.log('✅ Symptom selected and marker placed:', symptom.text);
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
    setClickPosition(null);
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
                className="border-2 border-gray-200 rounded-lg shadow-lg bg-white inline-block select-none"
              >
                {/* Loading State */}
                {!imageLoaded && (
                  <div className="flex items-center justify-center bg-gray-100" style={{ 
                    width: canvasDimensions.width, 
                    height: canvasDimensions.height 
                  }}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading image...</p>
                    </div>
                  </div>
                )}
                
                {/* Fabric Canvas */}
                <canvas 
                  ref={canvasRef}
                  className="block cursor-crosshair"
                  style={{
                    display: imageLoaded ? 'block' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur rounded-lg p-3 border">
              {!selectedSymptom ? (
                <p className="text-sm text-center">
                  <strong>Click anywhere on the image</strong> to select a symptom that matches your condition
                </p>
              ) : (
                <div className="text-sm text-center text-green-600">
                  <p><strong>Perfect!</strong> You've selected "{selectedSymptom.text}" and placed a marker.</p>
                  <p>Use the buttons on the right to clear or submit your selection.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Selected Symptom Display */}
          <div className={`${isFullscreen ? 'w-1/3' : 'w-96'} bg-background border-l flex flex-col`}>
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