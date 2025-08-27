import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  symptomText: string;
}

interface FullscreenSymptomLightboxProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  textAreas: TextArea[];
  onSymptomSubmit: (symptom: {id: string, text: string}) => void;
}

const FullscreenSymptomLightbox = ({
  open,
  onClose,
  imageUrl,
  bodyPart,
  patientData,
  textAreas,
  onSymptomSubmit
}: FullscreenSymptomLightboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<{id: string, text: string} | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [currentHoveredArea, setCurrentHoveredArea] = useState<string | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const lastMouseMoveTime = useRef(0);

  // Handle image load to get natural dimensions
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
      
      // Get current display size
      const rect = imageRef.current.getBoundingClientRect();
      setImageDisplaySize({
        width: rect.width,
        height: rect.height
      });
    }
  };

  // Update display size on zoom changes
  useEffect(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setImageDisplaySize({
        width: rect.width,
        height: rect.height
      });
    }
  }, [zoomLevel]);

  // Ultra-fast mouse movement handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || selectedSymptom) return;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - imageRect.left;
    const y = e.clientY - imageRect.top;
    
    setCursorPosition({ x, y });
    checkTextAreaIntersection(x, y);
  }, [selectedSymptom]);

  const handleMouseEnter = () => {
    if (!selectedSymptom) {
      setShowCursor(true);
    }
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
    setCurrentHoveredArea(null);
  };

  const handleClick = useCallback(() => {
    if (selectedSymptom || !currentHoveredArea) return;
    
    const area = textAreas.find(a => a.id === currentHoveredArea);
    if (!area) return;

    setSelectedSymptom({
      id: currentHoveredArea,
      text: area.symptomText
    });
    setShowCursor(false);
    setCurrentHoveredArea(null);
  }, [selectedSymptom, currentHoveredArea, textAreas]);

  const checkTextAreaIntersection = useCallback((x: number, y: number) => {
    if (selectedSymptom) return;

    let hoveredArea = null;

    // Much simpler coordinate mapping - use fixed zones
    for (const area of textAreas) {
      const imageRect = imageRef.current?.getBoundingClientRect();
      if (!imageRect) return;
      
      // Map coordinates as percentage of image size
      const leftPercent = area.x / 800;
      const topPercent = area.y / 600;
      const rightPercent = (area.x + area.width) / 800;
      const bottomPercent = (area.y + area.height) / 600;
      
      const left = leftPercent * imageRect.width;
      const top = topPercent * imageRect.height;
      const right = rightPercent * imageRect.width;
      const bottom = bottomPercent * imageRect.height;
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        hoveredArea = area.id;
        break;
      }
    }

    setCurrentHoveredArea(hoveredArea);
  }, [selectedSymptom, textAreas]);

  const changeSelection = () => {
    setSelectedSymptom(null);
    setShowCursor(true);
  };

  const submitSelection = () => {
    if (selectedSymptom) {
      onSymptomSubmit(selectedSymptom);
      onClose();
    }
  };

  // Calculate cursor size based on zoom
  const getCursorSize = () => {
    const baseSize = 16;
    return Math.max(8, baseSize / Math.sqrt(zoomLevel));
  };

  // Map natural coordinates to display coordinates for overlay elements
  const mapToDisplayCoords = (naturalX: number, naturalY: number) => {
    if (!imageRef.current || imageNaturalSize.width === 0) return { x: 0, y: 0 };
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRect.width / imageNaturalSize.width;
    const scaleY = imageRect.height / imageNaturalSize.height;
    
    return {
      x: naturalX * scaleX,
      y: naturalY * scaleY
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 gap-0 m-0">
        <div className="flex h-screen w-screen">
          {/* Left Side - Image (Full Screen) */}
          <div className="flex-[3] relative bg-gray-50 h-full">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Select Your {bodyPart} Symptom</h2>
                <Button onClick={onClose} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Patient: {patientData.name} | Age: {patientData.age} | Gender: {patientData.gender}
              </p>
            </div>

            {/* Image Container - Full Height */}
            <div className="h-full pt-16">
              <TransformWrapper
                initialScale={1}
                minScale={0.8}
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
                    <div className="absolute top-20 right-4 z-40 flex flex-col space-y-1">
                      <Button onClick={() => zoomIn()} size="sm" variant="outline">
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                      <Button onClick={() => zoomOut()} size="sm" variant="outline">
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button onClick={() => resetTransform()} size="sm" variant="outline">
                        Reset
                      </Button>
                      <div className="text-xs text-center bg-background/80 rounded px-1 py-1">
                        {Math.round(zoomLevel * 100)}%
                      </div>
                    </div>
                    
                    <div 
                      ref={containerRef}
                      className="relative h-full w-full overflow-hidden cursor-none select-none flex items-center justify-center"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onClick={handleClick}
                      style={{ touchAction: 'none' }}
                    >
                      {/* Selected symptom indicator */}
                      {selectedSymptom && (
                        <div
                          className="absolute bg-green-500 border-2 border-white rounded-full shadow-lg pointer-events-none z-30"
                          style={{
                            left: cursorPosition.x - getCursorSize()/2,
                            top: cursorPosition.y - getCursorSize()/2,
                            width: `${getCursorSize()}px`,
                            height: `${getCursorSize()}px`,
                          }}
                        />
                      )}

                      {/* Hover cursor with improved visibility */}
                      {showCursor && !selectedSymptom && (
                        <div
                          className="absolute rounded-full shadow-lg pointer-events-none z-30 transition-all duration-100 ease-out"
                          style={{
                            left: cursorPosition.x - getCursorSize()/2,
                            top: cursorPosition.y - getCursorSize()/2,
                            width: `${getCursorSize()}px`,
                            height: `${getCursorSize()}px`,
                            background: currentHoveredArea ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.7)',
                            border: currentHoveredArea ? '3px solid #fff' : '2px solid rgba(255, 255, 255, 0.8)',
                            boxShadow: currentHoveredArea ? '0 0 20px rgba(34, 197, 94, 0.6)' : '0 0 10px rgba(0, 0, 0, 0.3)'
                          }}
                        />
                      )}
                      
                      <TransformComponent>
                        <img 
                          ref={imageRef}
                          src={imageUrl} 
                          alt={`${bodyPart} symptom diagram`}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                          onLoad={handleImageLoad}
                        />
                      </TransformComponent>
                    </div>
                  </div>
                )}
              </TransformWrapper>
            </div>
          </div>

          {/* Right Side - Symptom Details (Compact) */}
          <div className="w-72 bg-background border-l flex flex-col h-screen">
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedSymptom ? (
                    <p className="text-sm text-muted-foreground">
                      Hover over symptom areas on the image to see descriptions. Click when you find a symptom that matches your condition.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You have selected a symptom. Review it below and either submit or change your selection.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Current Hover */}
              {!selectedSymptom && currentHoveredArea && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-primary">Highlighted Symptom</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const area = textAreas.find(a => a.id === currentHoveredArea);
                      return area ? (
                         <div>
                           <p className="text-sm text-muted-foreground leading-relaxed">
                             {area.symptomText}
                           </p>
                           <Button 
                             className="w-full mt-4" 
                             size="sm"
                             onClick={handleClick}
                           >
                             Select This Symptom
                           </Button>
                         </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Selected Symptom */}
              {selectedSymptom && (
                <Card className="border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-600">Selected Symptom</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div>
                       <p className="text-sm text-muted-foreground leading-relaxed">
                         {selectedSymptom.text}
                       </p>
                     </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t space-y-3">
              {selectedSymptom ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={changeSelection}
                  >
                    Change My Symptom Selection
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={submitSelection}
                  >
                    Submit My Selection
                  </Button>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Select a symptom to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenSymptomLightbox;