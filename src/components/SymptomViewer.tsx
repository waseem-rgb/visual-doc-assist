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

interface DatabaseSymptom {
  "Part of body_and general full body symptom": string;
  "Symptoms": string;
}

const SymptomViewer = ({ bodyPart, patientData, onBack }: SymptomViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomAreas, setSymptomAreas] = useState<SymptomArea[]>([]);
  const [fetchingSymptoms, setFetchingSymptoms] = useState(false);

  useEffect(() => {
    fetchSymptomImage();
    fetchSymptomsFromDatabase();
  }, [bodyPart]);

  const fetchSymptomsFromDatabase = async () => {
    try {
      setFetchingSymptoms(true);
      
      const { data, error } = await supabase
        .from('New Master')
        .select('Symptoms')
        .ilike('Part of body_and general full body symptom', `%${bodyPart}%`)
        .not('Symptoms', 'is', null);

      if (error) {
        console.error("Error fetching symptoms:", error);
        toast.error("Failed to load symptoms from database");
        return;
      }

      if (data && data.length > 0) {
        // Extract unique symptoms and remove duplicates
        const symptomTexts = data
          .map(row => row.Symptoms?.trim())
          .filter(Boolean)
          .filter((text, index, arr) => arr.indexOf(text) === index); // Remove duplicates
        
        // Limit to 16 unique symptoms as requested
        const uniqueSymptoms = symptomTexts.slice(0, 16);
        
        // Create symptom areas from unique symptoms
        const areas: SymptomArea[] = uniqueSymptoms.map((text, index) => {
          const positions = generateDynamicPositions(uniqueSymptoms.length);
          
          return {
            id: `symptom-${index}`,
            text: text,
            position: positions[index],
            selected: false
          };
        });

        setSymptomAreas(areas);
        
        if (areas.length > 0) {
          toast.success(`Loaded ${areas.length} unique symptoms for ${bodyPart}`);
        } else {
          toast.info(`No specific symptoms found for ${bodyPart}`);
        }
      } else {
        toast.info(`No symptoms found for ${bodyPart} in database`);
      }
    } catch (err) {
      console.error("Unexpected error fetching symptoms:", err);
      toast.error("Failed to fetch symptoms");
    } finally {
      setFetchingSymptoms(false);
    }
  };

  const generateDynamicPositions = (count: number) => {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Make selection boxes smaller and more distributed
      const x = 10 + (col * (80 / cols));
      const y = 15 + (row * (70 / rows));
      const width = Math.min(25, 80 / cols - 2); // Smaller, dynamic width
      const height = Math.min(15, 70 / rows - 2); // Smaller, dynamic height
      
      positions.push({ x, y, width, height });
    }
    
    return positions;
  };

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

  if (loading || fetchingSymptoms) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {loading ? `Loading symptom diagram for ${bodyPart}...` : `Fetching symptoms from database...`}
          </p>
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
                          
                          {/* Symptom Selection Circles */}
                          {symptomAreas.map((area) => (
                            <div
                              key={area.id}
                              className="absolute cursor-pointer transition-all duration-300 group"
                              style={{
                                left: `${area.position.x}%`,
                                top: `${area.position.y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              onClick={() => handleSymptomSelect(area.id)}
                              title={area.text}
                            >
                              {/* Small blue circle for selection */}
                              <div 
                                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                  selectedSymptoms.includes(area.id)
                                    ? "bg-blue-600 border-blue-800 shadow-lg"
                                    : "bg-blue-400/70 border-blue-500 hover:bg-blue-500 hover:border-blue-600 group-hover:scale-110"
                                }`}
                              >
                                {selectedSymptoms.includes(area.id) && (
                                  <div className="absolute inset-1 bg-white rounded-full animate-pulse"></div>
                                )}
                              </div>
                              
                              {/* Hover tooltip */}
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                                <div className="bg-black/90 text-white text-xs rounded-lg px-3 py-2 max-w-xs">
                                  <p className="truncate">{area.text.split('.')[0]}...</p>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                                </div>
                              </div>
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
                    <p className="text-sm">{area.text}</p>
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