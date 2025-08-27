import { useState, useEffect } from "react";

interface DebuggerProps {
  mousePosition: { x: number; y: number };
  hoveredPart: string | null;
}

const BodyPartDebugger = ({ mousePosition, hoveredPart }: DebuggerProps) => {
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const textureX = (mousePosition.x + 1) / 2;
    const textureY = 1 - (mousePosition.y + 1) / 2;  // Flip Y-axis for texture coords
    const textureYRaw = (mousePosition.y + 1) / 2;   // Show raw for comparison
    
    setDebugInfo(`
      Mouse: (${mousePosition.x.toFixed(3)}, ${mousePosition.y.toFixed(3)})
      Texture: (${textureX.toFixed(3)}, ${textureY.toFixed(3)})
      Raw Y: ${textureYRaw.toFixed(3)} | Flipped Y: ${textureY.toFixed(3)}
      Hovered: ${hoveredPart || 'None'}
    `);
  }, [mousePosition, hoveredPart]);

  return (
    <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded text-xs font-mono whitespace-pre-line pointer-events-none z-10">
      {debugInfo}
    </div>
  );
};

export default BodyPartDebugger;