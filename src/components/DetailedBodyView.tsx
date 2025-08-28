import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Import gender-specific dedicated images for each body part
import headFrontMale from "@/assets/head-front-male.jpg";
import headFrontFemale from "@/assets/head-front-female.jpg";
import headBackMale from "@/assets/head-back-male.jpg";
import headBackFemale from "@/assets/head-back-female.jpg";
import chestFrontMale from "@/assets/chest-front-male.jpg";
import chestFrontFemale from "@/assets/chest-front-female.jpg";
import chestBackMale from "@/assets/chest-back-male.jpg";
import chestBackFemale from "@/assets/chest-back-female.jpg";
import abdomenFrontMale from "@/assets/abdomen-front-male.jpg";
import abdomenFrontFemale from "@/assets/abdomen-front-female.jpg";
import abdomenBackMale from "@/assets/abdomen-back-male.jpg";
import abdomenBackFemale from "@/assets/abdomen-back-female.jpg";
import armsFrontMale from "@/assets/arms-front-male.jpg";
import armsFrontFemale from "@/assets/arms-front-female.jpg";
import armsBackMale from "@/assets/arms-back-male.jpg";
import armsBackFemale from "@/assets/arms-back-female.jpg";
import legsFrontMale from "@/assets/legs-front-male.jpg";
import legsFrontFemale from "@/assets/legs-front-female.jpg";
import legsBackMale from "@/assets/legs-back-male.jpg";
import legsBackFemale from "@/assets/legs-back-female.jpg";

interface DetailedBodyViewProps {
  quadrant: string;
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
  onBack: () => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
}

// Get the correct gender-specific dedicated image for each quadrant and view
const getQuadrantImage = (quadrant: string, view: string, gender: "male" | "female") => {
  const imageMap: Record<string, Record<string, Record<string, string>>> = {
    head: {
      Front: { male: headFrontMale, female: headFrontFemale },
      "Back view": { male: headBackMale, female: headBackFemale },
    },
    chest: {
      Front: { male: chestFrontMale, female: chestFrontFemale },
      "Back view": { male: chestBackMale, female: chestBackFemale },
    },
    abdomen: {
      Front: { male: abdomenFrontMale, female: abdomenFrontFemale },
      "Back view": { male: abdomenBackMale, female: abdomenBackFemale },
    },
    back: {
      "Back view": { male: chestBackMale, female: chestBackFemale }, // Use chest back for back quadrant
    },
    buttocks: {
      "Back view": { male: abdomenBackMale, female: abdomenBackFemale }, // Use abdomen back for buttocks
    },
    arms: {
      Front: { male: armsFrontMale, female: armsFrontFemale },
      "Back view": { male: armsBackMale, female: armsBackFemale },
    },
    legs: {
      Front: { male: legsFrontMale, female: legsFrontFemale },
      "Back view": { male: legsBackMale, female: legsBackFemale },
    }
  };
  
  return imageMap[quadrant]?.[view]?.[gender] || headFrontMale;
};

