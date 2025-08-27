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

// Define detailed body parts for each quadrant with precise anatomical positioning
const getQuadrantParts = (quadrant: string, view: string) => {
  const parts: Record<string, any> = {
    head: {
      Front: [
        { name: "HAIR AND SCALP", x1: 0.15, y1: 0.00, x2: 0.85, y2: 0.25 },
        { name: "HEAD FRONT", x1: 0.20, y1: 0.20, x2: 0.80, y2: 0.50 },
        { name: "FACE", x1: 0.18, y1: 0.35, x2: 0.82, y2: 0.75 },
        { name: "EYE VISION", x1: 0.22, y1: 0.40, x2: 0.42, y2: 0.52 },
        { name: "EYE PHYSICAL", x1: 0.58, y1: 0.40, x2: 0.78, y2: 0.52 },
        { name: "NOSE", x1: 0.42, y1: 0.50, x2: 0.58, y2: 0.62 },
        { name: "MOUTH", x1: 0.35, y1: 0.62, x2: 0.65, y2: 0.72 },
        { name: "EAR PHYSICAL", x1: 0.02, y1: 0.45, x2: 0.18, y2: 0.60 },
        { name: "EAR HEARING", x1: 0.82, y1: 0.45, x2: 0.98, y2: 0.60 },
        { name: "NECK", x1: 0.35, y1: 0.75, x2: 0.65, y2: 0.95 },
        { name: "THROAT", x1: 0.38, y1: 0.78, x2: 0.62, y2: 0.88 },
        { name: "THROAT VOICE", x1: 0.40, y1: 0.80, x2: 0.60, y2: 0.86 },
      ],
      "Back view": [
        { name: "HAIR AND SCALP", x1: 0.10, y1: 0.00, x2: 0.90, y2: 1.00 },
      ]
    },
    chest: {
      Front: [
        { name: "SHOULDER FRONT", x1: 0.00, y1: 0.00, x2: 1.00, y2: 0.25 },
        { name: "CHEST UPPER", x1: 0.15, y1: 0.20, x2: 0.85, y2: 0.50 },
        { name: "CHEST CENTRAL", x1: 0.20, y1: 0.45, x2: 0.80, y2: 0.75 },
        { name: "CHEST SIDE", x1: 0.05, y1: 0.30, x2: 0.95, y2: 0.70 },
        { name: "BREAST", x1: 0.10, y1: 0.35, x2: 0.90, y2: 0.65 },
      ],
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.00, y1: 0.00, x2: 1.00, y2: 0.25 },
        { name: "UPPER BACK", x1: 0.10, y1: 0.20, x2: 0.90, y2: 1.00 },
      ]
    },
    abdomen: {
      Front: [
        { name: "UPPER ABDOMEN", x1: 0.15, y1: 0.00, x2: 0.85, y2: 0.30 },
        { name: "ABDOMEN GENERAL", x1: 0.10, y1: 0.15, x2: 0.90, y2: 0.60 },
        { name: "LOWER ABDOMEN LEFT", x1: 0.10, y1: 0.55, x2: 0.50, y2: 0.75 },
        { name: "LOWER ABDOMEN RIGHT", x1: 0.50, y1: 0.55, x2: 0.90, y2: 0.75 },
        { name: "FEMALE LOWER ABDOMEN", x1: 0.15, y1: 0.60, x2: 0.85, y2: 0.80 },
        { name: "BOWELS DIARRHOEA", x1: 0.15, y1: 0.30, x2: 0.85, y2: 0.65 },
        { name: "BOWELS CONSTIPATION", x1: 0.15, y1: 0.30, x2: 0.85, y2: 0.65 },
        { name: "BOWELS ABNORMAL STOOL", x1: 0.15, y1: 0.30, x2: 0.85, y2: 0.65 },
        { name: "GROIN MALE AND FEMALE", x1: 0.20, y1: 0.75, x2: 0.80, y2: 0.95 },
        { name: "MALE GENITALS", x1: 0.25, y1: 0.77, x2: 0.75, y2: 0.87 },
        { name: "FEMALE GENITALS", x1: 0.25, y1: 0.77, x2: 0.75, y2: 0.87 },
        { name: "URINARY PROBLEMS MALE", x1: 0.20, y1: 0.75, x2: 0.80, y2: 0.90 },
        { name: "URINARY PROBLEMS FEMALE", x1: 0.20, y1: 0.75, x2: 0.80, y2: 0.90 },
      ],
      "Back view": [
        { name: "LOWER BACK", x1: 0.15, y1: 0.00, x2: 0.85, y2: 0.60 },
        { name: "BUTTOCKS AND ANUS", x1: 0.10, y1: 0.55, x2: 0.90, y2: 1.00 },
      ]
    },
    back: {
      "Back view": [
        { name: "SHOULDER BACK", x1: 0.00, y1: 0.00, x2: 1.00, y2: 0.30 },
        { name: "UPPER BACK", x1: 0.10, y1: 0.25, x2: 0.90, y2: 1.00 },
      ]
    },
    buttocks: {
      "Back view": [
        { name: "LOWER BACK", x1: 0.15, y1: 0.00, x2: 0.85, y2: 0.45 },
        { name: "BUTTOCKS AND ANUS", x1: 0.10, y1: 0.40, x2: 0.90, y2: 1.00 },
      ]
    },
    arms: {
      Front: [
        { name: "UPPER ARM", x1: 0.05, y1: 0.00, x2: 0.95, y2: 0.50 },
        { name: "FOREARM AND WRIST", x1: 0.00, y1: 0.45, x2: 1.00, y2: 0.80 },
        { name: "HAND PALM", x1: 0.00, y1: 0.75, x2: 1.00, y2: 1.00 },
      ],
      "Back view": [
        { name: "UPPER ARM", x1: 0.05, y1: 0.00, x2: 0.95, y2: 0.50 },
        { name: "ELBOW", x1: 0.25, y1: 0.45, x2: 0.75, y2: 0.60 },
        { name: "HAND BACK", x1: 0.00, y1: 0.75, x2: 1.00, y2: 1.00 },
      ]
    },
    legs: {
      Front: [
        { name: "HIP FRONT", x1: 0.10, y1: 0.00, x2: 0.90, y2: 0.25 },
        { name: "THIGH FRONT", x1: 0.15, y1: 0.20, x2: 0.85, y2: 0.60 },
        { name: "KNEE FRONT", x1: 0.20, y1: 0.55, x2: 0.80, y2: 0.70 },
        { name: "LOWER LEG FRONT", x1: 0.18, y1: 0.65, x2: 0.82, y2: 0.90 },
        { name: "ANKLE", x1: 0.25, y1: 0.85, x2: 0.75, y2: 0.95 },
        { name: "FOOT", x1: 0.10, y1: 0.90, x2: 0.90, y2: 1.00 },
        { name: "FOOT UPPER", x1: 0.15, y1: 0.92, x2: 0.85, y2: 1.00 },
        { name: "FOOT UNDERSIDE", x1: 0.15, y1: 0.93, x2: 0.85, y2: 1.00 },
      ],
      "Back view": [
        { name: "HIP BACK", x1: 0.10, y1: 0.00, x2: 0.90, y2: 0.25 },
        { name: "THIGH BACK", x1: 0.15, y1: 0.20, x2: 0.85, y2: 0.60 },
        { name: "KNEE BACK", x1: 0.20, y1: 0.55, x2: 0.80, y2: 0.70 },
        { name: "LOWER LEG BACK", x1: 0.18, y1: 0.65, x2: 0.82, y2: 0.90 },
        { name: "FOOT", x1: 0.10, y1: 0.90, x2: 0.90, y2: 1.00 },
      ]
    }
  };
  
  return parts[quadrant]?.[view] || [];
};

// Get the cropping style for each quadrant to show anatomically correct zoomed view
const getQuadrantCropStyle = (quadrant: string, view: string) => {
  const cropStyles: Record<string, Record<string, any>> = {
    head: {
      Front: {
        objectFit: "cover" as const,
        objectPosition: "50% 12%", // Focus precisely on head area
        height: "500px",
        transform: "scale(3.8)", // Zoom in significantly for head only
        transformOrigin: "50% 12%"
      },
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 10%", // Focus on head back
        height: "500px", 
        transform: "scale(4.0)", // Zoom for head back
        transformOrigin: "50% 10%"
      }
    },
    chest: {
      Front: {
        objectFit: "cover" as const,
        objectPosition: "50% 30%", // Focus precisely on chest area
        height: "500px",
        transform: "scale(3.0)", // Zoom for chest area
        transformOrigin: "50% 30%"
      },
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 32%", // Focus on upper back/shoulders
        height: "500px",
        transform: "scale(3.0)", 
        transformOrigin: "50% 32%"
      }
    },
    abdomen: {
      Front: {
        objectFit: "cover" as const,
        objectPosition: "50% 50%", // Focus precisely on abdomen area
        height: "500px",
        transform: "scale(2.7)", // Zoom for abdomen
        transformOrigin: "50% 50%"
      },
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 65%", // Focus on lower back
        height: "500px",
        transform: "scale(2.5)",
        transformOrigin: "50% 65%"
      }
    },
    back: {
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 35%", // Focus on back & shoulders area
        height: "500px",
        transform: "scale(2.8)",
        transformOrigin: "50% 35%"
      }
    },
    buttocks: {
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 60%", // Focus on buttocks area
        height: "500px",
        transform: "scale(3.0)",
        transformOrigin: "50% 60%"
      }
    },
    arms: {
      Front: {
        objectFit: "cover" as const,
        objectPosition: "15% 45%", // Focus on left arm area
        height: "600px",
        transform: "scale(3.2)",
        transformOrigin: "15% 45%"
      },
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "15% 45%", // Focus on left arm back
        height: "600px",
        transform: "scale(3.2)",
        transformOrigin: "15% 45%"
      }
    },
    legs: {
      Front: {
        objectFit: "cover" as const,
        objectPosition: "50% 78%", // Focus precisely on legs area
        height: "500px",
        transform: "scale(2.5)", // Zoom for legs
        transformOrigin: "50% 78%"
      },
      "Back view": {
        objectFit: "cover" as const,
        objectPosition: "50% 80%", // Focus on legs back
        height: "500px", 
        transform: "scale(2.5)",
        transformOrigin: "50% 80%"
      }
    }
  };
  
  return cropStyles[quadrant]?.[view] || {
    objectFit: "contain" as const,
    height: "600px"
  };
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
  const cropStyle = getQuadrantCropStyle(quadrant, currentView);

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
            {/* Zoomed/cropped body image for this specific quadrant */}
            <div className="overflow-hidden rounded-lg border bg-gradient-to-b from-blue-50 to-purple-50">
              <img 
                src={imageUrl} 
                alt={`${gender} body ${quadrant} detail view`}
                className="w-full block"
                style={cropStyle}
              />
            </div>
            
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