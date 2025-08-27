import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import maleFrontMask from "@/assets/male-front-mask.png";
import femaleFrontMask from "@/assets/female-front-mask.png";
import maleBackMask from "@/assets/male-back-mask.png";
import femaleBackMask from "@/assets/female-back-mask.png";

interface MaskBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
  debug?: boolean;
}

// Color mapping for mask-based detection - Updated with more flexible detection
const COLOR_MAP = {
  male: {
    Front: {
      // Head region - red spectrum
      "#FF0000": "HEAD FRONT",
      "#FF0001": "HEAD FRONT", 
      "#FF0002": "HAIR AND SCALP",
      "#FE0000": "FACE",
      "#FC0000": "FACE",
      
      // Eyes - blue spectrum  
      "#0000FF": "EYE VISION",
      "#0000FE": "EYE PHYSICAL", 
      "#0001FF": "EYE VISION",
      "#0002FF": "EYE PHYSICAL",
      
      // Nose - green spectrum
      "#00FF00": "NOSE",
      "#00FE00": "NOSE",
      "#01FF00": "NOSE",
      
      // Mouth - yellow spectrum
      "#FFFF00": "MOUTH",
      "#FFFE00": "MOUTH", 
      "#FFFD00": "MOUTH",
      
      // Neck - cyan spectrum
      "#00FFFF": "NECK",
      "#00FFFE": "THROAT",
      "#00FFFD": "THROAT VOICE",
      
      // Chest - magenta spectrum
      "#FF00FF": "CHEST UPPER",
      "#FF00FE": "CHEST CENTRAL",
      "#FF00FD": "CHEST SIDE",
      
      // Abdomen - orange spectrum  
      "#FFA500": "ABDOMEN GENERAL",
      "#FFA501": "UPPER ABDOMEN",
      "#FFA502": "LOWER ABDOMEN LEFT",
      "#FFA503": "LOWER ABDOMEN RIGHT", 
      "#FFA504": "BOWELS DIARRHOEA",
      "#FFA505": "BOWELS CONSTIPATION",
      "#FFA506": "BOWELS ABNORMAL STOOL",
      
      // Groin - purple spectrum
      "#800080": "GROIN MALE AND FEMALE",
      "#800081": "MALE GENITALS", 
      "#800082": "URINARY PROBLEMS MALE",
      
      // Arms - brown spectrum
      "#A52A2A": "UPPER ARM",
      "#A52A2B": "FOREARM AND WRIST",
      "#A52A2C": "SHOULDER FRONT",
      
      // Legs - pink spectrum
      "#FFC0CB": "THIGH FRONT", 
      "#FFC0CC": "KNEE FRONT",
      "#FFC0CD": "LOWER LEG FRONT",
      "#FFC0CE": "HIP FRONT",
      
      // Hands - gray spectrum
      "#808080": "HAND PALM",
      "#808081": "HAND PALM",
      
      // Feet - navy spectrum
      "#000080": "FOOT",
      "#000081": "FOOT UPPER", 
      "#000082": "FOOT UNDERSIDE",
      "#000083": "ANKLE"
    },
    "Back view": {
      "#FF0000": "HAIR AND SCALP",
      "#FF0001": "HAIR AND SCALP",
      "#0000FF": "SHOULDER BACK",
      "#00FF00": "UPPER BACK", 
      "#FFFF00": "LOWER BACK",
      "#00FFFF": "BUTTOCKS AND ANUS",
      "#A52A2A": "UPPER ARM",
      "#A52A2B": "ELBOW",
      "#FFC0CB": "THIGH BACK",
      "#FFC0CC": "KNEE BACK",
      "#FFC0CD": "LOWER LEG BACK", 
      "#FFC0CE": "HIP BACK",
      "#808080": "HAND BACK",
      "#000080": "FOOT"
    }
  },
  female: {
    Front: {
      // Same as male but with additional female-specific parts
      "#FF0000": "HEAD FRONT",
      "#FF0001": "HEAD FRONT",
      "#FF0002": "HAIR AND SCALP", 
      "#0000FF": "EYE VISION",
      "#0000FE": "EYE PHYSICAL",
      "#00FF00": "NOSE", 
      "#FFFF00": "MOUTH",
      "#00FFFF": "NECK",
      "#00FFFE": "THROAT",
      "#FF00FF": "CHEST UPPER",
      "#FF00FE": "CHEST CENTRAL",
      "#FF00FD": "CHEST SIDE",
      "#FF00FC": "BREAST",
      "#FFA500": "ABDOMEN GENERAL",
      "#FFA501": "UPPER ABDOMEN", 
      "#FFA502": "LOWER ABDOMEN LEFT",
      "#FFA503": "LOWER ABDOMEN RIGHT",
      "#FFA504": "FEMALE LOWER ABDOMEN",
      "#800080": "GROIN MALE AND FEMALE",
      "#800081": "FEMALE GENITALS",
      "#800082": "URINARY PROBLEMS FEMALE",
      "#A52A2A": "UPPER ARM",
      "#A52A2B": "FOREARM AND WRIST",
      "#FFC0CB": "THIGH FRONT",
      "#FFC0CC": "KNEE FRONT", 
      "#FFC0CD": "LOWER LEG FRONT",
      "#808080": "HAND PALM",
      "#000080": "FOOT",
      "#000081": "FOOT UPPER",
      "#000082": "FOOT UNDERSIDE"
    },
    "Back view": {
      "#FF0000": "HAIR AND SCALP",
      "#0000FF": "SHOULDER BACK",
      "#00FF00": "UPPER BACK",
      "#FFFF00": "LOWER BACK", 
      "#00FFFF": "BUTTOCKS AND ANUS",
      "#A52A2A": "UPPER ARM",
      "#FFC0CB": "THIGH BACK",
      "#808080": "HAND BACK",
      "#000080": "FOOT"
    }
  }
};