// Define detailed body parts with anatomically correct positioning and no overlaps
const getQuadrantParts = (quadrant: string, view: string) => {
  const parts: Record<string, any> = {
    head: {
      Front: [
        { name: "HAIR AND SCALP", x1: 0.25, y1: 0.02, x2: 0.75, y2: 0.25 },
        { name: "HEAD FRONT", x1: 0.35, y1: 0.12, x2: 0.65, y2: 0.25 },
        { name: "HEAD SIDE", x1: 0.15, y1: 0.30, x2: 0.25, y2: 0.45 },
        { name: "FACE", x1: 0.35, y1: 0.28, x2: 0.65, y2: 0.65 },
        // Separate eye dots to avoid overlap - left and right eyes
        { name: "EYE VISION", x1: 0.32, y1: 0.35, x2: 0.44, y2: 0.42 }, // Left eye vision
        { name: "EYE PHYSICAL", x1: 0.56, y1: 0.35, x2: 0.68, y2: 0.42 }, // Right eye physical
        { name: "NOSE", x1: 0.46, y1: 0.48, x2: 0.54, y2: 0.58 },
        { name: "MOUTH", x1: 0.42, y1: 0.62, x2: 0.58, y2: 0.68 },
        { name: "EAR PHYSICAL", x1: 0.15, y1: 0.42, x2: 0.25, y2: 0.52 },
        { name: "EAR HEARING", x1: 0.75, y1: 0.42, x2: 0.85, y2: 0.52 },
        { name: "NECK", x1: 0.40, y1: 0.76, x2: 0.60, y2: 0.88 },
        { name: "THROAT", x1: 0.42, y1: 0.78, x2: 0.58, y2: 0.84 },
        { name: "THROAT VOICE", x1: 0.44, y1: 0.80, x2: 0.56, y2: 0.86 },
      ],
      "Back view": [
        { name: "HAIR AND SCALP", x1: 0.20, y1: 0.02, x2: 0.80, y2: 0.85 },
      ]
    },
    chest: {
      Front: [
        { name: "SHOULDER FRONT", x1: 0.15, y1: 0.08, x2: 0.35, y2: 0.18 }, // Left shoulder on actual shoulder
        { name: "CHEST UPPER", x1: 0.30, y1: 0.25, x2: 0.70, y2: 0.42 },
        { name: "CHEST CENTRAL", x1: 0.35, y1: 0.45, x2: 0.65, y2: 0.62 },
        { name: "CHEST SIDE", x1: 0.65, y1: 0.30, x2: 0.80, y2: 0.45 }, // Right chest side moved to proper chest area
        { name: "BREAST", x1: 0.35, y1: 0.30, x2: 0.65, y2: 0.50 }, // Over actual breast area
      ],
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.15, y1: 0.05, x2: 0.85, y2: 0.20 },
        { name: "UPPER BACK", x1: 0.18, y1: 0.25, x2: 0.82, y2: 0.85 },
      ]
    },
    abdomen: {
      Front: [
        { name: "UPPER ABDOMEN", x1: 0.30, y1: 0.05, x2: 0.70, y2: 0.20 },
        { name: "ABDOMEN GENERAL", x1: 0.35, y1: 0.25, x2: 0.65, y2: 0.40 },
        { name: "LOWER ABDOMEN LEFT", x1: 0.20, y1: 0.45, x2: 0.45, y2: 0.58 },
        { name: "LOWER ABDOMEN RIGHT", x1: 0.55, y1: 0.45, x2: 0.80, y2: 0.58 },
        { name: "FEMALE LOWER ABDOMEN", x1: 0.30, y1: 0.60, x2: 0.70, y2: 0.70 },
        { name: "BOWELS DIARRHOEA", x1: 0.10, y1: 0.35, x2: 0.22, y2: 0.50 }, // Left flank
        { name: "BOWELS CONSTIPATION", x1: 0.78, y1: 0.35, x2: 0.90, y2: 0.50 }, // Right flank
        { name: "BOWELS ABNORMAL STOOL", x1: 0.32, y1: 0.50, x2: 0.68, y2: 0.60 },
        { name: "GROIN MALE AND FEMALE", x1: 0.35, y1: 0.72, x2: 0.65, y2: 0.80 },
        { name: "MALE GENITALS", x1: 0.42, y1: 0.82, x2: 0.58, y2: 0.90 },
        { name: "FEMALE GENITALS", x1: 0.40, y1: 0.84, x2: 0.60, y2: 0.92 },
        { name: "URINARY PROBLEMS MALE", x1: 0.38, y1: 0.76, x2: 0.62, y2: 0.84 },
        { name: "URINARY PROBLEMS FEMALE", x1: 0.36, y1: 0.78, x2: 0.64, y2: 0.86 },
      ],
      "Back view": [
        { name: "LOWER BACK", x1: 0.22, y1: 0.02, x2: 0.78, y2: 0.52 },
        { name: "BUTTOCKS AND ANUS", x1: 0.18, y1: 0.55, x2: 0.82, y2: 0.88 },
      ]
    },
    back: {
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.08, y1: 0.02, x2: 0.92, y2: 0.25 },
        { name: "UPPER BACK", x1: 0.18, y1: 0.28, x2: 0.82, y2: 0.85 },
      ]
    },
    buttocks: {
      "Back view": [
        { name: "LOWER BACK", x1: 0.22, y1: 0.02, x2: 0.78, y2: 0.38 },
        { name: "BUTTOCKS AND ANUS", x1: 0.18, y1: 0.42, x2: 0.82, y2: 0.85 },
      ]
    },
    arms: {
      Front: [
        { name: "UPPER ARM", x1: 0.20, y1: 0.05, x2: 0.80, y2: 0.40 },
        { name: "FOREARM AND WRIST", x1: 0.25, y1: 0.45, x2: 0.75, y2: 0.70 },
        { name: "HAND PALM", x1: 0.30, y1: 0.75, x2: 0.70, y2: 0.95 },
      ],
      "Back view": [
        { name: "UPPER ARM", x1: 0.20, y1: 0.05, x2: 0.80, y2: 0.40 },
        { name: "ELBOW", x1: 0.40, y1: 0.42, x2: 0.60, y2: 0.48 },
        { name: "HAND BACK", x1: 0.30, y1: 0.75, x2: 0.70, y2: 0.95 },
      ]
    },
      legs: {
        Front: [
          { name: "HIP FRONT", x1: 0.35, y1: 0.02, x2: 0.65, y2: 0.12 },
          { name: "THIGH FRONT", x1: 0.28, y1: 0.18, x2: 0.72, y2: 0.48 },
          { name: "KNEE FRONT", x1: 0.35, y1: 0.50, x2: 0.65, y2: 0.58 },
          { name: "LOWER LEG FRONT", x1: 0.32, y1: 0.62, x2: 0.68, y2: 0.82 },
          { name: "ANKLE", x1: 0.38, y1: 0.84, x2: 0.62, y2: 0.90 },
          { name: "FOOT", x1: 0.28, y1: 0.92, x2: 0.72, y2: 0.98 },
          { name: "FOOT UPPER", x1: 0.30, y1: 0.88, x2: 0.70, y2: 0.94 },
          { name: "FOOT UNDERSIDE", x1: 0.32, y1: 0.94, x2: 0.68, y2: 0.98 },
        ],
        "Back view": [
          { name: "HIP BACK", x1: 0.35, y1: 0.02, x2: 0.65, y2: 0.12 },
          { name: "THIGH BACK", x1: 0.28, y1: 0.18, x2: 0.72, y2: 0.48 },
          { name: "KNEE BACK", x1: 0.35, y1: 0.50, x2: 0.65, y2: 0.58 },
          { name: "LOWER LEG BACK", x1: 0.32, y1: 0.62, x2: 0.68, y2: 0.82 },
          { name: "ANKLE", x1: 0.38, y1: 0.84, x2: 0.62, y2: 0.90 },
          { name: "FOOT", x1: 0.28, y1: 0.92, x2: 0.72, y2: 0.98 },
          { name: "FOOT UNDERSIDE", x1: 0.32, y1: 0.94, x2: 0.68, y2: 0.98 },
        ]
    }
  };
  
  return parts[quadrant]?.[view] || [];
};

