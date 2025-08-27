import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import bodyFrontRealistic from "@/assets/body-front-realistic.png";
import bodyBackRealistic from "@/assets/body-back-realistic.png";

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
  const [currentView, setCurrentView] = useState<"Front" | "Back view">("Front");
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const { data: allBodyParts, isLoading } = useQuery({
    queryKey: ["bodyParts"],
    queryFn: async () => {
      console.log("Fetching all body parts...");
      
      try {
        // Try with proper table name escaping
        const { data, error } = await supabase
          .from('head to Toe sub areas')
          .select('*');
        
        console.log("Supabase query completed:");
        console.log("- Data:", data);
        console.log("- Error:", error);
        console.log("- Data length:", data?.length);
        
        if (error) {
          console.error("Supabase error details:", JSON.stringify(error, null, 2));
          toast.error(`Failed to load body parts: ${error.message}`);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn("No data returned from Supabase - this might be due to RLS policy restrictions");
        }
        
        console.log("Raw data from Supabase:", data);
        return data as BodyPart[];
      } catch (err) {
        console.error("Query error:", err);
        throw err;
      }
    },
  });

  // Filter body parts based on current view and gender
  const bodyParts = allBodyParts?.filter(part => {
    const matchesView = part.View === currentView;
    const genderRules = ["shown to Both gender", gender === "male" ? "Only to Male patient" : "Only to Female patient"];
    const matchesGender = genderRules.includes(part["Specific rules"]);
    
    console.log(`Part: ${part.Body_part}, View: ${part.View} (matches: ${matchesView}), Rules: ${part["Specific rules"]} (matches: ${matchesGender})`);
    
    return matchesView && matchesGender;
  }) || [];

  const handleBodyPartClick = (bodyPart: string) => {
    // Only allow single selection - replace current selection
    setSelectedBodyParts([bodyPart]);
  };

  const getBodyPartPosition = (bodyPart: string, view: string) => {
    // Define positions for body parts based on view - mapped to realistic body proportions
    const positions: { [key: string]: { [key: string]: { top: string; left: string } } } = {
      Front: {
        // Head and face area
        "HAIR AND SCALP": { top: "8%", left: "50%" },
        "HEAD FRONT": { top: "12%", left: "50%" },
        "HEAD SIDE": { top: "12%", left: "35%" },
        "FACE": { top: "16%", left: "50%" },
        "EYE PHYSICAL": { top: "15%", left: "45%" },
        "EYE VISION": { top: "15%", left: "55%" },
        "EAR PHYSICAL": { top: "14%", left: "25%" },
        "EAR HEARING": { top: "14%", left: "75%" },
        "NOSE": { top: "17%", left: "50%" },
        "MOUTH": { top: "19%", left: "50%" },
        
        // Neck and throat
        "NECK": { top: "22%", left: "50%" },
        "THROAT": { top: "24%", left: "50%" },
        "THROAT VOICE": { top: "25%", left: "50%" },
        
        // Upper body
        "SHOULDER FRONT": { top: "27%", left: "25%" },
        "CHEST UPPER": { top: "32%", left: "50%" },
        "CHEST CENTRAL": { top: "35%", left: "50%" },
        "CHEST SIDE": { top: "35%", left: "30%" },
        "BREAST": { top: "34%", left: "40%" },
        "UPPER ARM": { top: "35%", left: "15%" },
        
        // Abdomen
        "UPPER ABDOMEN": { top: "42%", left: "50%" },
        "ABDOMEN GENERAL": { top: "48%", left: "50%" },
        "LOWER ABDOMEN LEFT": { top: "52%", left: "42%" },
        "LOWER ABDOMEN RIGHT": { top: "52%", left: "58%" },
        "FEMALE LOWER ABDOMEN": { top: "54%", left: "50%" },
        
        // Genitals and groin
        "GROIN MALE AND FEMALE": { top: "57%", left: "50%" },
        "MALE GENITALS": { top: "58%", left: "50%" },
        "FEMALE GENITALS": { top: "58%", left: "50%" },
        
        // Bowel issues (abdomen area)
        "BOWELS ABNORMAL STOOL": { top: "50%", left: "45%" },
        "BOWELS CONSTIPATION": { top: "50%", left: "55%" },
        "BOWELS DIARRHOEA": { top: "52%", left: "50%" },
        
        // Urinary
        "URINARY PROBLEMS MALE": { top: "56%", left: "45%" },
        "URINARY PROBLEMS FEMALE": { top: "56%", left: "55%" },
        
        // Arms and hands
        "FOREARM AND WRIST": { top: "45%", left: "10%" },
        "HAND PALM": { top: "55%", left: "8%" },
        
        // Hips and legs
        "HIP FRONT": { top: "60%", left: "35%" },
        "THIGH FRONT": { top: "68%", left: "40%" },
        "THIGH BACK": { top: "68%", left: "60%" },
        "KNEE FRONT": { top: "78%", left: "40%" },
        "LOWER LEG FRONT": { top: "85%", left: "40%" },
        
        // Feet
        "ANKLE": { top: "92%", left: "40%" },
        "FOOT": { top: "96%", left: "40%" },
        "FOOT UPPER": { top: "95%", left: "40%" },
        "FOOT UNDERSIDE": { top: "97%", left: "40%" },
        
        // Back view items that appear in Front view
        "UPPER BACK": { top: "32%", left: "70%" },
      },
      
      "Back view": {
        // Head area
        "HAIR AND SCALP": { top: "8%", left: "50%" },
        
        // Back and shoulders
        "SHOULDER BACK": { top: "27%", left: "25%" },
        "UPPER BACK": { top: "32%", left: "50%" },
        "LOWER BACK": { top: "48%", left: "50%" },
        
        // Arms
        "ELBOW": { top: "42%", left: "15%" },
        "HAND BACK": { top: "55%", left: "8%" },
        
        // Hips and buttocks
        "HIP BACK": { top: "60%", left: "35%" },
        "BUTTOCKS AND ANUS": { top: "62%", left: "50%" },
        
        // Legs
        "KNEE BACK": { top: "78%", left: "40%" },
        "LOWER LEG BACK": { top: "85%", left: "40%" },
      }
    };

    // Return position if found, otherwise place at a default visible location
    const position = positions[view]?.[bodyPart];
    if (!position) {
      console.warn(`Position not defined for body part: ${bodyPart} in view: ${view}`);
      // Place unmapped parts in a visible area with some spacing
      const unmappedIndex = bodyPart.length % 10;
      return { 
        top: `${20 + (unmappedIndex * 5)}%`, 
        left: `${80 + (unmappedIndex % 3) * 5}%` 
      };
    }
    return position;
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
          Click on the body part where you're experiencing symptoms. Select one area at a time.
        </p>
        
        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={(value) => setCurrentView(value as "Front" | "Back view")}
          className="mb-6"
        >
          <ToggleGroupItem value="Front" className="px-8">
            Front View
          </ToggleGroupItem>
          <ToggleGroupItem value="Back view" className="px-8">
            Back View
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center">
              {gender === "male" ? "Male" : "Female"} Body - {currentView} View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto" style={{ width: "600px", height: "800px" }}>
              {/* Body diagram background */}
              <img 
                src={currentView === "Front" ? bodyFrontRealistic : bodyBackRealistic} 
                alt={`${gender} body diagram - ${currentView} view`}
                className="w-full h-full object-contain rounded-lg"
              />

              {/* Interactive body part points */}
              {bodyParts?.length > 0 ? (
                bodyParts.map((part, index) => {
                  const position = getBodyPartPosition(part.Body_part, currentView);
                  const isSelected = selectedBodyParts.includes(part.Body_part);
                  const isHovered = hoveredPart === part.Body_part;
                  
                  return (
                  <div
                    key={`${part.Body_part}-${index}`}
                    className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all duration-300 border-2 border-white shadow-xl ${
                      isSelected 
                        ? "bg-green-500 scale-150 ring-4 ring-green-300 animate-none" 
                        : "bg-red-500 animate-pulse hover:bg-blue-500 hover:scale-150 hover:animate-none"
                    }`}
                    style={{
                      top: position.top,
                      left: position.left,
                      transform: "translate(-50%, -50%)",
                      zIndex: 30,
                      boxShadow: isSelected 
                        ? "0 0 20px rgba(34, 197, 94, 0.8), 0 0 10px rgba(255, 255, 255, 0.5)" 
                        : "0 0 15px rgba(239, 68, 68, 0.8), 0 0 5px rgba(255, 255, 255, 0.5)"
                    }}
                    onClick={() => handleBodyPartClick(part.Body_part)}
                    onMouseEnter={() => setHoveredPart(part.Body_part)}
                    onMouseLeave={() => setHoveredPart(null)}
                  >
                    {/* Enhanced Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-3 py-2 bg-gray-900 text-white border rounded-lg shadow-xl text-sm whitespace-nowrap z-50 font-medium animate-fade-in">
                        <div className="text-center">{part.Body_part}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </div>
                  );
                })
              ) : (
                <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm z-40">
                  {isLoading ? "Loading body parts..." : "No body parts found for this view"}
                </div>
              )}
            </div>
            
            {/* Selected body parts display */}
            {selectedBodyParts.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Area:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBodyParts.map((part) => (
                    <span
                      key={part}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {part}
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
            Continue with Selected Area
          </Button>
        </div>
      )}
    </div>
  );
};

export default BodyMap;