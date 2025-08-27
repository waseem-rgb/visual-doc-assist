import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuadrantBodySelectorProps {
  imageUrl: string;
  gender: "male" | "female";
  currentView: "Front" | "Back view";
  onQuadrantSelect: (quadrant: string) => void;
}

// Define 5 major body quadrants with large, easy-to-click areas
const getQuadrants = (view: string) => {
  if (view === "Front") {
    return [
      {
        id: "head",
        name: "Head & Face",
        description: "Eyes, Nose, Mouth, Ears, Hair",
        x1: 0.32, y1: 0.02, x2: 0.68, y2: 0.22,
        color: "rgba(59, 130, 246, 0.2)", // Blue
      },
      {
        id: "chest", 
        name: "Chest & Upper Body",
        description: "Chest, Shoulders, Upper Back, Neck",
        x1: 0.25, y1: 0.18, x2: 0.75, y2: 0.40,
        color: "rgba(16, 185, 129, 0.2)", // Green
      },
      {
        id: "abdomen",
        name: "Abdomen & Core", 
        description: "Stomach, Bowels, Groin, Lower Back",
        x1: 0.32, y1: 0.38, x2: 0.68, y2: 0.62,
        color: "rgba(245, 101, 101, 0.2)", // Red
      },
      {
        id: "arms",
        name: "Arms & Hands",
        description: "Upper Arms, Forearms, Hands, Wrists",
        x1: 0.02, y1: 0.22, x2: 0.32, y2: 0.75,
        color: "rgba(168, 85, 247, 0.2)", // Purple
      },
      {
        id: "legs",
        name: "Legs & Feet", 
        description: "Thighs, Knees, Lower Legs, Feet",
        x1: 0.35, y1: 0.62, x2: 0.65, y2: 0.98,
        color: "rgba(245, 158, 11, 0.2)", // Orange
      }
    ];
  } else {
    return [
      {
        id: "head",
        name: "Head & Scalp",
        description: "Hair, Scalp, Head Back",
        x1: 0.32, y1: 0.02, x2: 0.68, y2: 0.18,
        color: "rgba(59, 130, 246, 0.2)",
      },
      {
        id: "back",
        name: "Back & Shoulders", 
        description: "Upper Back, Lower Back, Shoulders",
        x1: 0.25, y1: 0.12, x2: 0.75, y2: 0.54,
        color: "rgba(16, 185, 129, 0.2)",
      },
      {
        id: "buttocks",
        name: "Buttocks & Hip",
        description: "Buttocks, Anus, Hip Back",
        x1: 0.32, y1: 0.52, x2: 0.68, y2: 0.68,
        color: "rgba(245, 101, 101, 0.2)",
      },
      {
        id: "arms",
        name: "Arms & Hands",
        description: "Upper Arms, Elbows, Hands Back",
        x1: 0.02, y1: 0.20, x2: 0.32, y2: 0.70,
        color: "rgba(168, 85, 247, 0.2)",
      },
      {
        id: "legs",
        name: "Legs & Feet",
        description: "Thighs Back, Knees Back, Lower Legs",
        x1: 0.35, y1: 0.72, x2: 0.65, y2: 0.98,
        color: "rgba(245, 158, 11, 0.2)",
      }
    ];
  }
};

const QuadrantBodySelector = ({
  imageUrl,
  gender,
  currentView,
  onQuadrantSelect
}: QuadrantBodySelectorProps) => {
  const quadrants = getQuadrants(currentView);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          Step 1: Select Body Area - {gender === "male" ? "Male" : "Female"} {currentView} View
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm">
          Click on a body area to see detailed body parts in that region
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-lg mx-auto">
          <div className="relative">
            {/* Main body image - larger size */}
            <img 
              src={imageUrl} 
              alt={`${gender} body ${currentView} view`}
              className="w-full h-auto block"
              style={{ maxHeight: '600px' }}
            />
            
            {/* Quadrant overlays */}
            {quadrants.map((quadrant) => (
              <div
                key={quadrant.id}
                className="absolute cursor-pointer transition-all duration-200"
                style={{
                  left: `${quadrant.x1 * 100}%`,
                  top: `${quadrant.y1 * 100}%`,
                  width: `${(quadrant.x2 - quadrant.x1) * 100}%`,
                  height: `${(quadrant.y2 - quadrant.y1) * 100}%`,
                }}
                onClick={() => onQuadrantSelect(quadrant.id)}
              >
                {/* Quadrant label - black text with shadow for visibility */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <div>
                    <h3 className="font-bold text-sm text-black drop-shadow-lg">{quadrant.name}</h3>
                    <p className="text-xs text-gray-800 mt-1 drop-shadow-md">{quadrant.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="mt-6 text-center">
            <div className="bg-muted/50 rounded-lg px-4 py-3">
              <h4 className="font-semibold text-primary mb-2">How to use:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Click on the body area that contains your symptoms</li>
                <li>2. You'll see a detailed view with specific body parts</li>
                <li>3. Select the exact body part from the detailed view</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrantBodySelector;