
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage, Point } from 'fabric';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UniversalSymptomSelectorProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  bodyPart: string;
  gender?: 'male' | 'female';
  view?: 'front' | 'back';
  onSymptomsSelected?: (symptoms: string[]) => void;
  initialSymptoms?: string[];
  imageUrl?: string;
  patientData?: any;
  symptoms?: any[];
  onSymptomSubmit?: (symptom: any) => void;
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
  open,
  onClose,
  bodyPart,
  gender = 'male',
  view = 'front',
  onSymptomsSelected,
  initialSymptoms = [],
  imageUrl,
  onSymptomSubmit,
  ...otherProps
}: UniversalSymptomSelectorProps) => {
  const isDialogOpen = isOpen || open || false;
  const containerRef = useRef<HTMLDivElement>(null);
  const symptomListRef = useRef<HTMLDivElement>(null);
  const symptomRailRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(initialSymptoms);
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [availableSymptoms, setAvailableSymptoms] = useState<SymptomData[]>([]);
  const [showOverlays, setShowOverlays] = useState(true);
  const [viewMode, setViewMode] = useState<'column' | 'rail'>('rail'); // Default to rail for better mobile UX
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile 
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [staticMode] = useState(true); // Static image mode

  const { toast } = useToast();

  const getImagePath = useCallback(() => {
    const basePath = `/src/assets/${bodyPart}-${view}-${gender}.jpg`;
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
    if (isDialogOpen) {
      fetchSymptoms();
    }
  }, [isDialogOpen, fetchSymptoms]);

  const handleImageClick = useCallback((event: React.MouseEvent) => {
    if (!staticMode) return;
    
    console.log('Static image clicked');
    
    // For now, just select the first available symptom as an example
    if (availableSymptoms.length > 0 && !selectedSymptom) {
      const firstSymptom = availableSymptoms[0].Symptoms;
      setSelectedSymptom(firstSymptom);
      scrollToSymptom(firstSymptom);
      setShowConfirmation(true);
    }
  }, [staticMode, availableSymptoms, selectedSymptom]);

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

  // No canvas initialization needed in static mode

  const handleSymptomClick = (symptom: string) => {
    // Direct toggle selection instead of confirmation dialog
    if (selectedSymptoms.includes(symptom)) {
      removeSymptom(symptom);
    } else {
      const newSymptoms = [...selectedSymptoms, symptom];
      setSelectedSymptoms(newSymptoms);
      toast({
        title: "Symptom Added",
        description: `"${symptom}" has been added to your symptoms.`,
      });
    }
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

  // Zoom controls removed for static mode

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    console.log('🔄 [CONFIRM] Button clicked with selectedSymptoms:', selectedSymptoms);
    
    // Call onSymptomsSelected if provided (for backward compatibility)
    if (onSymptomsSelected) {
      console.log('🔄 [CONFIRM] Calling onSymptomsSelected');
      onSymptomsSelected(selectedSymptoms);
    }
    
    // Call onSymptomSubmit with the first selected symptom in the expected format
    if (onSymptomSubmit && selectedSymptoms.length > 0) {
      const firstSymptom = selectedSymptoms[0];
      const symptomData = {
        id: firstSymptom.replace(/\s+/g, '_').toLowerCase(),
        text: firstSymptom
      };
      console.log('🔄 [CONFIRM] Calling onSymptomSubmit with:', symptomData);
      onSymptomSubmit(symptomData);
    } else {
      console.log('🚫 [CONFIRM] onSymptomSubmit not available or no symptoms selected');
    }
    
    console.log('🔄 [CONFIRM] Closing dialog');
    handleClose();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`${isFullscreen ? 'w-[98vw] h-[98vh] max-w-none' : 'w-[95vw] h-[95vh] max-w-7xl'} p-0 gap-0`}
        style={{ maxHeight: isFullscreen ? '98vh' : '95vh' }}
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Image Container - Full width in rail mode or mobile, 3/4 width in desktop column mode */}
          <div className={`${viewMode === 'column' && !isMobile ? (isFullscreen ? 'flex-1' : 'flex-1') : 'flex-1'} relative bg-gray-50`} ref={containerRef}>
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              {imageUrl ? (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={`${bodyPart} ${view} view`}
                  className="max-w-none max-h-none object-contain cursor-grab active:cursor-grabbing"
                  onClick={handleImageClick}
                  draggable={true}
                  style={{ 
                    minWidth: '100%',
                    minHeight: '100%',
                    imageRendering: 'crisp-edges'
                  }}
                />
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading image...</p>
                </div>
              )}
            </div>

            {/* Removed confirmation popup - no longer needed */}
          </div>

          {/* Right Side - Symptom List (Column View - Desktop Only) */}
          {viewMode === 'column' && !isMobile && (
            <div className={`${isFullscreen ? 'w-1/4' : 'w-1/4'} bg-background border-l border-border flex flex-col h-full`}>
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="text-lg font-semibold text-foreground mb-2">Available Symptoms</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a symptom to select it
                </p>
              </div>

              <div 
                ref={symptomListRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400" 
                style={{ scrollBehavior: 'smooth' }}
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-4 space-y-3">
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
          <div className="border-t border-border bg-background flex-shrink-0 max-h-64">
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex-shrink-0">Available Symptoms</h3>
              <div 
                ref={symptomRailRef}
                className="flex-1 overflow-x-auto overflow-y-auto overscroll-contain"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex flex-wrap gap-3 pb-2">
                  {isLoadingSymptoms ? (
                    <div className="flex items-center justify-center py-4 px-8 w-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                      <p className="text-sm text-muted-foreground">Loading symptoms...</p>
                    </div>
                  ) : availableSymptoms.length === 0 ? (
                    <div className="py-4 px-8 w-full">
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
                        style={{ minWidth: isMobile ? '250px' : '200px', maxWidth: isMobile ? '350px' : '300px' }}
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
                className="bg-primary hover:bg-primary/90"
              >
                {selectedSymptoms.length === 0 
                  ? "Continue Without Symptoms" 
                  : `Proceed with ${selectedSymptoms.length} Symptom${selectedSymptoms.length === 1 ? '' : 's'}`
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSymptomSelector;
