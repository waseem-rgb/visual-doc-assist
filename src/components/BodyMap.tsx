import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import bodyDiagramFront from "@/assets/body-diagram-front.png";

interface BodyMapProps {
  gender: "male" | "female";
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
}

interface BodyPart {
  Body_part: string;
  View: string;
  "Specific rules": string;
}

const BodyMap = ({ gender, patientData }: BodyMapProps) => {
  const [currentView, setCurrentView] = useState<"Front" | "Back">("Front");
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const { data: bodyParts, isLoading } = useQuery({
    queryKey: ["bodyParts", currentView, gender],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("head to Toe sub areas")
        .select("*")
        .eq("View", currentView)
      
      if (error) {
        toast.error("Failed to load body parts");
        throw error;
      }
      return data as BodyPart[];
    },
  });

  const handleBodyPartClick = (bodyPart: string) => {
    setSelectedBodyParts(prev => 
      prev.includes(bodyPart) 
        ? prev.filter(part => part !== bodyPart)
        : [...prev, bodyPart]
    );
  };

  const getBodyPartPosition = (bodyPart: string, view: string) => {
    // Define positions for body parts based on view
    const positions: { [key: string]: { [key: string]: { top: string; left: string } } } = {
      Front: {
        "HAIR AND SCALP": { top: "5%", left: "50%" },
        "HEAD FRONT": { top: "10%", left: "50%" },
        "HEAD SIDE": { top: "10%", left: "40%" },
        "FACE": { top: "15%", left: "50%" },
        "NOSE": { top: "17%", left: "50%" },
        "MOUTH": { top: "20%", left: "50%" },
        "NECK": { top: "25%", left: "50%" },
        "THROAT": { top: "27%", left: "50%" },
        "THROAT VOICE": { top: "29%", left: "50%" },
        "CHEST UPPER": { top: "35%", left: "50%" },
      },
      Back: {
        "HAIR AND SCALP": { top: "5%", left: "50%" },
        "HEAD BACK": { top: "10%", left: "50%" },
        "NECK BACK": { top: "25%", left: "50%" },
        "UPPER BACK": { top: "35%", left: "50%" },
      }
    };

    return positions[view]?.[bodyPart] || { top: "50%", left: "50%" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4">Select Affected Body Areas</h3>
        <p className="text-muted-foreground mb-6">
          Click on the body parts where you're experiencing symptoms. You can select multiple areas.
        </p>
        
        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={(value) => setCurrentView(value as "Front" | "Back")}
          className="mb-6"
        >
          <ToggleGroupItem value="Front" className="px-8">
            Front View
          </ToggleGroupItem>
          <ToggleGroupItem value="Back" className="px-8">
            Back View
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {gender === "male" ? "Male" : "Female"} Body - {currentView} View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto" style={{ width: "400px", height: "550px" }}>
              {/* Body diagram background */}
              <img 
                src={bodyDiagramFront} 
                alt={`${gender} body diagram - ${currentView} view`}
                className="w-full h-full object-contain"
                style={{ filter: "opacity(0.9)" }}
              />

              {/* Interactive body part points */}
              {bodyParts?.map((part, index) => {
                const position = getBodyPartPosition(part.Body_part, currentView);
                const isSelected = selectedBodyParts.includes(part.Body_part);
                const isHovered = hoveredPart === part.Body_part;
                
                return (
                  <div
                    key={`${part.Body_part}-${index}`}
                    className={`absolute w-4 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-primary scale-125 shadow-lg" 
                        : "bg-primary/60 hover:bg-primary hover:scale-110"
                    }`}
                    style={{
                      top: position.top,
                      left: position.left,
                      transform: "translate(-50%, -50%)",
                      zIndex: 10
                    }}
                    onClick={() => handleBodyPartClick(part.Body_part)}
                    onMouseEnter={() => setHoveredPart(part.Body_part)}
                    onMouseLeave={() => setHoveredPart(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border rounded shadow-lg text-sm whitespace-nowrap z-20">
                        {part.Body_part}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Selected body parts display */}
            {selectedBodyParts.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBodyParts.map((part) => (
                    <span
                      key={part}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20"
                      onClick={() => handleBodyPartClick(part)}
                    >
                      {part} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedBodyParts.length > 0 && (
        <div className="text-center">
          <Button className="gradient-primary" size="lg">
            Continue with Selected Areas ({selectedBodyParts.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default BodyMap;