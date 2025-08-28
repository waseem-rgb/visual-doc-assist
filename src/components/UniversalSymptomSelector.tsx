
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricImage, Point } from 'fabric';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UniversalSymptomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  bodyPart: string;
  gender: 'male' | 'female';
  view: 'front' | 'back';
  onSymptomsSelected: (symptoms: string[]) => void;
  initialSymptoms?: string[];
}

interface SymptomData {
  'Part of body_and general full body symptom': string;
  'Symptoms': string;
  'Probable Diagnosis': string;
  'Short Summary': string;
  'Basic Investigations': string;
  'Common Treatments': string;
  'prescription_Y-N': string;
}

const UniversalSymptomSelector = ({
  isOpen,
  onClose,
  bodyPart,
  gender,
  view,
  onSymptomsSelected,
  initialSymptoms = []
}: UniversalSymptomSelectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const symptomListRef = useRef<HTMLDivElement>(null);
  const symptomRailRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(initialSymptoms);
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [availableSymptoms, setAvailableSymptoms] = useState<SymptomData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOverlays, setShowOverlays] = useState(true);
  const [viewMode, setViewMode] = useState<'column' | 'rail'>('column');

  const { toast } = useToast();

  const getImagePath = useCallback(() => {
    console.log('getImagePath - bodyPart:', bodyPart, 'view:', view, 'gender:', gender);
    
    // Map body parts to actual asset names
    let assetName = bodyPart.toLowerCase().replace(/\s+/g, '-').replace('physical', '').replace(/-+$/, '');
    
    // Handle special mappings
    const bodyPartMappings: { [key: string]: string } = {
      'ear': 'head',
      'eye': 'head',
      'nose': 'head',
      'mouth': 'head',
      'face': 'head',
      'neck': 'head',
      'throat': 'head',
      'shoulder': 'arms',
      'elbow': 'arms',
      'wrist': 'arms',
      'hand': 'arms',
      'finger': 'arms',
      'hip': 'legs',
      'knee': 'legs',
      'ankle': 'legs',
      'foot': 'legs',
      'toe': 'legs',
      'back': 'chest',
      'spine': 'chest',
      'stomach': 'abdomen',
      'belly': 'abdomen'
    };
    
    // Check if we need to map the body part
    for (const [key, value] of Object.entries(bodyPartMappings)) {
      if (assetName.includes(key)) {
        assetName = value;
        break;
      }
    }
    
    const basePath = `/src/assets/${assetName}-${view}-${gender}.jpg`;
    
    console.log('Generated image path:', basePath);
    return basePath;
  }, [bodyPart, view, gender]);

  const fetchSymptoms = useCallback(async () => {
    if (!bodyPart) return;
    
    setIsLoadingSymptoms(true);
    try {
      const { data, error } = await supabase
        .from('New Master')
        .select('*')
        .ilike('Part of body_and general full body symptom', `%${bodyPart}%`);

      if (error) {
        console.error('Error fetching symptoms:', error);
        toast({
          title: "Error",
          description: "Failed to load symptoms for this body part.",
          variant: "destructive",
        });
        return;
      }

      const symptomsData = (data || []) as SymptomData[];
      setAvailableSymptoms(symptomsData);
    } catch (error) {
      console.error('Error in fetchSymptoms:', error);
    } finally {
      setIsLoadingSymptoms(false);
    }
  }, [bodyPart, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchSymptoms();
    }
  }, [isOpen, fetchSymptoms]);

  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Clean up existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: false,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
      stopContextMenu: true,
      fireRightClick: true,
      controlsAboveOverlay: true,
      imageSmoothingEnabled: true,
    });

    // Disable text selection on canvas
    canvas.getElement().style.userSelect = 'none';
    (canvas.getElement().style as any).webkitUserSelect = 'none';

    fabricCanvasRef.current = canvas;

    // Load the body image
    const imagePath = getImagePath();
    console.log('🔍 Attempting to load image from:', imagePath);
    console.log('🔍 Body part mapping - original:', bodyPart, 'mapped path:', imagePath);
    
    FabricImage.fromURL(imagePath, { crossOrigin: 'anonymous' })
      .then((img) => {
        console.log('✅ Image loaded successfully:', imagePath, 'Size:', img.width, 'x', img.height);
        if (!canvas || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth * 0.75;
        const containerHeight = containerRef.current.offsetHeight * 0.9;
        
        const scale = Math.min(
          containerWidth / (img.width || 1),
          containerHeight / (img.height || 1)
        ) * 0.8;

        img.set({
          left: (containerWidth - (img.width || 0) * scale) / 2,
          top: (containerHeight - (img.height || 0) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
          moveCursor: 'default'
        });

        imageRef.current = img;
        canvas.add(img);
        canvas.renderAll();
      })
      .catch((error) => {
        console.error('❌ Failed to load image:', imagePath, error);
        console.log('🔧 Trying alternative paths...');
        
        // Try different path variations
        const altPaths = [
          imagePath.replace('/src/assets/', '/src/assets/'),
          imagePath.replace('/src/', './src/'),
          imagePath.replace('.jpg', '.png'),
          imagePath.replace('/src/assets/', '/assets/'),
          imagePath.replace('/src/assets/', '')
        ];
        
        console.log('🔧 Alternative paths to try:', altPaths);
        
        // Try each alternative path
        const tryNextPath = (pathIndex = 0) => {
          if (pathIndex >= altPaths.length) {
            console.error('❌ All image paths failed for:', bodyPart);
            return;
          }
          
          const currentPath = altPaths[pathIndex];
          console.log(`🔧 Trying path ${pathIndex + 1}/${altPaths.length}:`, currentPath);
          
          FabricImage.fromURL(currentPath, { crossOrigin: 'anonymous' })
            .then((img) => {
              console.log('✅ Success with alternative path:', currentPath);
              if (!canvas || !containerRef.current) return;

              const containerWidth = containerRef.current.offsetWidth * 0.75;
              const containerHeight = containerRef.current.offsetHeight * 0.9;
              
              const scale = Math.min(
                containerWidth / (img.width || 1),
                containerHeight / (img.height || 1)
              ) * 0.8;

              img.set({
                left: (containerWidth - (img.width || 0) * scale) / 2,
                top: (containerHeight - (img.height || 0) * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
                hoverCursor: 'default',
                moveCursor: 'default'
              });

              imageRef.current = img;
              canvas.add(img);
              canvas.renderAll();
            })
            .catch((err) => {
              console.log(`❌ Path ${pathIndex + 1} failed:`, currentPath, err);
              tryNextPath(pathIndex + 1);
            });
        };
        
        tryNextPath();
      });

    // Disable canvas interactions - no click handlers

    // Enable zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 3) zoom = 3;
      if (zoom < 0.3) zoom = 0.3;
      
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      setZoomLevel(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return canvas;
  }, [getImagePath, availableSymptoms, selectedSymptom]);

  const scrollToSymptom = (symptom: string) => {
    // Scroll in column view
    if (viewMode === 'column' && symptomListRef.current) {
      const symptomElement = symptomListRef.current.querySelector(`[data-symptom="${symptom}"]`);
      if (symptomElement) {
        symptomElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    // Scroll in rail view
    if (viewMode === 'rail' && symptomRailRef.current) {
      const symptomElement = symptomRailRef.current.querySelector(`[data-symptom="${symptom}"]`);
      if (symptomElement) {
        symptomElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const timer = setTimeout(() => {
        initializeCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initializeCanvas, isFullscreen]);

  const handleSymptomClick = (symptom: string) => {
    setSelectedSymptom(symptom);
    setShowConfirmation(true);
    scrollToSymptom(symptom);
  };

  const confirmSymptomSelection = () => {
    if (selectedSymptom && !selectedSymptoms.includes(selectedSymptom)) {
      const newSymptoms = [...selectedSymptoms, selectedSymptom];
      setSelectedSymptoms(newSymptoms);
      toast({
        title: "Symptom Added",
        description: `"${selectedSymptom}" has been added to your symptoms.`,
      });
    }
    setSelectedSymptom('');
    setShowConfirmation(false);
  };

  const removeSymptom = (symptom: string) => {
    const newSymptoms = selectedSymptoms.filter(s => s !== symptom);
    setSelectedSymptoms(newSymptoms);
    toast({
      title: "Symptom Removed",
      description: `"${symptom}" has been removed from your symptoms.`,
    });
  };

  const handleZoomIn = () => {
    if (fabricCanvasRef.current) {
      const newZoom = Math.min(zoomLevel * 1.2, 3);
      fabricCanvasRef.current.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (fabricCanvasRef.current) {
      const newZoom = Math.max(zoomLevel * 0.8, 0.3);
      fabricCanvasRef.current.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const resetZoom = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(1);
      fabricCanvasRef.current.absolutePan(new Point(0, 0));
      setZoomLevel(1);
    }
  };

  const handleClose = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
    onClose();
  };

  const handleConfirm = () => {
    onSymptomsSelected(selectedSymptoms);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`${isFullscreen ? 'w-[98vw] h-[98vh] max-w-none' : 'w-[95vw] h-[95vh] max-w-7xl'} p-0 gap-0`}
        style={{ maxHeight: '98vh' }}
      >
        <DialogHeader className="p-4 pb-2 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Select Symptoms - {bodyPart} ({gender}, {view} view)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'column' ? 'rail' : 'column')}
              >
                {viewMode === 'column' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                {viewMode === 'column' ? 'Rail View' : 'Column View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverlays(!showOverlays)}
              >
                {showOverlays ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Side - Canvas */}
          <div className={`${viewMode === 'column' ? (isFullscreen ? 'w-5/6' : 'w-4/5') : 'w-full'} relative bg-gray-50 select-none`} ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-default select-none"
              style={{ 
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />
            
            {/* Canvas Controls - Hidden */}
            <div className="hidden absolute top-4 left-4 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Level Indicator - Hidden */}
            <div className="hidden absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium shadow-lg">
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Confirmation Popup */}
            {showConfirmation && selectedSymptom && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-96 max-w-[90vw]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Confirm Symptom Selection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Do you want to add this symptom?
                    </p>
                    <div className="bg-muted p-3 rounded mb-4">
                      <p className="text-sm font-medium">{selectedSymptom}</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedSymptom('');
                          setShowConfirmation(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={confirmSymptomSelection}>
                        Add Symptom
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Side - Symptom List (Column View) */}
          {viewMode === 'column' && (
            <div className={`${isFullscreen ? 'w-1/6' : 'w-1/5'} bg-background border-l border-border flex flex-col min-h-0`}>
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="text-lg font-semibold text-foreground mb-2">Available Symptoms</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a symptom to select it
                </p>
              </div>

              <div 
                ref={symptomListRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth" 
                style={{ scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 300px)' }}
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-4 space-y-3 pb-8">
                  {isLoadingSymptoms ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading symptoms...</p>
                      </div>
                    </div>
                  ) : availableSymptoms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No symptoms found for this body part.</p>
                    </div>
                  ) : (
                    availableSymptoms.map((symptomData, index) => (
                      <div
                        key={index}
                        data-symptom={symptomData.Symptoms}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground ${
                          selectedSymptom === symptomData.Symptoms 
                            ? 'bg-primary/10 border-primary' 
                            : selectedSymptoms.includes(symptomData.Symptoms)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-card border-border hover:border-accent-foreground'
                        }`}
                        onClick={() => handleSymptomClick(symptomData.Symptoms)}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {symptomData.Symptoms}
                          </p>
                          {selectedSymptoms.includes(symptomData.Symptoms) && (
                            <Badge variant="secondary" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Symptoms Rail (Rail View) */}
        {viewMode === 'rail' && (
          <div className="border-t border-border bg-background flex-shrink-0">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Available Symptoms</h3>
              <div 
                ref={symptomRailRef}
                className="overflow-x-auto overscroll-x-contain"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                  {isLoadingSymptoms ? (
                    <div className="flex items-center justify-center py-4 px-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                      <p className="text-sm text-muted-foreground">Loading symptoms...</p>
                    </div>
                  ) : availableSymptoms.length === 0 ? (
                    <div className="py-4 px-8">
                      <p className="text-sm text-muted-foreground">No symptoms found for this body part.</p>
                    </div>
                  ) : (
                    availableSymptoms.map((symptomData, index) => (
                      <div
                        key={index}
                        data-symptom={symptomData.Symptoms}
                        className={`flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground ${
                          selectedSymptom === symptomData.Symptoms 
                            ? 'bg-primary/10 border-primary' 
                            : selectedSymptoms.includes(symptomData.Symptoms)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-card border-border hover:border-accent-foreground'
                        }`}
                        style={{ minWidth: '200px', maxWidth: '300px' }}
                        onClick={() => handleSymptomClick(symptomData.Symptoms)}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                            {symptomData.Symptoms}
                          </p>
                          {selectedSymptoms.includes(symptomData.Symptoms) && (
                            <Badge variant="secondary" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Symptoms & Actions */}
        <div className="border-t border-border bg-background p-4 flex-shrink-0">
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="font-medium mb-2">Selected Symptoms ({selectedSymptoms.length})</h4>
              {selectedSymptoms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No symptoms selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {selectedSymptoms.map((symptom, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeSymptom(symptom)}
                    >
                      {symptom} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedSymptoms.length === 0}
              >
                Confirm Selection ({selectedSymptoms.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;
