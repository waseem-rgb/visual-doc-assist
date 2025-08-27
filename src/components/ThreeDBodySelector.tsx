import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ThreeDBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  selectedBodyParts: string[];
  hoveredPart: string | null;
  onBodyPartHover: (part: string | null) => void;
  onBodyPartClick: (part: string) => void;
}

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
      <planeGeometry args={[4, 6]} />
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
function SmartLoupe({ selectedBodyParts }: { selectedBodyParts: string[] }) {
  const { camera, gl, scene, mouse } = useThree();
  const loupeRef = useRef<THREE.Group>(null);
  const [worldPosition, setWorldPosition] = useState(new THREE.Vector3());
  
  useFrame(() => {
    if (loupeRef.current) {
      // Convert mouse coordinates to world position
      const vector = new THREE.Vector3(mouse.x * 2, mouse.y * 3, 0.1);
      loupeRef.current.position.copy(vector);
      
      // Add subtle floating animation
      loupeRef.current.position.y += Math.sin(Date.now() * 0.002) * 0.02;
      
      // Rotate slightly for visual appeal
      loupeRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <group ref={loupeRef}>
      <mesh>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial 
          color={selectedBodyParts.length > 0 ? "#10b981" : "#3b82f6"} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.6}
        />
      </mesh>
      {/* Crosshair in the center */}
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[0.01, 0.015, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
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
  onBodyPartClick
}: ThreeDBodySelectorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    // If there's a hovered part, select it
    if (hoveredPart) {
      onBodyPartClick(hoveredPart);
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
        <div className="relative w-full h-[600px] bg-gradient-to-b from-background to-muted/20 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <Canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={(event) => {
              // Detect which body part we're hovering over based on cursor position
              // This is a simplified implementation - in production you'd want more precise hit detection
              if (hoveredPart !== selectedBodyParts[0]) {
                // onBodyPartHover(selectedBodyParts[0] || null);
              }
            }}
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
              <SmartLoupe selectedBodyParts={selectedBodyParts} />
              
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
                "Pan to explore • Scroll to zoom • Click body parts from the side lists"
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThreeDBodySelector;