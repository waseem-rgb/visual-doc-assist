import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
}

// Simple coordinate-based detection with corrected positioning
const getBodyRegions = (view: string) => {
  if (view === "Front") {
    return [
      // Head region - much higher up
      { name: "EYE VISION", x1: 0.40, y1: 0.08, x2: 0.60, y2: 0.12 },
      { name: "EYE PHYSICAL", x1: 0.40, y1: 0.08, x2: 0.60, y2: 0.12 },
      { name: "NOSE", x1: 0.45, y1: 0.12, x2: 0.55, y2: 0.16 },
      { name: "MOUTH", x1: 0.42, y1: 0.16, x2: 0.58, y2: 0.20 },
      
      // Neck region  
      { name: "NECK", x1: 0.43, y1: 0.20, x2: 0.57, y2: 0.25 },
      { name: "THROAT", x1: 0.44, y1: 0.22, x2: 0.56, y2: 0.26 },
      { name: "THROAT VOICE", x1: 0.45, y1: 0.23, x2: 0.55, y2: 0.25 },
      
      // Upper body - chest area
      { name: "CHEST UPPER", x1: 0.35, y1: 0.28, x2: 0.65, y2: 0.40 },
      { name: "CHEST CENTRAL", x1: 0.38, y1: 0.35, x2: 0.62, y2: 0.45 },
      { name: "CHEST SIDE", x1: 0.25, y1: 0.30, x2: 0.75, y2: 0.42 },
      
      // Abdomen region
      { name: "UPPER ABDOMEN", x1: 0.38, y1: 0.45, x2: 0.62, y2: 0.55 },
      { name: "ABDOMEN GENERAL", x1: 0.35, y1: 0.50, x2: 0.65, y2: 0.65 },
      { name: "LOWER ABDOMEN LEFT", x1: 0.30, y1: 0.60, x2: 0.50, y2: 0.70 },
      { name: "LOWER ABDOMEN RIGHT", x1: 0.50, y1: 0.60, x2: 0.70, y2: 0.70 },
      
      // Bowel issues in abdomen area
      { name: "BOWELS DIARRHOEA", x1: 0.35, y1: 0.55, x2: 0.65, y2: 0.68 },
      { name: "BOWELS CONSTIPATION", x1: 0.35, y1: 0.55, x2: 0.65, y2: 0.68 },
      { name: "BOWELS ABNORMAL STOOL", x1: 0.35, y1: 0.55, x2: 0.65, y2: 0.68 },
      
      // Groin and genitals
      { name: "GROIN MALE AND FEMALE", x1: 0.40, y1: 0.70, x2: 0.60, y2: 0.78 },
      { name: "MALE GENITALS", x1: 0.42, y1: 0.72, x2: 0.58, y2: 0.76 },
      { name: "FEMALE GENITALS", x1: 0.42, y1: 0.72, x2: 0.58, y2: 0.76 },
      { name: "URINARY PROBLEMS MALE", x1: 0.40, y1: 0.70, x2: 0.60, y2: 0.78 },
      { name: "URINARY PROBLEMS FEMALE", x1: 0.40, y1: 0.70, x2: 0.60, y2: 0.78 },
      
      // Arms and hands
      { name: "UPPER ARM", x1: 0.10, y1: 0.28, x2: 0.25, y2: 0.55 },
      { name: "FOREARM AND WRIST", x1: 0.05, y1: 0.50, x2: 0.20, y2: 0.75 },
      { name: "HAND PALM", x1: 0.02, y1: 0.70, x2: 0.15, y2: 0.85 },
      { name: "SHOULDER FRONT", x1: 0.20, y1: 0.25, x2: 0.80, y2: 0.35 },
      
      // Legs 
      { name: "HIP FRONT", x1: 0.30, y1: 0.75, x2: 0.70, y2: 0.82 },
      { name: "THIGH FRONT", x1: 0.35, y1: 0.78, x2: 0.65, y2: 0.90 },
      { name: "KNEE FRONT", x1: 0.40, y1: 0.88, x2: 0.60, y2: 0.92 },
      { name: "LOWER LEG FRONT", x1: 0.38, y1: 0.90, x2: 0.62, y2: 0.98 },
      
      // Feet
      { name: "ANKLE", x1: 0.40, y1: 0.95, x2: 0.60, y2: 0.98 },
      { name: "FOOT", x1: 0.35, y1: 0.96, x2: 0.65, y2: 1.0 },
      { name: "FOOT UPPER", x1: 0.35, y1: 0.96, x2: 0.65, y2: 1.0 },
      { name: "FOOT UNDERSIDE", x1: 0.35, y1: 0.98, x2: 0.65, y2: 1.0 }
    ];
  } else {
    return [
      { name: "HAIR AND SCALP", x1: 0.35, y1: 0.02, x2: 0.65, y2: 0.12 },
      { name: "SHOULDER BACK", x1: 0.20, y1: 0.25, x2: 0.80, y2: 0.35 },
      { name: "UPPER BACK", x1: 0.30, y1: 0.35, x2: 0.70, y2: 0.60 },
      { name: "LOWER BACK", x1: 0.35, y1: 0.60, x2: 0.65, y2: 0.75 },
      { name: "BUTTOCKS AND ANUS", x1: 0.35, y1: 0.75, x2: 0.65, y2: 0.85 },
      { name: "HIP BACK", x1: 0.30, y1: 0.75, x2: 0.70, y2: 0.85 },
      { name: "THIGH BACK", x1: 0.35, y1: 0.80, x2: 0.65, y2: 0.92 },
      { name: "KNEE BACK", x1: 0.40, y1: 0.88, x2: 0.60, y2: 0.92 },
      { name: "LOWER LEG BACK", x1: 0.38, y1: 0.90, x2: 0.62, y2: 0.98 }
    ];
  }
};

