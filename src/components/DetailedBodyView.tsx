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
        { name: "HEAD FRONT", x1: 0.42, y1: 0.16, x2: 0.58, y2: 0.25 }, // Forehead center
        { name: "HEAD SIDE", x1: 0.765, y1: 0.285, x2: 0.805, y2: 0.345 }, // Right head side (hairline exact)
        { name: "FACE", x1: 0.34, y1: 0.52, x2: 0.40, y2: 0.60 }, // Left cheek
        // Separate eye dots to avoid overlap - left and right eyes
        { name: "EYE VISION", x1: 0.42, y1: 0.40, x2: 0.46, y2: 0.45 }, // Left eye center
        { name: "EYE PHYSICAL", x1: 0.56, y1: 0.40, x2: 0.60, y2: 0.45 }, // Right eye center
        { name: "NOSE", x1: 0.49, y1: 0.48, x2: 0.51, y2: 0.54 }, // Nose tip
        { name: "MOUTH", x1: 0.48, y1: 0.60, x2: 0.52, y2: 0.66 }, // Lips center
        { name: "EAR PHYSICAL", x1: 0.725, y1: 0.455, x2: 0.775, y2: 0.545 }, // Right ear - spot on ear
        { name: "EAR HEARING", x1: 0.22, y1: 0.46, x2: 0.28, y2: 0.54 }, // Left ear - spot on ear
        { name: "NECK", x1: 0.45, y1: 0.82, x2: 0.55, y2: 0.93 }, // Lower neck
        { name: "THROAT", x1: 0.47, y1: 0.76, x2: 0.53, y2: 0.82 }, // Throat area - moved down
        { name: "THROAT VOICE", x1: 0.48, y1: 0.78, x2: 0.52, y2: 0.84 }, // Voice box - moved down
      ],
      "Back view": [
        { name: "HAIR AND SCALP", x1: 0.20, y1: 0.02, x2: 0.80, y2: 0.85 },
      ]
    },
    chest: {
      Front: [
        { name: "SHOULDER FRONT", x1: 0.14, y1: 0.12, x2: 0.26, y2: 0.24 }, // Left shoulder cap (placed directly over deltoid)
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
    // Robust matching with expanded synonyms and case-insensitive handling
    const bodyPart = bodyParts.find(bp => {
      const dbPartName = bp.Body_part?.trim().toUpperCase();
      const coordPartName = part.name?.trim().toUpperCase();
      
      // Direct exact match first
      if (dbPartName === coordPartName) return true;
      
      // Handle variations and synonyms for head parts specifically
      if (dbPartName && coordPartName) {
        // Nose matching
        if (coordPartName === "NOSE" && (dbPartName === "NOSE" || dbPartName.includes("NASAL"))) return true;
        
        // Eye variations - more comprehensive
        if (coordPartName.includes("EYE")) {
          if (coordPartName.includes("PHYSICAL") && (dbPartName.includes("EYE") && dbPartName.includes("PHYSICAL"))) return true;
          if (coordPartName.includes("VISION") && (dbPartName.includes("EYE") && (dbPartName.includes("VISION") || dbPartName.includes("SIGHT")))) return true;
          // General eye match
          if (dbPartName.includes("EYE") && !dbPartName.includes("EYEBROW")) return true;
        }
        
        // Throat variations - comprehensive
        if (coordPartName.includes("THROAT")) {
          if (dbPartName.includes("THROAT")) return true;
          // Handle throat voice specifically
          if (coordPartName.includes("VOICE") && dbPartName.includes("VOICE")) return true;
        }
        
        // Face and other head parts
        if (coordPartName === "FACE" && dbPartName === "FACE") return true;
        if (coordPartName === "MOUTH" && dbPartName === "MOUTH") return true;
        if (coordPartName === "NECK" && dbPartName === "NECK") return true;
        
        // Hair and scalp
        if (coordPartName.includes("HAIR") && dbPartName.includes("HAIR")) return true;
        if (coordPartName.includes("SCALP") && dbPartName.includes("SCALP")) return true;
        
        // Ear variations
        if (coordPartName.includes("EAR")) {
          if (coordPartName.includes("PHYSICAL") && (dbPartName.includes("EAR") && dbPartName.includes("PHYSICAL"))) return true;
          if (coordPartName.includes("HEARING") && (dbPartName.includes("EAR") && dbPartName.includes("HEARING"))) return true;
        }
        
        // All other exact matches
        if (dbPartName === coordPartName) return true;
      }
      
      return false;
    });
    
    if (!bodyPart) {
      console.log(`No database match found for coordinate part: ${part.name} (available DB parts: ${bodyParts.map(bp => bp.Body_part).join(', ')})`);
      
      // Safety fallback - if it's a critical head part, still show it
      const criticalHeadParts = ["NOSE", "EYE PHYSICAL", "EYE VISION", "THROAT", "THROAT VOICE", "MOUTH", "FACE", "NECK"];
      if (criticalHeadParts.includes(part.name)) {
        console.log(`Allowing critical head part ${part.name} despite no DB match (safety fallback)`);
        return true;
      }
      
      return false;
    }
    
    // Check gender-specific rules with case-insensitive matching
    const specificRules = bodyPart["Specific rules"]?.toLowerCase() || "";
    if (specificRules.includes("only to male") && gender !== "male") return false;
    if (specificRules.includes("only to female") && gender !== "female") return false;
    
    return true;
  });
  
  console.log(`DetailedBodyView for ${quadrant} ${currentView} (${gender}): ${parts.length} parts rendered: ${parts.map(p => p.name).join(', ')}`);

  const title = getQuadrantTitle(quadrant, currentView);
  const dedicatedImage = getQuadrantImage(quadrant, currentView, gender);

  // Priority-based part selection to handle overlapping regions
  const getPartPriority = (partName: string): number => {
    const priorities: Record<string, number> = {
      // Highest priority - small specific features
      "EYE PHYSICAL": 10,
      "EYE VISION": 10, 
      "NOSE": 10,
      "THROAT": 10,
      "THROAT VOICE": 10,
      "MOUTH": 9,
      // Medium priority
      "EAR PHYSICAL": 8,
      "EAR HEARING": 8,
      // Lower priority - larger general areas
      "FACE": 3,
      "NECK": 3,
      "HEAD FRONT": 2,
      "HEAD SIDE": 2,
      "HAIR AND SCALP": 1
    };
    return priorities[partName] || 5; // Default medium priority
  };

  const selectBestPart = (x: number, y: number) => {
    // Find all parts that contain the cursor position
    const matchingParts = parts.filter(p => 
      x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2
    );

    if (matchingParts.length === 0) return null;
    if (matchingParts.length === 1) return matchingParts[0];

    // Rank by priority, then by area (smaller area = more specific)
    const bestPart = matchingParts.reduce((best, current) => {
      const bestPriority = getPartPriority(best.name);
      const currentPriority = getPartPriority(current.name);
      
      // Higher priority wins
      if (currentPriority > bestPriority) return current;
      if (bestPriority > currentPriority) return best;
      
      // Same priority - smaller area wins (more specific)
      const bestArea = (best.x2 - best.x1) * (best.y2 - best.y1);
      const currentArea = (current.x2 - current.x1) * (current.y2 - current.y1);
      
      return currentArea < bestArea ? current : best;
    });

    return bestPart;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const part = selectBestPart(x, y);
    onBodyPartHover(part?.name || null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const part = selectBestPart(x, y);
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
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on the specific body part where you have symptoms
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-2xl mx-auto">
          <div 
            className="relative overflow-hidden rounded-lg border bg-gradient-to-b from-accent to-accent/70 cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={() => onBodyPartHover(null)}
          >
            {/* Dedicated body part image for this specific quadrant */}
            <img 
              src={dedicatedImage} 
              alt={`${quadrant} ${currentView} detailed view`}
              className="block w-full h-auto max-h-[600px] object-contain"
            />
            
            {/* Interactive red dots for each body part - positioned relative to the image container */}
            {parts.map((part) => {
              const centerX = (part.x1 + part.x2) / 2;
              const centerY = (part.y1 + part.y2) / 2;
              
              // Calculate z-index based on priority and area (smaller = higher z-index)
              const area = (part.x2 - part.x1) * (part.y2 - part.y1);
              const priority = getPartPriority(part.name);
              const zIndex = Math.round(priority * 10 + (1 / area) * 100); // Higher priority and smaller area = higher z-index
              
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
                    className="absolute pointer-events-none"
                    style={{
                      left: `${centerX * 100}%`,
                      top: `${centerY * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: zIndex
                    }}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                        hoveredPart === part.name 
                          ? 'bg-primary scale-150' 
                          : selectedBodyParts.includes(part.name)
                          ? 'bg-green-500 scale-125'
                          : `bg-red-500 ${part.name === 'SHOULDER FRONT' ? '' : 'animate-pulse'}`
                      }`}
                    />
                  </div>
                </div>
              );
            })}
            
            {/* Hover label - relative to image box */}
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