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

// Precise SVG path definitions for body parts - adjusted for actual body proportions
const getBodyPartPaths = (view: string, gender: string) => {
  if (view === "Front") {
    return [
      // Head and face - positioned at actual head location
      { name: "HAIR AND SCALP", path: "M 190,10 L 310,10 L 310,70 L 190,70 Z", viewBox: "0 0 500 700" },
      { name: "HEAD FRONT", path: "M 200,30 L 300,30 L 300,90 L 200,90 Z", viewBox: "0 0 500 700" },
      { name: "HEAD SIDE", path: "M 150,40 L 350,40 L 350,100 L 150,100 Z", viewBox: "0 0 500 700" },
      { name: "FACE", path: "M 205,70 L 295,70 L 295,130 L 205,130 Z", viewBox: "0 0 500 700" },
      
      // Facial features
      { name: "EYE PHYSICAL", path: "M 200,80 L 300,80 L 300,100 L 200,100 Z", viewBox: "0 0 500 700" },
      { name: "EYE VISION", path: "M 200,80 L 300,80 L 300,100 L 200,100 Z", viewBox: "0 0 500 700" },
      { name: "EAR PHYSICAL", path: "M 165,85 L 185,85 L 185,105 L 165,105 Z", viewBox: "0 0 500 700" },
      { name: "EAR HEARING", path: "M 315,85 L 335,85 L 335,105 L 315,105 Z", viewBox: "0 0 500 700" },
      { name: "NOSE", path: "M 235,100 L 265,100 L 265,120 L 235,120 Z", viewBox: "0 0 500 700" },
      { name: "MOUTH", path: "M 225,115 L 275,115 L 275,135 L 225,135 Z", viewBox: "0 0 500 700" },
      
      // Neck and throat
      { name: "NECK", path: "M 225,130 L 275,130 L 275,170 L 225,170 Z", viewBox: "0 0 500 700" },
      { name: "THROAT", path: "M 230,140 L 270,140 L 270,165 L 230,165 Z", viewBox: "0 0 500 700" },
      { name: "THROAT VOICE", path: "M 235,145 L 265,145 L 265,160 L 235,160 Z", viewBox: "0 0 500 700" },
      
      // Shoulders and upper body
      { name: "SHOULDER FRONT", path: "M 130,170 L 370,170 L 370,210 L 130,210 Z", viewBox: "0 0 500 700" },
      { name: "CHEST UPPER", path: "M 190,210 L 310,210 L 310,270 L 190,270 Z", viewBox: "0 0 500 700" },
      { name: "CHEST CENTRAL", path: "M 205,270 L 295,270 L 295,320 L 205,320 Z", viewBox: "0 0 500 700" },
      { name: "CHEST SIDE", path: "M 140,220 L 360,220 L 360,300 L 140,300 Z", viewBox: "0 0 500 700" },
      
      // Gender-specific chest
      ...(gender === "female" ? [{ name: "BREAST", path: "M 180,230 L 320,230 L 320,290 L 180,290 Z", viewBox: "0 0 500 700" }] : []),
      
      // Arms
      { name: "UPPER ARM", path: "M 90,210 L 150,210 L 150,350 L 90,350 Z", viewBox: "0 0 500 700" },
      { name: "FOREARM AND WRIST", path: "M 70,350 L 130,350 L 130,480 L 70,480 Z", viewBox: "0 0 500 700" },
      { name: "HAND PALM", path: "M 50,480 L 110,480 L 110,520 L 50,520 Z", viewBox: "0 0 500 700" },
      { name: "UPPER BACK", path: "M 190,200 L 310,200 L 310,350 L 190,350 Z", viewBox: "0 0 500 700" },
      
      // Abdomen - precisely positioned
      { name: "UPPER ABDOMEN", path: "M 205,320 L 295,320 L 295,380 L 205,380 Z", viewBox: "0 0 500 700" },
      { name: "ABDOMEN GENERAL", path: "M 190,380 L 310,380 L 310,460 L 190,460 Z", viewBox: "0 0 500 700" },
      { name: "LOWER ABDOMEN LEFT", path: "M 190,460 L 250,460 L 250,500 L 190,500 Z", viewBox: "0 0 500 700" },
      { name: "LOWER ABDOMEN RIGHT", path: "M 250,460 L 310,460 L 310,500 L 250,500 Z", viewBox: "0 0 500 700" },
      
      // Gender-specific abdomen
      ...(gender === "female" ? [{ name: "FEMALE LOWER ABDOMEN", path: "M 205,480 L 295,480 L 295,520 L 205,520 Z", viewBox: "0 0 500 700" }] : []),
      
      // Digestive system
      { name: "BOWELS ABNORMAL STOOL", path: "M 180,420 L 320,420 L 320,480 L 180,480 Z", viewBox: "0 0 500 700" },
      { name: "BOWELS CONSTIPATION", path: "M 180,420 L 320,420 L 320,480 L 180,480 Z", viewBox: "0 0 500 700" },
      { name: "BOWELS DIARRHOEA", path: "M 180,420 L 320,420 L 320,480 L 180,480 Z", viewBox: "0 0 500 700" },
      
      // Genitals and groin
      { name: "GROIN MALE AND FEMALE", path: "M 215,500 L 285,500 L 285,540 L 215,540 Z", viewBox: "0 0 500 700" },
      ...(gender === "male" ? [
        { name: "MALE GENITALS", path: "M 220,510 L 280,510 L 280,550 L 220,550 Z", viewBox: "0 0 500 700" },
        { name: "URINARY PROBLEMS MALE", path: "M 215,505 L 285,505 L 285,545 L 215,545 Z", viewBox: "0 0 500 700" }
      ] : []),
      ...(gender === "female" ? [
        { name: "FEMALE GENITALS", path: "M 225,510 L 275,510 L 275,540 L 225,540 Z", viewBox: "0 0 500 700" },
        { name: "URINARY PROBLEMS FEMALE", path: "M 215,505 L 285,505 L 285,545 L 215,545 Z", viewBox: "0 0 500 700" }
      ] : []),
      
      // Hips and legs
      { name: "HIP FRONT", path: "M 170,540 L 330,540 L 330,580 L 170,580 Z", viewBox: "0 0 500 700" },
      { name: "THIGH FRONT", path: "M 190,580 L 310,580 L 310,700 L 190,700 Z", viewBox: "0 0 500 700" },
      { name: "THIGH BACK", path: "M 190,580 L 310,580 L 310,700 L 190,700 Z", viewBox: "0 0 500 700" },
      
      // Knees and lower legs
      { name: "KNEE FRONT", path: "M 200,700 L 300,700 L 300,740 L 200,740 Z", viewBox: "0 0 500 700" },
      { name: "LOWER LEG FRONT", path: "M 210,740 L 290,740 L 290,860 L 210,860 Z", viewBox: "0 0 500 700" },
      
      // Feet
      { name: "ANKLE", path: "M 220,860 L 280,860 L 280,880 L 220,880 Z", viewBox: "0 0 500 700" },
      { name: "FOOT", path: "M 210,880 L 290,880 L 290,920 L 210,920 Z", viewBox: "0 0 500 700" },
      { name: "FOOT UPPER", path: "M 210,880 L 290,880 L 290,910 L 210,910 Z", viewBox: "0 0 500 700" },
      { name: "FOOT UNDERSIDE", path: "M 210,910 L 290,910 L 290,930 L 210,930 Z", viewBox: "0 0 500 700" },
    ];
  } else {
    return [
      // Back view paths - adjusted for back anatomy
      { name: "HAIR AND SCALP", path: "M 190,10 L 310,10 L 310,70 L 190,70 Z", viewBox: "0 0 500 700" },
      { name: "SHOULDER BACK", path: "M 130,170 L 370,170 L 370,210 L 130,210 Z", viewBox: "0 0 500 700" },
      { name: "UPPER BACK", path: "M 190,210 L 310,210 L 310,380 L 190,380 Z", viewBox: "0 0 500 700" },
      { name: "LOWER BACK", path: "M 200,380 L 300,380 L 300,480 L 200,480 Z", viewBox: "0 0 500 700" },
      { name: "BUTTOCKS AND ANUS", path: "M 210,480 L 290,480 L 290,540 L 210,540 Z", viewBox: "0 0 500 700" },
      { name: "ELBOW", path: "M 70,340 L 110,340 L 110,380 L 70,380 Z", viewBox: "0 0 500 700" },
      { name: "HAND BACK", path: "M 390,480 L 450,480 L 450,520 L 390,520 Z", viewBox: "0 0 500 700" },
      { name: "HIP BACK", path: "M 170,540 L 330,540 L 330,580 L 170,580 Z", viewBox: "0 0 500 700" },
      { name: "KNEE BACK", path: "M 200,700 L 300,700 L 300,740 L 200,740 Z", viewBox: "0 0 500 700" },
      { name: "LOWER LEG BACK", path: "M 210,740 L 290,740 L 290,860 L 210,860 Z", viewBox: "0 0 500 700" },
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