// Helper function to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Get mask image URL
const getMaskImageUrl = (gender: "male" | "female", view: "Front" | "Back view"): string => {
  if (gender === "male") {
    return view === "Front" ? maleFrontMask : maleBackMask;
  } else {
    return view === "Front" ? femaleFrontMask : femaleBackMask;
  }
};

const MaskBodySelector = ({
  imageUrl,
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  bodyParts,
  debug = false
}: MaskBodySelectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [maskLoaded, setMaskLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ color: string; bodyPart: string | null }>({ color: "", bodyPart: null });

  // Load images to canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    // Load main body image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;

    // Load mask image
    const maskImg = new Image();
    maskImg.crossOrigin = "anonymous";
    maskImg.onload = () => {
      maskCanvas.width = maskImg.width;
      maskCanvas.height = maskImg.height;
      maskCtx.drawImage(maskImg, 0, 0);
      console.log(`Mask loaded: ${maskImg.width}x${maskImg.height}`);
    };
    maskImg.onerror = (error) => {
      console.error('Failed to load mask image:', getMaskImageUrl(gender, currentView), error);
    };
    maskImg.src = getMaskImageUrl(gender, currentView);
  }, [imageLoaded, maskLoaded, imageUrl, gender, currentView]);

  // Get body part from mouse position
  const getBodyPartAtPosition = useCallback((x: number, y: number): string | null => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !maskLoaded) return null;

    const rect = maskCanvas.getBoundingClientRect();
    
    // Prevent infinite values from division by zero
    if (rect.width === 0 || rect.height === 0 || maskCanvas.width === 0 || maskCanvas.height === 0) {
      return null;
    }
    
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    // Ensure coordinates are within canvas bounds
    if (canvasX < 0 || canvasX >= maskCanvas.width || canvasY < 0 || canvasY >= maskCanvas.height) {
      return null;
    }

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;

    try {
      const imageData = maskCtx.getImageData(canvasX, canvasY, 1, 1);
      const [r, g, b] = imageData.data;
      
      const hexColor = rgbToHex(r, g, b);
      
      // Enhanced debugging
      if (debug) {
        console.log(`Pixel at (${canvasX}, ${canvasY}): RGB(${r}, ${g}, ${b}) = ${hexColor}`);
        setDebugInfo({ color: hexColor, bodyPart: null });
      }
      
      const colorMap = COLOR_MAP[gender][currentView];
      let bodyPart = colorMap[hexColor] || null;
      
      // If exact match not found, try approximate matching for common colors
      if (!bodyPart && (r > 240 || g > 240 || b > 240)) {
        // Try major color groups for generated images
        if (r > 200 && g < 50 && b < 50) bodyPart = "NOSE"; // Reddish
        else if (r < 50 && g < 50 && b > 200) bodyPart = "EYE VISION"; // Bluish  
        else if (r < 50 && g > 200 && b < 50) bodyPart = "NOSE"; // Greenish
        else if (r > 200 && g > 200 && b < 50) bodyPart = "MOUTH"; // Yellowish
        else if (r > 200 && g < 50 && b > 200) bodyPart = "CHEST UPPER"; // Magentaish
        else if (r > 200 && g > 100 && b < 100) bodyPart = "ABDOMEN GENERAL"; // Orangish
        
        if (debug && bodyPart) {
          console.log(`Approximate match found: ${bodyPart} for color ${hexColor}`);
        }
      }
      
      if (debug) {
        setDebugInfo(prev => ({ ...prev, bodyPart }));
      }
      
      // Check if this body part is available in the current dataset
      if (bodyPart && bodyParts.some(part => part.Body_part === bodyPart)) {
        return bodyPart;
      }
      
      return null;
    } catch (error) {
      console.warn('Error reading pixel data:', error);
      return null;
    }
  }, [gender, currentView, bodyParts, debug, maskLoaded]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageLoaded || !maskLoaded) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    const bodyPart = getBodyPartAtPosition(x, y);
    console.log(`Mouse at (${Math.round(x)}, ${Math.round(y)}) - Detected: ${bodyPart || 'None'}`);
    onBodyPartHover(bodyPart);
  }, [getBodyPartAtPosition, onBodyPartHover, imageLoaded, maskLoaded]);

  // Handle mouse click
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bodyPart = getBodyPartAtPosition(x, y);
    if (bodyPart) {
      onBodyPartClick(bodyPart);
    }
  }, [getBodyPartAtPosition, onBodyPartClick]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {gender === "male" ? "Male" : "Female"} Body - {currentView} View
          {debug && <span className="text-sm text-muted-foreground ml-2">(Debug Mode)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto">
          <div 
            ref={containerRef}
            className="relative cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleMouseClick}
            onMouseLeave={() => onBodyPartHover(null)}
          >
            {/* Main body image */}
            <img 
              src={imageUrl} 
              alt={`${gender} body ${currentView} view`}
              className="w-full h-auto block"
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Hidden mask image for pixel detection */}
            <img 
              src={getMaskImageUrl(gender, currentView)} 
              alt="Body mask"
              className="hidden"
              onLoad={() => setMaskLoaded(true)}
            />
            
            {/* Hidden canvases for pixel reading */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            <canvas
              ref={maskCanvasRef}
              className="hidden"
            />
            
            {/* Debug mask overlay */}
            {debug && maskLoaded && (
              <img 
                src={getMaskImageUrl(gender, currentView)}
                alt="Debug mask overlay" 
                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
              />
            )}
            
            {/* Hover highlight */}
            {hoveredPart && (
              <div className="absolute inset-0 bg-primary/20 border-2 border-primary pointer-events-none" />
            )}
            
            {/* Body part label */}
            {hoveredPart && mousePosition && (
              <div 
                className="absolute bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium shadow-lg border border-white/20 pointer-events-none z-10"
                style={{
                  left: Math.min(mousePosition.x + 15, containerRef.current?.offsetWidth ? containerRef.current.offsetWidth - 200 : 0),
                  top: Math.max(mousePosition.y - 45, 5),
                  transform: 'translateY(-50%)'
                }}
              >
                {hoveredPart}
              </div>
            )}
          </div>
          
          {/* Debug info */}
          {debug && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <div>Mouse: {mousePosition ? `${Math.round(mousePosition.x)}, ${Math.round(mousePosition.y)}` : 'N/A'}</div>
              <div>Color: <span className="font-mono">{debugInfo.color}</span></div>
              <div>Body Part: {debugInfo.bodyPart || 'None'}</div>
              <div>Available: {debugInfo.bodyPart && bodyParts.some(part => part.Body_part === debugInfo.bodyPart) ? 'Yes' : 'No'}</div>
            </div>
          )}
          
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

export default MaskBodySelector;