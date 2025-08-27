import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SymptomViewerProps {
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  onBack: () => void;
}

interface SymptomArea {
  id: string;
  text: string;
  position: { x: number; y: number; width: number; height: number };
  selected: boolean;
}

const SymptomViewer = ({ bodyPart, patientData, onBack }: SymptomViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomAreas] = useState<SymptomArea[]>([
    // Example symptom areas for ankle - these would be dynamically loaded based on body part
    {
      id: "ankle-pain",
      text: "Pain, swelling, bruising, and tenderness, difficulty moving the ankle, and limping.",
      position: { x: 10, y: 15, width: 45, height: 25 },
      selected: false
    },
    {
      id: "joint-conditions", 
      text: "Joint conditions affecting ankle movement and stability.",
      position: { x: 10, y: 45, width: 45, height: 30 },
      selected: false
    },
    {
      id: "swollen-ankles",
      text: "Swelling caused by excess fluid in tissues. Often affects feet.",
      position: { x: 55, y: 25, width: 40, height: 15 },
      selected: false
    },
    {
      id: "tibial-issues",
      text: "Progressive burning pain from buttock, down back of thigh, into the leg and foot.",
      position: { x: 55, y: 45, width: 40, height: 20 },
      selected: false
    },
    {
      id: "heel-bone",
      text: "Pain, stiffness, swelling at back of heel, worse in morning and with activity.",
      position: { x: 55, y: 70, width: 40, height: 15 },
      selected: false
    }
  ]);

  useEffect(() => {
    fetchSymptomImage();
  }, [bodyPart]);

  const fetchSymptomImage = async () => {
    try {
      setLoading(true);
      
      // Format the body part name to match potential file names
      const fileName = `${bodyPart.toLowerCase().replace(/\s+/g, '_')}.png`;
      
      console.log("Attempting to fetch image:", fileName);
      
      const { data, error } = await supabase.storage
        .from('Symptom_Images')
        .download(fileName);

      if (error) {
        console.error("Error fetching image:", error);
        
        // Try alternative naming conventions
        const alternativeNames = [
          `${bodyPart.toLowerCase().replace(/\s+/g, '-')}.png`,
          `${bodyPart.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          `${bodyPart.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          `${bodyPart.toUpperCase().replace(/\s+/g, '_')}.png`,
          `${bodyPart}.png`
        ];

        for (const altName of alternativeNames) {
          console.log("Trying alternative name:", altName);
          const { data: altData, error: altError } = await supabase.storage
            .from('Symptom_Images')
            .download(altName);
          
          if (!altError && altData) {
            const url = URL.createObjectURL(altData);
            setImageUrl(url);
            setLoading(false);
            return;
          }
        }
        
        toast.error(`Image not found for ${bodyPart}. Please contact support.`);
        setLoading(false);
        return;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        setImageUrl(url);
        toast.success("Symptom diagram loaded successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to load symptom diagram");
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomSelect = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading symptom diagram for {bodyPart}...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">Image Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No symptom diagram found for "{bodyPart}". 
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Body Map
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{bodyPart} Symptoms</h1>
                <p className="text-sm text-muted-foreground">
                  Patient: {patientData.name} | Age: {patientData.age} | Gender: {patientData.gender}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Image Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-[80vh]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>{bodyPart} Anatomy & Symptoms</span>
                  <div className="text-sm text-muted-foreground">
                    Click and drag to move • Scroll to zoom
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-6">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  wheel={{ step: 0.1 }}
                  pinch={{ step: 5 }}
                  doubleClick={{ disabled: false, step: 0.5 }}
                  limitToBounds={false}
                  centerOnInit={true}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <div className="relative h-full">
                      {/* Zoom Controls */}
                      <div className="absolute top-4 right-4 z-30 flex flex-col space-y-2">
                        <Button size="sm" onClick={() => zoomIn()} variant="secondary">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => zoomOut()} variant="secondary">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => resetTransform()} variant="secondary">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>

                      <TransformComponent
                        wrapperClass="w-full h-full"
                        contentClass="w-full h-full flex items-center justify-center"
                      >
                        <div className="relative max-w-full max-h-full">
                          <img 
                            src={imageUrl} 
                            alt={`${bodyPart} symptom diagram`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            draggable={false}
                          />
                          
                          {/* Symptom Selection Overlays */}
                          {symptomAreas.map((area) => (
                            <div
                              key={area.id}
                              className={`absolute cursor-pointer transition-all duration-300 rounded-lg border-2 ${
                                selectedSymptoms.includes(area.id)
                                  ? "bg-primary/20 border-primary shadow-lg"
                                  : "bg-transparent border-transparent hover:bg-blue-500/10 hover:border-blue-500"
                              }`}
                              style={{
                                left: `${area.position.x}%`,
                                top: `${area.position.y}%`,
                                width: `${area.position.width}%`,
                                height: `${area.position.height}%`,
                              }}
                              onClick={() => handleSymptomSelect(area.id)}
                              title={area.text}
                            >
                              {selectedSymptoms.includes(area.id) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md animate-pulse"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TransformComponent>
                    </div>
                  )}
                </TransformWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Symptom Selection Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Symptoms</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on the diagram or select from the list below
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {symptomAreas.map((area) => (
                  <div
                    key={area.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedSymptoms.includes(area.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                    onClick={() => handleSymptomSelect(area.id)}
                  >
                    <p className="text-sm font-medium mb-1">
                      {area.text.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {area.text}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Symptoms Summary */}
            {selectedSymptoms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Symptoms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedSymptoms.map((symptomId) => {
                    const symptom = symptomAreas.find(s => s.id === symptomId);
                    return (
                      <Badge key={symptomId} variant="secondary" className="text-xs">
                        {symptom?.text.split(',')[0]}
                      </Badge>
                    );
                  })}
                  <div className="pt-4">
                    <Button className="w-full gradient-primary" size="lg">
                      Continue with Selected Symptoms ({selectedSymptoms.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomViewer;