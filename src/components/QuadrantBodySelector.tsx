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
        x1: 0.32, y1: 0.02, x2: 0.68, y2: 0.22,
        color: "rgba(29, 78, 216, 0.3)", // Deep Blue
      },
      {
        id: "chest", 
        name: "Chest & Upper Body",
        x1: 0.25, y1: 0.18, x2: 0.75, y2: 0.40,
        color: "rgba(5, 150, 105, 0.3)", // Deep Green
      },
      {
        id: "abdomen",
        name: "Abdomen & Core", 
        x1: 0.32, y1: 0.38, x2: 0.68, y2: 0.62,
        color: "rgba(220, 38, 38, 0.3)", // Deep Red
      },
      {
        id: "arms",
        name: "Arms & Hands",
        x1: 0.02, y1: 0.22, x2: 0.32, y2: 0.75,
        color: "rgba(88, 28, 135, 0.3)", // Deep Purple
      },
      {
        id: "legs",
        name: "Legs & Feet", 
        x1: 0.35, y1: 0.62, x2: 0.65, y2: 0.98,
        color: "rgba(180, 83, 9, 0.3)", // Deep Orange
      }
    ];
  } else {
    return [
      {
        id: "head",
        name: "Head & Scalp",
        x1: 0.32, y1: 0.02, x2: 0.68, y2: 0.18,
        color: "rgba(29, 78, 216, 0.3)", // Deep Blue
      },
      {
        id: "back",
        name: "Back & Shoulders", 
        x1: 0.25, y1: 0.12, x2: 0.75, y2: 0.54,
        color: "rgba(5, 150, 105, 0.3)", // Deep Green
      },
      {
        id: "buttocks",
        name: "Buttocks & Hip",
        x1: 0.32, y1: 0.52, x2: 0.68, y2: 0.68,
        color: "rgba(220, 38, 38, 0.3)", // Deep Red
      },
      {
        id: "arms",
        name: "Arms & Hands",
        x1: 0.02, y1: 0.20, x2: 0.32, y2: 0.70,
        color: "rgba(88, 28, 135, 0.3)", // Deep Purple
      },
      {
        id: "legs",
        name: "Legs & Feet",
        x1: 0.35, y1: 0.72, x2: 0.65, y2: 0.98,
        color: "rgba(180, 83, 9, 0.3)", // Deep Orange
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
                {/* Quadrant label - with deeper colors */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <div>
                    <h3 className="font-bold text-sm text-white drop-shadow-2xl bg-black/30 px-2 py-1 rounded-lg">{quadrant.name}</h3>
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
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrantBodySelector;