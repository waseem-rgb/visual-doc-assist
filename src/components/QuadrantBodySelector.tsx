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
        x1: 0.25, y1: 0.0, x2: 0.75, y2: 0.32,
        color: "rgba(59, 130, 246, 0.2)", // Blue
      },
      {
        id: "chest", 
        name: "Chest & Upper Body",
        description: "Chest, Shoulders, Upper Back, Neck",
        x1: 0.20, y1: 0.28, x2: 0.80, y2: 0.52,
        color: "rgba(16, 185, 129, 0.2)", // Green
      },
      {
        id: "abdomen",
        name: "Abdomen & Core", 
        description: "Stomach, Bowels, Groin, Lower Back",
        x1: 0.25, y1: 0.42, x2: 0.75, y2: 0.78,
        color: "rgba(245, 101, 101, 0.2)", // Red
      },
      {
        id: "arms",
        name: "Arms & Hands",
        description: "Upper Arms, Forearms, Hands, Wrists",
        x1: 0.0, y1: 0.25, x2: 0.25, y2: 0.85,
        color: "rgba(168, 85, 247, 0.2)", // Purple
      },
      {
        id: "legs",
        name: "Legs & Feet", 
        description: "Thighs, Knees, Lower Legs, Feet",
        x1: 0.30, y1: 0.75, x2: 0.70, y2: 1.0,
        color: "rgba(245, 158, 11, 0.2)", // Orange
      }
    ];
  } else {
    return [
      {
        id: "head",
        name: "Head & Scalp",
        description: "Hair, Scalp, Head Back",
        x1: 0.25, y1: 0.0, x2: 0.75, y2: 0.20,
        color: "rgba(59, 130, 246, 0.2)",
      },
      {
        id: "back",
        name: "Back & Shoulders", 
        description: "Upper Back, Lower Back, Shoulders",
        x1: 0.20, y1: 0.18, x2: 0.80, y2: 0.78,
        color: "rgba(16, 185, 129, 0.2)",
      },
      {
        id: "buttocks",
        name: "Buttocks & Hip",
        description: "Buttocks, Anus, Hip Back",
        x1: 0.25, y1: 0.75, x2: 0.75, y2: 0.88,
        color: "rgba(245, 101, 101, 0.2)",
      },
      {
        id: "arms",
        name: "Arms & Hands",
        description: "Upper Arms, Elbows, Hands Back",
        x1: 0.0, y1: 0.25, x2: 0.25, y2: 0.85,
        color: "rgba(168, 85, 247, 0.2)",
      },
      {
        id: "legs",
        name: "Legs & Feet",
        description: "Thighs Back, Knees Back, Lower Legs",
        x1: 0.30, y1: 0.85, x2: 0.70, y2: 1.0,
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
          Click on a colored area to see detailed body parts in that region
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
                className="absolute cursor-pointer transition-all duration-200 hover:opacity-80 border-2 border-transparent hover:border-primary"
                style={{
                  left: `${quadrant.x1 * 100}%`,
                  top: `${quadrant.y1 * 100}%`,
                  width: `${(quadrant.x2 - quadrant.x1) * 100}%`,
                  height: `${(quadrant.y2 - quadrant.y1) * 100}%`,
                  backgroundColor: quadrant.color,
                }}
                onClick={() => onQuadrantSelect(quadrant.id)}
              >
                {/* Quadrant label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <h3 className="font-bold text-sm text-gray-800">{quadrant.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{quadrant.description}</p>
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
                <li>1. Click on the colored area that contains your symptoms</li>
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