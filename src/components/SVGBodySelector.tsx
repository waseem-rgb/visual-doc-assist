import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SVGBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
}

// Precise SVG path definitions for body parts
const getBodyPartPaths = (view: string, gender: string) => {
  if (view === "Front") {
    return [
      // Head and face
      { name: "FACE", path: "M 200,60 L 280,60 L 280,140 L 200,140 Z", viewBox: "0 0 500 700" },
      { name: "HAIR AND SCALP", path: "M 180,20 L 300,20 L 300,80 L 180,80 Z", viewBox: "0 0 500 700" },
      { name: "NECK", path: "M 220,140 L 260,140 L 260,180 L 220,180 Z", viewBox: "0 0 500 700" },
      
      // Eyes, nose, mouth
      { name: "EYE PHYSICAL", path: "M 200,80 L 280,80 L 280,100 L 200,100 Z", viewBox: "0 0 500 700" },
      { name: "NOSE", path: "M 230,100 L 250,100 L 250,120 L 230,120 Z", viewBox: "0 0 500 700" },
      { name: "MOUTH", path: "M 220,120 L 260,120 L 260,140 L 220,140 Z", viewBox: "0 0 500 700" },
      
      // Ears
      { name: "EAR PHYSICAL", path: "M 180,90 L 200,90 L 200,110 L 180,110 Z", viewBox: "0 0 500 700" },
      
      // Shoulders and chest
      { name: "SHOULDER FRONT", path: "M 120,180 L 360,180 L 360,220 L 120,220 Z", viewBox: "0 0 500 700" },
      { name: "CHEST UPPER", path: "M 180,220 L 300,220 L 300,280 L 180,280 Z", viewBox: "0 0 500 700" },
      { name: "CHEST CENTRAL", path: "M 200,280 L 280,280 L 280,340 L 200,340 Z", viewBox: "0 0 500 700" },
      
      // Arms
      { name: "UPPER ARM", path: "M 80,220 L 140,220 L 140,340 L 80,340 Z", viewBox: "0 0 500 700" },
      { name: "FOREARM AND WRIST", path: "M 60,340 L 120,340 L 120,460 L 60,460 Z", viewBox: "0 0 500 700" },
      { name: "HAND PALM", path: "M 40,460 L 100,460 L 100,500 L 40,500 Z", viewBox: "0 0 500 700" },
      
      // Abdomen
      { name: "UPPER ABDOMEN", path: "M 200,340 L 280,340 L 280,400 L 200,400 Z", viewBox: "0 0 500 700" },
      { name: "ABDOMEN GENERAL", path: "M 180,400 L 300,400 L 300,480 L 180,480 Z", viewBox: "0 0 500 700" },
      { name: "LOWER ABDOMEN LEFT", path: "M 180,480 L 240,480 L 240,520 L 180,520 Z", viewBox: "0 0 500 700" },
      { name: "LOWER ABDOMEN RIGHT", path: "M 240,480 L 300,480 L 300,520 L 240,520 Z", viewBox: "0 0 500 700" },
      
      // Genitals and groin
      { name: "GROIN MALE AND FEMALE", path: "M 210,520 L 270,520 L 270,560 L 210,560 Z", viewBox: "0 0 500 700" },
      
      // Hips and legs
      { name: "HIP FRONT", path: "M 160,560 L 320,560 L 320,600 L 160,600 Z", viewBox: "0 0 500 700" },
      { name: "THIGH FRONT", path: "M 180,600 L 300,600 L 300,720 L 180,720 Z", viewBox: "0 0 500 700" },
      { name: "KNEE FRONT", path: "M 190,720 L 290,720 L 290,760 L 190,760 Z", viewBox: "0 0 500 700" },
      { name: "LOWER LEG FRONT", path: "M 200,760 L 280,760 L 280,880 L 200,880 Z", viewBox: "0 0 500 700" },
      
      // Feet
      { name: "ANKLE", path: "M 210,880 L 270,880 L 270,900 L 210,900 Z", viewBox: "0 0 500 700" },
      { name: "FOOT", path: "M 200,900 L 280,900 L 280,940 L 200,940 Z", viewBox: "0 0 500 700" },
    ];
  } else {
    return [
      // Back view paths
      { name: "HAIR AND SCALP", path: "M 180,20 L 300,20 L 300,80 L 180,80 Z", viewBox: "0 0 500 700" },
      { name: "SHOULDER BACK", path: "M 120,180 L 360,180 L 360,220 L 120,220 Z", viewBox: "0 0 500 700" },
      { name: "UPPER BACK", path: "M 180,220 L 300,220 L 300,400 L 180,400 Z", viewBox: "0 0 500 700" },
      { name: "LOWER BACK", path: "M 190,400 L 290,400 L 290,500 L 190,500 Z", viewBox: "0 0 500 700" },
      { name: "BUTTOCKS AND ANUS", path: "M 200,500 L 280,500 L 280,560 L 200,560 Z", viewBox: "0 0 500 700" },
      { name: "HIP BACK", path: "M 160,560 L 320,560 L 320,600 L 160,600 Z", viewBox: "0 0 500 700" },
      { name: "KNEE BACK", path: "M 190,720 L 290,720 L 290,760 L 190,760 Z", viewBox: "0 0 500 700" },
      { name: "LOWER LEG BACK", path: "M 200,760 L 280,760 L 280,880 L 200,880 Z", viewBox: "0 0 500 700" },
    ];
  }
};

const SVGBodySelector = ({
  imageUrl,
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  bodyParts
}: SVGBodySelectorProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const availablePaths = getBodyPartPaths(currentView, gender).filter(path => 
    bodyParts.some(part => part.Body_part === path.name)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {gender === "male" ? "Male" : "Female"} Body - {currentView} View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto">
          <div className="relative">
            {/* Body image */}
            <img 
              src={imageUrl} 
              alt={`${gender} body ${currentView} view`}
              className="w-full h-auto"
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* SVG overlay for clickable regions */}
            {imageLoaded && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 500 700"
                preserveAspectRatio="xMidYMid meet"
              >
                {availablePaths.map((region) => (
                  <g key={region.name}>
                    {/* Invisible clickable area */}
                    <path
                      d={region.path}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="2"
                      className="pointer-events-auto cursor-pointer"
                      onMouseEnter={() => onBodyPartHover(region.name)}
                      onMouseLeave={() => onBodyPartHover(null)}
                      onClick={() => onBodyPartClick(region.name)}
                    />
                    
                    {/* Visible highlight when hovered or selected */}
                    {(hoveredPart === region.name || selectedBodyParts.includes(region.name)) && (
                      <path
                        d={region.path}
                        fill={selectedBodyParts.includes(region.name) ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}
                        stroke={selectedBodyParts.includes(region.name) ? "#10b981" : "#3b82f6"}
                        strokeWidth="2"
                        className="pointer-events-none"
                      />
                    )}
                  </g>
                ))}
              </svg>
            )}
            
            {/* Body part label */}
            {hoveredPart && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium shadow-lg border border-white/20 pointer-events-none z-10">
                {hoveredPart}
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-center">
            <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm text-muted-foreground">
              {hoveredPart ? (
                <span className="text-primary font-medium">Click to select: {hoveredPart}</span>
              ) : (
                "Hover over body areas to see names and click to select"
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SVGBodySelector;