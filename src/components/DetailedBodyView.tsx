import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

// Define detailed body parts for each quadrant with precise positioning
const getQuadrantParts = (quadrant: string, view: string) => {
  const parts: Record<string, any> = {
    head: {
      Front: [
        { name: "HAIR AND SCALP", x1: 0.30, y1: 0.05, x2: 0.70, y2: 0.25 },
        { name: "HEAD FRONT", x1: 0.35, y1: 0.20, x2: 0.65, y2: 0.45 },
        { name: "FACE", x1: 0.32, y1: 0.35, x2: 0.68, y2: 0.65 },
        { name: "EYE VISION", x1: 0.35, y1: 0.40, x2: 0.48, y2: 0.48 },
        { name: "EYE PHYSICAL", x1: 0.52, y1: 0.40, x2: 0.65, y2: 0.48 },
        { name: "NOSE", x1: 0.45, y1: 0.48, x2: 0.55, y2: 0.58 },
        { name: "MOUTH", x1: 0.40, y1: 0.58, x2: 0.60, y2: 0.68 },
        { name: "EAR PHYSICAL", x1: 0.15, y1: 0.45, x2: 0.25, y2: 0.55 },
        { name: "EAR HEARING", x1: 0.75, y1: 0.45, x2: 0.85, y2: 0.55 },
        { name: "NECK", x1: 0.40, y1: 0.75, x2: 0.60, y2: 0.95 },
        { name: "THROAT", x1: 0.42, y1: 0.80, x2: 0.58, y2: 0.90 },
        { name: "THROAT VOICE", x1: 0.44, y1: 0.82, x2: 0.56, y2: 0.88 },
      ],
      "Back view": [
        { name: "HAIR AND SCALP", x1: 0.30, y1: 0.05, x2: 0.70, y2: 0.95 },
      ]
    },
    chest: {
      Front: [
        { name: "SHOULDER FRONT", x1: 0.10, y1: 0.05, x2: 0.90, y2: 0.25 },
        { name: "CHEST UPPER", x1: 0.25, y1: 0.25, x2: 0.75, y2: 0.50 },
        { name: "CHEST CENTRAL", x1: 0.30, y1: 0.45, x2: 0.70, y2: 0.70 },
        { name: "CHEST SIDE", x1: 0.15, y1: 0.30, x2: 0.85, y2: 0.65 },
        { name: "BREAST", x1: 0.20, y1: 0.35, x2: 0.80, y2: 0.60 },
        { name: "UPPER BACK", x1: 0.25, y1: 0.70, x2: 0.75, y2: 0.95 },
      ],
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.10, y1: 0.05, x2: 0.90, y2: 0.25 },
        { name: "UPPER BACK", x1: 0.20, y1: 0.20, x2: 0.80, y2: 0.95 },
      ]
    },
    abdomen: {
      Front: [
        { name: "UPPER ABDOMEN", x1: 0.25, y1: 0.05, x2: 0.75, y2: 0.30 },
        { name: "ABDOMEN GENERAL", x1: 0.20, y1: 0.25, x2: 0.80, y2: 0.65 },
        { name: "LOWER ABDOMEN LEFT", x1: 0.20, y1: 0.60, x2: 0.50, y2: 0.80 },
        { name: "LOWER ABDOMEN RIGHT", x1: 0.50, y1: 0.60, x2: 0.80, y2: 0.80 },
        { name: "FEMALE LOWER ABDOMEN", x1: 0.25, y1: 0.65, x2: 0.75, y2: 0.85 },
        { name: "BOWELS DIARRHOEA", x1: 0.25, y1: 0.40, x2: 0.75, y2: 0.70 },
        { name: "BOWELS CONSTIPATION", x1: 0.25, y1: 0.40, x2: 0.75, y2: 0.70 },
        { name: "BOWELS ABNORMAL STOOL", x1: 0.25, y1: 0.40, x2: 0.75, y2: 0.70 },
        { name: "GROIN MALE AND FEMALE", x1: 0.30, y1: 0.80, x2: 0.70, y2: 0.95 },
        { name: "MALE GENITALS", x1: 0.35, y1: 0.82, x2: 0.65, y2: 0.92 },
        { name: "FEMALE GENITALS", x1: 0.35, y1: 0.82, x2: 0.65, y2: 0.92 },
        { name: "URINARY PROBLEMS MALE", x1: 0.30, y1: 0.80, x2: 0.70, y2: 0.95 },
        { name: "URINARY PROBLEMS FEMALE", x1: 0.30, y1: 0.80, x2: 0.70, y2: 0.95 },
      ],
      "Back view": [
        { name: "LOWER BACK", x1: 0.25, y1: 0.05, x2: 0.75, y2: 0.60 },
        { name: "BUTTOCKS AND ANUS", x1: 0.20, y1: 0.55, x2: 0.80, y2: 0.95 },
      ]
    },
    arms: {
      Front: [
        { name: "UPPER ARM", x1: 0.10, y1: 0.10, x2: 0.90, y2: 0.50 },
        { name: "FOREARM AND WRIST", x1: 0.05, y1: 0.45, x2: 0.95, y2: 0.80 },
        { name: "HAND PALM", x1: 0.00, y1: 0.75, x2: 1.00, y2: 1.00 },
      ],
      "Back view": [
        { name: "UPPER ARM", x1: 0.10, y1: 0.10, x2: 0.90, y2: 0.50 },
        { name: "ELBOW", x1: 0.35, y1: 0.45, x2: 0.65, y2: 0.55 },
        { name: "HAND BACK", x1: 0.00, y1: 0.75, x2: 1.00, y2: 1.00 },
      ]
    },
    legs: {
      Front: [
        { name: "HIP FRONT", x1: 0.20, y1: 0.05, x2: 0.80, y2: 0.25 },
        { name: "THIGH FRONT", x1: 0.25, y1: 0.20, x2: 0.75, y2: 0.60 },
        { name: "KNEE FRONT", x1: 0.30, y1: 0.55, x2: 0.70, y2: 0.70 },
        { name: "LOWER LEG FRONT", x1: 0.28, y1: 0.65, x2: 0.72, y2: 0.90 },
        { name: "ANKLE", x1: 0.35, y1: 0.85, x2: 0.65, y2: 0.95 },
        { name: "FOOT", x1: 0.20, y1: 0.90, x2: 0.80, y2: 1.00 },
        { name: "FOOT UPPER", x1: 0.25, y1: 0.92, x2: 0.75, y2: 1.00 },
        { name: "FOOT UNDERSIDE", x1: 0.25, y1: 0.95, x2: 0.75, y2: 1.00 },
      ],
      "Back view": [
        { name: "HIP BACK", x1: 0.20, y1: 0.05, x2: 0.80, y2: 0.25 },
        { name: "THIGH BACK", x1: 0.25, y1: 0.20, x2: 0.75, y2: 0.60 },
        { name: "KNEE BACK", x1: 0.30, y1: 0.55, x2: 0.70, y2: 0.70 },
        { name: "LOWER LEG BACK", x1: 0.28, y1: 0.65, x2: 0.72, y2: 0.90 },
        { name: "FOOT", x1: 0.20, y1: 0.90, x2: 0.80, y2: 1.00 },
      ]
    },
    back: {
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.10, y1: 0.05, x2: 0.90, y2: 0.25 },
        { name: "UPPER BACK", x1: 0.20, y1: 0.20, x2: 0.80, y2: 0.60 },
        { name: "LOWER BACK", x1: 0.25, y1: 0.55, x2: 0.75, y2: 0.95 },
      ]
    },
    buttocks: {
      "Back view": [
        { name: "BUTTOCKS AND ANUS", x1: 0.20, y1: 0.10, x2: 0.80, y2: 0.90 },
        { name: "HIP BACK", x1: 0.15, y1: 0.05, x2: 0.85, y2: 0.40 },
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
  imageUrl,
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  onBack,
  bodyParts
}: DetailedBodyViewProps) => {
  const parts = getQuadrantParts(quadrant, currentView).filter(part => 
    bodyParts.some(bp => bp.Body_part === part.name)
  );
  
  const title = getQuadrantTitle(quadrant, currentView);

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
            {/* Cropped/zoomed body image for this quadrant */}
            <img 
              src={imageUrl} 
              alt={`${gender} body ${quadrant} detail view`}
              className="w-full h-auto block border rounded-lg"
              style={{ 
                maxHeight: '700px',
                objectFit: 'cover'
              }}
            />
            
            {/* Interactive overlays for each body part */}
            {parts.map((part) => (
              <div
                key={part.name}
                className="absolute border-2 border-primary/30 pointer-events-none"
                style={{
                  left: `${part.x1 * 100}%`,
                  top: `${part.y1 * 100}%`,
                  width: `${(part.x2 - part.x1) * 100}%`,
                  height: `${(part.y2 - part.y1) * 100}%`,
                  backgroundColor: hoveredPart === part.name ? 'rgba(59, 130, 246, 0.4)' : 
                                  selectedBodyParts.includes(part.name) ? 'rgba(16, 185, 129, 0.4)' : 
                                  'rgba(99, 102, 241, 0.2)',
                  borderColor: hoveredPart === part.name ? '#3b82f6' : 
                              selectedBodyParts.includes(part.name) ? '#10b981' : '#6366f1'
                }}
              >
                {/* Part label - show all the time for clarity */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-white/90 text-xs font-medium px-2 py-1 rounded shadow-sm text-center leading-tight">
                    {part.name}
                  </span>
                </div>
              </div>
            ))}
            
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