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

// Precise SVG path definitions based on actual body image analysis
const getBodyPartPaths = (view: string, gender: string) => {
  if (view === "Front") {
    return [
      // Head region (0-15% height) - precisely positioned
      { name: "HAIR AND SCALP", path: "M 200,0 L 300,0 L 300,50 L 200,50 Z", viewBox: "0 0 500 600" },
      { name: "HEAD FRONT", path: "M 210,20 L 290,20 L 290,80 L 210,80 Z", viewBox: "0 0 500 600" },
      { name: "HEAD SIDE", path: "M 180,30 L 320,30 L 320,90 L 180,90 Z", viewBox: "0 0 500 600" },
      { name: "FACE", path: "M 215,50 L 285,50 L 285,110 L 215,110 Z", viewBox: "0 0 500 600" },
      
      // Facial features (8-18% height)
      { name: "EYE PHYSICAL", path: "M 210,60 L 290,60 L 290,80 L 210,80 Z", viewBox: "0 0 500 600" },
      { name: "EYE VISION", path: "M 210,60 L 290,60 L 290,80 L 210,80 Z", viewBox: "0 0 500 600" },
      { name: "EAR PHYSICAL", path: "M 175,65 L 195,65 L 195,85 L 175,85 Z", viewBox: "0 0 500 600" },
      { name: "EAR HEARING", path: "M 305,65 L 325,65 L 325,85 L 305,85 Z", viewBox: "0 0 500 600" },
      { name: "NOSE", path: "M 235,85 L 265,85 L 265,100 L 235,100 Z", viewBox: "0 0 500 600" },
      { name: "MOUTH", path: "M 230,100 L 270,100 L 270,115 L 230,115 Z", viewBox: "0 0 500 600" },
      
      // Neck region (18-25% height)
      { name: "NECK", path: "M 230,110 L 270,110 L 270,140 L 230,140 Z", viewBox: "0 0 500 600" },
      { name: "THROAT", path: "M 235,120 L 265,120 L 265,135 L 235,135 Z", viewBox: "0 0 500 600" },
      { name: "THROAT VOICE", path: "M 240,125 L 260,125 L 260,135 L 240,135 Z", viewBox: "0 0 500 600" },
      
      // Shoulders and upper chest (25-40% height)
      { name: "SHOULDER FRONT", path: "M 140,140 L 360,140 L 360,170 L 140,170 Z", viewBox: "0 0 500 600" },
      { name: "CHEST UPPER", path: "M 200,170 L 300,170 L 300,210 L 200,210 Z", viewBox: "0 0 500 600" },
      { name: "CHEST CENTRAL", path: "M 210,210 L 290,210 L 290,250 L 210,250 Z", viewBox: "0 0 500 600" },
      { name: "CHEST SIDE", path: "M 160,180 L 340,180 L 340,240 L 160,240 Z", viewBox: "0 0 500 600" },
      { name: "UPPER BACK", path: "M 200,150 L 300,150 L 300,250 L 200,250 Z", viewBox: "0 0 500 600" },
      
      // Gender-specific chest
      ...(gender === "female" ? [{ name: "BREAST", path: "M 190,190 L 310,190 L 310,230 L 190,230 Z", viewBox: "0 0 500 600" }] : []),
      
      // Arms
      { name: "UPPER ARM", path: "M 100,170 L 150,170 L 150,280 L 100,280 Z", viewBox: "0 0 500 600" },
      { name: "FOREARM AND WRIST", path: "M 80,280 L 130,280 L 130,380 L 80,380 Z", viewBox: "0 0 500 600" },
      { name: "HAND PALM", path: "M 60,380 L 110,380 L 110,420 L 60,420 Z", viewBox: "0 0 500 600" },
      
      // Upper abdomen (40-50% height)
      { name: "UPPER ABDOMEN", path: "M 210,250 L 290,250 L 290,290 L 210,290 Z", viewBox: "0 0 500 600" },
      
      // Lower abdomen (50-65% height)
      { name: "ABDOMEN GENERAL", path: "M 200,290 L 300,290 L 300,350 L 200,350 Z", viewBox: "0 0 500 600" },
      { name: "LOWER ABDOMEN LEFT", path: "M 200,350 L 250,350 L 250,380 L 200,380 Z", viewBox: "0 0 500 600" },
      { name: "LOWER ABDOMEN RIGHT", path: "M 250,350 L 300,350 L 300,380 L 250,380 Z", viewBox: "0 0 500 600" },
      
      // Gender-specific lower abdomen
      ...(gender === "female" ? [{ name: "FEMALE LOWER ABDOMEN", path: "M 210,360 L 290,360 L 290,390 L 210,390 Z", viewBox: "0 0 500 600" }] : []),
      
      // Bowel issues - positioned in actual abdomen area (45-60% height)
      { name: "BOWELS ABNORMAL STOOL", path: "M 190,320 L 310,320 L 310,370 L 190,370 Z", viewBox: "0 0 500 600" },
      { name: "BOWELS CONSTIPATION", path: "M 190,320 L 310,320 L 310,370 L 190,370 Z", viewBox: "0 0 500 600" },
      { name: "BOWELS DIARRHOEA", path: "M 190,320 L 310,320 L 310,370 L 190,370 Z", viewBox: "0 0 500 600" },
      
      // Groin and genitals (65-75% height)
      { name: "GROIN MALE AND FEMALE", path: "M 220,380 L 280,380 L 280,410 L 220,410 Z", viewBox: "0 0 500 600" },
      ...(gender === "male" ? [
        { name: "MALE GENITALS", path: "M 225,390 L 275,390 L 275,420 L 225,420 Z", viewBox: "0 0 500 600" },
        { name: "URINARY PROBLEMS MALE", path: "M 220,385 L 280,385 L 280,415 L 220,415 Z", viewBox: "0 0 500 600" }
      ] : []),
      ...(gender === "female" ? [
        { name: "FEMALE GENITALS", path: "M 230,390 L 270,390 L 270,410 L 230,410 Z", viewBox: "0 0 500 600" },
        { name: "URINARY PROBLEMS FEMALE", path: "M 220,385 L 280,385 L 280,415 L 220,415 Z", viewBox: "0 0 500 600" }
      ] : []),
      
      // Hips and upper thighs (75-85% height)
      { name: "HIP FRONT", path: "M 180,410 L 320,410 L 320,450 L 180,450 Z", viewBox: "0 0 500 600" },
      { name: "THIGH FRONT", path: "M 200,450 L 300,450 L 300,520 L 200,520 Z", viewBox: "0 0 500 600" },
      { name: "THIGH BACK", path: "M 200,450 L 300,450 L 300,520 L 200,520 Z", viewBox: "0 0 500 600" },
      
      // Knees and lower legs (85-95% height)
      { name: "KNEE FRONT", path: "M 210,520 L 290,520 L 290,550 L 210,550 Z", viewBox: "0 0 500 600" },
      { name: "LOWER LEG FRONT", path: "M 220,550 L 280,550 L 280,600 L 220,600 Z", viewBox: "0 0 500 600" },
      
      // Feet (95-100% height)
      { name: "ANKLE", path: "M 230,590 L 270,590 L 270,600 L 230,600 Z", viewBox: "0 0 500 600" },
      { name: "FOOT", path: "M 220,595 L 280,595 L 280,600 L 220,600 Z", viewBox: "0 0 500 600" },
      { name: "FOOT UPPER", path: "M 220,595 L 280,595 L 280,600 L 220,600 Z", viewBox: "0 0 500 600" },
      { name: "FOOT UNDERSIDE", path: "M 220,598 L 280,598 L 280,600 L 220,600 Z", viewBox: "0 0 500 600" },
    ];
  } else {
    return [
      // Back view - precisely positioned for back anatomy
      { name: "HAIR AND SCALP", path: "M 200,0 L 300,0 L 300,50 L 200,50 Z", viewBox: "0 0 500 600" },
      { name: "SHOULDER BACK", path: "M 140,140 L 360,140 L 360,170 L 140,170 Z", viewBox: "0 0 500 600" },
      { name: "UPPER BACK", path: "M 200,170 L 300,170 L 300,290 L 200,290 Z", viewBox: "0 0 500 600" },
      { name: "LOWER BACK", path: "M 210,290 L 290,290 L 290,380 L 210,380 Z", viewBox: "0 0 500 600" },
      { name: "BUTTOCKS AND ANUS", path: "M 220,380 L 280,380 L 280,430 L 220,430 Z", viewBox: "0 0 500 600" },
      { name: "ELBOW", path: "M 80,270 L 110,270 L 110,300 L 80,300 Z", viewBox: "0 0 500 600" },
      { name: "HAND BACK", path: "M 370,380 L 420,380 L 420,420 L 370,420 Z", viewBox: "0 0 500 600" },
      { name: "HIP BACK", path: "M 180,410 L 320,410 L 320,450 L 180,450 Z", viewBox: "0 0 500 600" },
      { name: "KNEE BACK", path: "M 210,520 L 290,520 L 290,550 L 210,550 Z", viewBox: "0 0 500 600" },
      { name: "LOWER LEG BACK", path: "M 220,550 L 280,550 L 280,600 L 220,600 Z", viewBox: "0 0 500 600" },
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
                viewBox="0 0 500 600"
                preserveAspectRatio="xMidYMid meet"
                style={{ aspectRatio: "5/6" }}
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