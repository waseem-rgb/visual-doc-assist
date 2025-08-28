import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import bodyFrontRealistic from "@/assets/body-front-realistic.png";
import bodyBackRealistic from "@/assets/body-back-realistic.png";
import bodyFrontFemale from "@/assets/body-front-female.png";
import bodyBackFemale from "@/assets/body-back-female.png";
import SymptomViewer from "./SymptomViewer";
import QuadrantBodySelector from "./QuadrantBodySelector";
import DetailedBodyView from "./DetailedBodyView";
import MaskBodySelector from "./MaskBodySelector";
import SimpleBodySelector from "./SimpleBodySelector";
import SVGBodySelector from "./SVGBodySelector";

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
  const [showSymptomViewer, setShowSymptomViewer] = useState(false);
  const [leftSideOpen, setLeftSideOpen] = useState(true);
  const [rightSideOpen, setRightSideOpen] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [useMaskSelector, setUseMaskSelector] = useState(true);
  
  // Two-step selection state
  const [selectionStep, setSelectionStep] = useState<"quadrant" | "detailed">("quadrant");
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

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

  // Filter body parts based on current view and gender with more flexible matching
  const bodyParts = allBodyParts?.filter(part => {
    if (!part?.Body_part || !part?.View || !part?.["Specific rules"]) return false;
    
    // More flexible view matching
    const partView = part.View?.trim();
    const matchesView = partView === currentView || 
      (currentView === "Front" && partView === "Front") ||
      (currentView === "Back view" && partView === "Back view");
    
    // Gender rules matching
    const specificRules = part["Specific rules"]?.trim();
    const genderRules = [
      "shown to Both gender", 
      gender === "male" ? "Only to Male patient" : "Only to Female patient"
    ];
    const matchesGender = genderRules.some(rule => specificRules?.includes(rule));
    
    console.log(`Part: ${part.Body_part}, View: ${partView} (matches: ${matchesView}), Rules: ${specificRules} (matches: ${matchesGender})`);
    
    return matchesView && matchesGender;
  }) || [];

  // Split body parts into left and right sides
  const leftSideBodyParts = bodyParts.slice(0, Math.ceil(bodyParts.length / 2));
  const rightSideBodyParts = bodyParts.slice(Math.ceil(bodyParts.length / 2));

  const handleBodyPartClick = (bodyPart: string) => {
    // Only allow single selection - replace current selection
    setSelectedBodyParts([bodyPart]);
    setHoveredPart(null); // Clear hover when selecting
  };

  const handleBodyPartHover = (bodyPart: string | null) => {
    setHoveredPart(bodyPart);
  };
  
  // Quadrant selection handlers
  const handleQuadrantSelect = (quadrant: string) => {
    setSelectedQuadrant(quadrant);
    setSelectionStep("detailed");
    setSelectedBodyParts([]); // Reset selection when entering detailed view
  };
  
  const handleBackToQuadrants = () => {
    setSelectionStep("quadrant");
    setSelectedQuadrant(null);
    setHoveredPart(null);
  };

  const handleContinue = () => {
    if (selectedBodyParts.length > 0) {
      setShowSymptomViewer(true);
    }
  };

  const handleBackToBodyMap = () => {
    setShowSymptomViewer(false);
    // Stay in the current selection step when returning from symptom viewer
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

  if (showSymptomViewer && selectedBodyParts.length > 0) {
    return (
      <SymptomViewer
        bodyPart={selectedBodyParts[0]}
        patientData={patientData}
        onBack={handleBackToBodyMap}
      />
    );
  }

  return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4">Select Affected Body Areas</h3>
          <p className="text-muted-foreground mb-6">
            {selectionStep === "quadrant" 
              ? "First, select the general area of your body where you have symptoms"
              : "Now, select the specific body part from the detailed view"
            }
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
          
          {/* Debug controls - hidden as requested */}
          {/* {selectionStep === "detailed" && (
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={debugMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
              >
                {debugMode ? "Debug: ON" : "Debug: OFF"}
              </Button>
              <Button
                variant={useMaskSelector ? "outline" : "default"}
                size="sm"
                onClick={() => setUseMaskSelector(!useMaskSelector)}
              >
                {useMaskSelector ? "Switch to Simple" : "Simple Mode (Active)"}
              </Button>
            </div>
          )} */}
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {/* Step 1: Quadrant Selection */}
            {selectionStep === "quadrant" && (
              <QuadrantBodySelector
                imageUrl={gender === "male" 
                  ? (currentView === "Front" ? bodyFrontRealistic : bodyBackRealistic)
                  : (currentView === "Front" ? bodyFrontFemale : bodyBackFemale)
                }
                gender={gender}
                currentView={currentView}
                onQuadrantSelect={handleQuadrantSelect}
              />
            )}
            
            {/* Step 2: Detailed Body Part Selection */}
            {selectionStep === "detailed" && selectedQuadrant && (
              <DetailedBodyView
                quadrant={selectedQuadrant}
                imageUrl={gender === "male" 
                  ? (currentView === "Front" ? bodyFrontRealistic : bodyBackRealistic)
                  : (currentView === "Front" ? bodyFrontFemale : bodyBackFemale)
                }
                gender={gender}
                currentView={currentView}
                selectedBodyParts={selectedBodyParts}
                hoveredPart={hoveredPart}
                onBodyPartHover={handleBodyPartHover}
                onBodyPartClick={handleBodyPartClick}
                onBack={handleBackToQuadrants}
                bodyParts={bodyParts}
              />
            )}
          </div>
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

      {selectedBodyParts.length > 0 && (
        <div className="text-center">
          <Button className="gradient-primary" size="lg" onClick={handleContinue}>
            Continue with Selected Area
          </Button>
        </div>
      )}
    </div>
  );
};

export default BodyMap;