const SimpleBodySelector = ({
  imageUrl,
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  bodyParts
}: SimpleBodySelectorProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const regions = getBodyRegions(currentView).filter(region => 
    bodyParts.some(part => part.Body_part === region.name)
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    console.log(`SimpleSelector - Mouse at (${x.toFixed(3)}, ${y.toFixed(3)})`);
    
    const region = regions.find(r => 
      x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2
    );
    
    const bodyPart = region?.name || null;
    console.log(`SimpleSelector - Detected: ${bodyPart}`);
    onBodyPartHover(bodyPart);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const region = regions.find(r => 
      x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2
    );
    
    if (region?.name) {
      onBodyPartClick(region.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {gender === "male" ? "Male" : "Female"} Body - {currentView} View (Simple Mode)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto">
          <div 
            className="relative cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={() => onBodyPartHover(null)}
          >
            <img 
              src={imageUrl} 
              alt={`${gender} body ${currentView} view`}
              className="w-full h-auto block"
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Debug overlays for regions */}
            {imageLoaded && regions.map((region) => (
              <div
                key={region.name}
                className="absolute border-2 border-red-500/50 pointer-events-none text-xs bg-red-100/20"
                style={{
                  left: `${region.x1 * 100}%`,
                  top: `${region.y1 * 100}%`,
                  width: `${(region.x2 - region.x1) * 100}%`,
                  height: `${(region.y2 - region.y1) * 100}%`,
                  backgroundColor: hoveredPart === region.name ? 'rgba(59, 130, 246, 0.4)' : 
                                  selectedBodyParts.includes(region.name) ? 'rgba(16, 185, 129, 0.4)' : 
                                  'rgba(255, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: 'red',
                  fontWeight: 'bold'
                }}
              >
                {region.name}
              </div>
            ))}
            
            {/* Body part label with mouse position */}
            {hoveredPart && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium shadow-lg border border-white/20 pointer-events-none z-10">
                {hoveredPart} ✓
              </div>
            )}
            
            {/* Always show mouse coordinates for debugging */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none z-10">
              Ready to detect
            </div>
          </div>
          
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

export default SimpleBodySelector;