const getQuadrantTitle = (quadrant: string, view: string) => {
  const titles: Record<string, Record<string, string>> = {
    head: { Front: "Head & Face - Front View", "Back view": "Head - Back View" },
    chest: { Front: "Chest & Upper Body - Front View", "Back view": "Back & Shoulders - Back View" },
    abdomen: { Front: "Abdomen & Core - Front View", "Back view": "Lower Back - Back View" },
    arms: { Front: "Arms & Hands - Front View", "Back view": "Arms & Hands - Back View" },
    legs: { Front: "Legs & Feet - Front View", "Back view": "Legs & Feet - Back View" },
    back: { "Back view": "Back & Shoulders" },
    buttocks: { "Back view": "Buttocks & Hip" }
  };
  
  return titles[quadrant]?.[view] || `${quadrant} - ${view}`;
};

const DetailedBodyView = ({
  quadrant,
  imageUrl, // This parameter is no longer used - we use dedicated images now
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  onBack,
  bodyParts
}: DetailedBodyViewProps) => {
  const parts = getQuadrantParts(quadrant, currentView).filter(part => {
    // More robust matching - case insensitive and flexible
    const bodyPart = bodyParts.find(bp => {
      const dbPartName = bp.Body_part?.trim().toUpperCase();
      const coordPartName = part.name?.trim().toUpperCase();
      
      // Direct match
      if (dbPartName === coordPartName) return true;
      
      // Handle variations and partial matches
      if (dbPartName && coordPartName) {
        // Handle cases like "EYE PHYSICAL LEFT" vs "EYE PHYSICAL"
        if (coordPartName.includes("EYE") && dbPartName.includes("EYE")) {
          if (coordPartName.includes("PHYSICAL") && dbPartName.includes("PHYSICAL")) return true;
          if (coordPartName.includes("VISION") && dbPartName.includes("VISION")) return true;
        }
        
        // Handle throat variations
        if (coordPartName.includes("THROAT") && dbPartName.includes("THROAT")) return true;
        
        // Handle nose
        if (coordPartName === "NOSE" && dbPartName === "NOSE") return true;
        
        // Handle other exact matches
        if (dbPartName === coordPartName) return true;
      }
      
      return false;
    });
    
    if (!bodyPart) {
      console.log(`No database match found for coordinate part: ${part.name}`);
      return false;
    }
    
    // Check gender-specific rules
    const specificRules = bodyPart["Specific rules"];
    if (specificRules?.includes("Only to Male patient") && gender !== "male") return false;
    if (specificRules?.includes("Only to Female patient") && gender !== "female") return false;
    
    return true;
  });
  
  const title = getQuadrantTitle(quadrant, currentView);
  const dedicatedImage = getQuadrantImage(quadrant, currentView, gender);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const part = parts.find(p => 
      x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2
    );
    
    onBodyPartHover(part?.name || null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const part = parts.find(p => 
      x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2
    );
    
    if (part?.name) {
      onBodyPartClick(part.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Areas
          </Button>
          <div>
            <CardTitle className="text-lg">Step 2: {title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on the specific body part where you have symptoms
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-2xl mx-auto">
          <div 
            className="relative cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={() => onBodyPartHover(null)}
          >
            {/* Dedicated body part image for this specific quadrant */}
            <div className="overflow-hidden rounded-lg border bg-gradient-to-b from-blue-50 to-purple-50">
              <img 
                src={dedicatedImage} 
                alt={`${quadrant} ${currentView} detailed view`}
                className="w-full h-auto max-h-[600px] object-contain"
              />
            </div>
            
            {/* Interactive red dots for each body part */}
            {parts.map((part) => {
              const centerX = (part.x1 + part.x2) / 2;
              const centerY = (part.y1 + part.y2) / 2;
              
              return (
                <div key={part.name}>
                  {/* Clickable area - invisible but covers the body part region */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${part.x1 * 100}%`,
                      top: `${part.y1 * 100}%`,
                      width: `${(part.x2 - part.x1) * 100}%`,
                      height: `${(part.y2 - part.y1) * 100}%`,
                    }}
                  />
                  
                  {/* Red blinking dot at center */}
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: `${centerX * 100}%`,
                      top: `${centerY * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                        hoveredPart === part.name 
                          ? 'bg-blue-500 scale-150' 
                          : selectedBodyParts.includes(part.name)
                          ? 'bg-green-500 scale-125'
                          : 'bg-red-500 animate-pulse'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
            
            {/* Hover label */}
            {hoveredPart && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg border border-white/20 pointer-events-none z-10">
                Click to select: {hoveredPart} ✓
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-center">
            <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm text-muted-foreground">
              {hoveredPart ? (
                <span className="text-primary font-medium">Click to select: {hoveredPart}</span>
              ) : (
                `Hover over the labeled areas to see body part names, then click to select`
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedBodyView;