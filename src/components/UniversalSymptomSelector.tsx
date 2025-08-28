import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, Move } from "lucide-react";
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
  const hoverCircleRef = useRef<Circle | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomItem | null>(null);
  const [highlightCircle, setHighlightCircle] = useState<Circle | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to fullscreen
  const [showSymptomPopover, setShowSymptomPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Handle image load event with dynamic sizing for fullscreen desktop
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.log('✅ Image loaded successfully:', img.naturalWidth, 'x', img.naturalHeight);
    
    // Calculate dynamic display dimensions for fullscreen desktop coverage
    const availableWidth = isFullscreen ? window.innerWidth * 0.65 : Math.min(800, window.innerWidth * 0.6);
    const availableHeight = isFullscreen ? window.innerHeight * 0.85 : Math.min(600, window.innerHeight * 0.7);
    
    let displayWidth = img.naturalWidth;
    let displayHeight = img.naturalHeight;
    
    // Scale to fit available space while maintaining aspect ratio
    const widthRatio = availableWidth / displayWidth;
    const heightRatio = availableHeight / displayHeight;
    const scale = Math.min(widthRatio, heightRatio, 1.2); // Allow slight upscaling for better desktop coverage
    
    displayWidth = Math.round(displayWidth * scale);
    displayHeight = Math.round(displayHeight * scale);
    
    setDisplayDimensions({
      width: displayWidth,
      height: displayHeight
    });
    
    setImageLoaded(true);
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
      hoverCircleRef.current = null;
      setZoomLevel(1);
      setIsFullscreen(true); // Keep fullscreen as default
      setShowSymptomPopover(false);
      setClickPosition(null);
      setIsPanning(false);
      setPanOffset({ x: 0, y: 0 });
      if (fabricCanvas) {
        fabricCanvas.dispose();
        setFabricCanvas(null);
      }
    }
  }, [open]);

  // Handle panning functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey) { // Middle mouse or Ctrl+click for panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Add global mouse event listeners for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, lastPanPoint]);

  // Initialize Fabric canvas after image loads and DOM is ready
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || displayDimensions.width === 0 || displayDimensions.height === 0) {
      return;
    }

    // Dispose existing canvas if any
    if (fabricCanvas) {
      fabricCanvas.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: displayDimensions.width,
      height: displayDimensions.height,
      selection: false,
      hoverCursor: 'crosshair',
      moveCursor: 'crosshair',
      backgroundColor: 'transparent',
      enableRetinaScaling: true
    });

    // Create hover circle that follows cursor
    const createHoverCircle = () => {
      return new Circle({
        radius: 20 / zoomLevel, // Scale with zoom for constant on-screen size
        fill: 'rgba(59, 130, 246, 0.3)',
        stroke: '#3b82f6',
        strokeWidth: 2 / zoomLevel, // Scale stroke with zoom
        selectable: false,
        evented: false,
        opacity: 0.8
      });
    };

    // Handle mouse movement for hover circle
    canvas.on('mouse:move', (event) => {
      const pointer = canvas.getPointer(event.e);
      
      // Remove existing hover circle
      if (hoverCircleRef.current) {
        canvas.remove(hoverCircleRef.current);
      }

      // Create and add new hover circle at cursor position
      const newHoverCircle = createHoverCircle();
      newHoverCircle.set({
        left: pointer.x - (20 / zoomLevel),
        top: pointer.y - (20 / zoomLevel)
      });
      
      canvas.add(newHoverCircle);
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

    setFabricCanvas(canvas);
    console.log('🎨 Canvas initialized:', displayDimensions.width, 'x', displayDimensions.height);

    // Cleanup function
    return () => {
      canvas.dispose();
    };
  }, [imageLoaded, displayDimensions, zoomLevel]);

  // Handle window resize for fullscreen mode
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen && imageRef.current) {
        handleImageLoad({ currentTarget: imageRef.current } as any);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

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
    }

    setZoomLevel(newZoom);
    
    // Apply zoom to Fabric.js canvas and reset viewport transform
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.setViewportTransform([newZoom, 0, 0, newZoom, 0, 0]);
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
      left: clickPosition.x - (15 / zoomLevel),
      top: clickPosition.y - (15 / zoomLevel),
      radius: 15 / zoomLevel, // Scale with zoom for constant on-screen size
      fill: 'rgba(239, 68, 68, 0.8)',
      stroke: '#ffffff',
      strokeWidth: 3 / zoomLevel, // Scale stroke with zoom
      selectable: false,
      evented: false
    });

    fabricCanvas.add(circle);
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

            {/* Canvas Container - Optimized for Desktop Fullscreen */}
            <div className="flex items-center justify-center h-full pt-16 pb-4 overflow-auto">
              <div 
                className="overflow-auto max-h-full max-w-full p-2"
                style={{
                  minHeight: 'fit-content',
                  minWidth: 'fit-content'
                }}
              >
                <div 
                  ref={containerRef}
                  className="relative border-2 border-gray-200 rounded-lg shadow-lg bg-white inline-block select-none"
                  style={{ 
                    transformOrigin: 'center',
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                    cursor: isPanning ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
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
                
                 {/* Overlay Canvas for Hovering Circle and Markers */}
                 {imageLoaded && (
                   <canvas 
                     ref={canvasRef}
                     className="absolute top-0 left-0 pointer-events-auto cursor-crosshair"
                     style={{
                       width: displayDimensions.width,
                       height: displayDimensions.height,
                       zIndex: 50 // Higher z-index to ensure it appears above the image
                     }}
                     onMouseEnter={() => console.log('🖱️ Mouse entered canvas')}
                     onMouseLeave={() => console.log('🖱️ Mouse left canvas')}
                     onClick={() => console.log('🖱️ Canvas clicked (DOM event)')}
                   />
                 )}
                </div>
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