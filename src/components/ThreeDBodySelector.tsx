import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ThreeDBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
}

// Body part area definitions for hit detection - adjusted for accurate positioning
const getBodyPartAreas = (view: string, gender: string) => {
  if (view === "Front") {
    return {
      // Head region - top of image
      "HAIR AND SCALP": { x: 0.42, y: 0.05, width: 0.16, height: 0.08 },
      "HEAD FRONT": { x: 0.42, y: 0.08, width: 0.16, height: 0.08 },
      "HEAD SIDE": { x: 0.35, y: 0.08, width: 0.3, height: 0.08 },
      "FACE": { x: 0.43, y: 0.12, width: 0.14, height: 0.08 },
      
      // Facial features
      "EYE PHYSICAL": { x: 0.41, y: 0.13, width: 0.18, height: 0.03 },
      "EYE VISION": { x: 0.41, y: 0.13, width: 0.18, height: 0.03 },
      "EAR PHYSICAL": { x: 0.35, y: 0.12, width: 0.08, height: 0.04 },
      "EAR HEARING": { x: 0.57, y: 0.12, width: 0.08, height: 0.04 },
      "NOSE": { x: 0.47, y: 0.15, width: 0.06, height: 0.03 },
      "MOUTH": { x: 0.46, y: 0.17, width: 0.08, height: 0.02 },
      
      // Neck and throat
      "NECK": { x: 0.46, y: 0.19, width: 0.08, height: 0.05 },
      "THROAT": { x: 0.46, y: 0.21, width: 0.08, height: 0.03 },
      "THROAT VOICE": { x: 0.46, y: 0.22, width: 0.08, height: 0.02 },
      
      // Upper body
      "SHOULDER FRONT": { x: 0.25, y: 0.24, width: 0.5, height: 0.08 },
      "CHEST UPPER": { x: 0.42, y: 0.28, width: 0.16, height: 0.08 },
      "CHEST CENTRAL": { x: 0.42, y: 0.32, width: 0.16, height: 0.08 },
      "CHEST SIDE": { x: 0.3, y: 0.32, width: 0.4, height: 0.08 },
      "BREAST": gender === "female" ? { x: 0.38, y: 0.3, width: 0.24, height: 0.08 } : null,
      "UPPER ARM": { x: 0.15, y: 0.32, width: 0.15, height: 0.2 },
      "UPPER BACK": { x: 0.42, y: 0.28, width: 0.16, height: 0.15 },
      
      // Abdomen - more precise positioning
      "UPPER ABDOMEN": { x: 0.42, y: 0.4, width: 0.16, height: 0.08 },
      "ABDOMEN GENERAL": { x: 0.4, y: 0.44, width: 0.2, height: 0.1 },
      "LOWER ABDOMEN LEFT": { x: 0.38, y: 0.5, width: 0.12, height: 0.08 },
      "LOWER ABDOMEN RIGHT": { x: 0.5, y: 0.5, width: 0.12, height: 0.08 },
      "FEMALE LOWER ABDOMEN": gender === "female" ? { x: 0.42, y: 0.52, width: 0.16, height: 0.06 } : null,
      
      // Digestive areas
      "BOWELS ABNORMAL STOOL": { x: 0.4, y: 0.48, width: 0.2, height: 0.08 },
      "BOWELS CONSTIPATION": { x: 0.4, y: 0.48, width: 0.2, height: 0.08 },
      "BOWELS DIARRHOEA": { x: 0.4, y: 0.48, width: 0.2, height: 0.08 },
      
      // Genitals and groin
      "GROIN MALE AND FEMALE": { x: 0.44, y: 0.55, width: 0.12, height: 0.06 },
      "MALE GENITALS": gender === "male" ? { x: 0.45, y: 0.56, width: 0.1, height: 0.04 } : null,
      "FEMALE GENITALS": gender === "female" ? { x: 0.46, y: 0.56, width: 0.08, height: 0.04 } : null,
      "URINARY PROBLEMS MALE": gender === "male" ? { x: 0.44, y: 0.54, width: 0.12, height: 0.06 } : null,
      "URINARY PROBLEMS FEMALE": gender === "female" ? { x: 0.44, y: 0.54, width: 0.12, height: 0.06 } : null,
      
      // Arms and hands - adjusted for realistic positioning
      "FOREARM AND WRIST": { x: 0.08, y: 0.42, width: 0.12, height: 0.15 },
      "HAND PALM": { x: 0.05, y: 0.55, width: 0.1, height: 0.08 },
      
      // Hips and legs
      "HIP FRONT": { x: 0.35, y: 0.58, width: 0.3, height: 0.08 },
      "THIGH FRONT": { x: 0.38, y: 0.64, width: 0.24, height: 0.15 },
      "THIGH BACK": { x: 0.38, y: 0.64, width: 0.24, height: 0.15 },
      "KNEE FRONT": { x: 0.4, y: 0.76, width: 0.2, height: 0.06 },
      "LOWER LEG FRONT": { x: 0.4, y: 0.8, width: 0.2, height: 0.12 },
      
      // Feet
      "ANKLE": { x: 0.42, y: 0.9, width: 0.16, height: 0.04 },
      "FOOT": { x: 0.4, y: 0.93, width: 0.2, height: 0.07 },
      "FOOT UPPER": { x: 0.4, y: 0.93, width: 0.2, height: 0.04 },
      "FOOT UNDERSIDE": { x: 0.4, y: 0.95, width: 0.2, height: 0.03 },
    };
  } else {
    return {
      "HAIR AND SCALP": { x: 0.42, y: 0.05, width: 0.16, height: 0.1 },
      "SHOULDER BACK": { x: 0.25, y: 0.24, width: 0.5, height: 0.08 },
      "UPPER BACK": { x: 0.4, y: 0.3, width: 0.2, height: 0.15 },
      "LOWER BACK": { x: 0.42, y: 0.45, width: 0.16, height: 0.1 },
      "ELBOW": { x: 0.12, y: 0.4, width: 0.12, height: 0.08 },
      "HAND BACK": { x: 0.75, y: 0.55, width: 0.1, height: 0.08 },
      "HIP BACK": { x: 0.35, y: 0.58, width: 0.3, height: 0.08 },
      "BUTTOCKS AND ANUS": { x: 0.42, y: 0.6, width: 0.16, height: 0.08 },
      "KNEE BACK": { x: 0.4, y: 0.76, width: 0.2, height: 0.06 },
      "LOWER LEG BACK": { x: 0.4, y: 0.8, width: 0.2, height: 0.12 },
    };
  }
};

// Component to display the body image as a texture in 3D space
function BodyImage({ imageUrl, hoveredPart }: { imageUrl: string; hoveredPart: string | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Create a subtle glow effect when hovering
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hoveredPart ? 1.02 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[5, 7]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Smart cursor/loupe that follows mouse and provides magnification
function SmartLoupe({ 
  selectedBodyParts, 
  hoveredPart, 
  mousePosition,
  onHover, 
  onClick,
  bodyParts,
  currentView,
  gender 
}: { 
  selectedBodyParts: string[];
  hoveredPart: string | null;
  mousePosition: { x: number; y: number };
  onHover: (part: string | null) => void;
  onClick: (part: string) => void;
  bodyParts: Array<{ Body_part: string; View: string; "Specific rules": string }>;
  currentView: string;
  gender: string;
}) {
  const { mouse } = useThree();
  const loupeRef = useRef<THREE.Group>(null);
  
  // Check which body part we're hovering over
  useEffect(() => {
    const areas = getBodyPartAreas(currentView, gender);
    let foundPart = null;
    
    // Convert mouse coordinates to normalized coordinates (0-1)
    const normalizedX = (mousePosition.x + 1) / 2;
    const normalizedY = 1 - (mousePosition.y + 1) / 2; // Flip Y coordinate
    
    // Check each body part area
    for (const [partName, area] of Object.entries(areas)) {
      if (area && normalizedX >= area.x && normalizedX <= area.x + area.width &&
          normalizedY >= area.y && normalizedY <= area.y + area.height) {
        // Verify this part exists in our body parts list
        const partExists = bodyParts.some(part => part.Body_part === partName);
        if (partExists) {
          foundPart = partName;
          break;
        }
      }
    }
    
    onHover(foundPart);
  }, [mousePosition, currentView, gender, bodyParts, onHover]);
  
  useFrame(() => {
    if (loupeRef.current) {
      // Convert mouse coordinates to world position (smaller loupe)
      const vector = new THREE.Vector3(mouse.x * 2, mouse.y * 3, 0.1);
      loupeRef.current.position.copy(vector);
      
      // Add subtle floating animation
      loupeRef.current.position.y += Math.sin(Date.now() * 0.002) * 0.01;
      
      // Rotate slightly for visual appeal
      loupeRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
    }
  });

  const handleClick = () => {
    if (hoveredPart) {
      onClick(hoveredPart);
    }
  };

  return (
    <group ref={loupeRef} onClick={handleClick}>
      {/* Main ring - smaller than before */}
      <mesh>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial 
          color={hoveredPart ? "#10b981" : selectedBodyParts.length > 0 ? "#f59e0b" : "#3b82f6"} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      {/* Outer highlight ring */}
      <mesh>
        <ringGeometry args={[0.1, 0.12, 32]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.5}
        />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.008, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Body part label - positioned closer to cursor */}
      {hoveredPart && (
        <Html position={[0, 0.15, 0]} center>
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-lg border border-white/20 pointer-events-none whitespace-nowrap">
            {hoveredPart}
          </div>
        </Html>
      )}
    </group>
  );
}

// Camera controller for smooth interactions
function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={false}
      minDistance={2}
      maxDistance={8}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

const ThreeDBodySelector = ({
  imageUrl,
  gender,
  currentView,
  selectedBodyParts,
  hoveredPart,
  onBodyPartHover,
  onBodyPartClick,
  bodyParts
}: ThreeDBodySelectorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePosition({ x, y });
    }
  };

  const resetCamera = () => {
    // This would reset the camera position - implementation depends on OrbitControls ref
    window.location.reload(); // Simple reset for now
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {gender === "male" ? "Male" : "Female"} Body - {currentView} View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[700px] bg-gradient-to-b from-background to-muted/20 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <Canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            style={{ cursor: hoveredPart ? 'pointer' : 'grab' }}
            camera={{ position: [0, 0, 5], fov: 50 }}
          >
            <Suspense fallback={
              <Html center>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </Html>
            }>
              {/* Ambient lighting for better visibility */}
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={0.4} />
              
              {/* Body image */}
              <BodyImage imageUrl={imageUrl} hoveredPart={hoveredPart} />
              
              {/* Smart loupe cursor */}
              <SmartLoupe 
                selectedBodyParts={selectedBodyParts}
                hoveredPart={hoveredPart}
                mousePosition={mousePosition}
                onHover={onBodyPartHover}
                onClick={onBodyPartClick}
                bodyParts={bodyParts}
                currentView={currentView}
                gender={gender}
              />
              
              {/* Camera controls */}
              <CameraController />
            </Suspense>
          </Canvas>
          
          {/* Control buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="sm" variant="outline" className="bg-background/80" onClick={resetCamera}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-muted-foreground">
              {hoveredPart ? (
                <span className="text-primary font-medium">Click to select: {hoveredPart}</span>
              ) : (
                "Pan to explore • Scroll to zoom • Hover over body areas to see names"
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThreeDBodySelector;