import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import UniversalSymptomSelector from '@/components/UniversalSymptomSelector';
import { Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSymptomSelectorProps {
  bodyPart: string;
  patientData: {
    name: string;
    age: string;
    gender: string;
  };
  selectedSymptoms: string[];
  onSymptomsSelected: (symptoms: string[]) => void;
}

export function MobileSymptomSelector({
  bodyPart,
  patientData,
  selectedSymptoms,
  onSymptomsSelected
}: MobileSymptomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSymptomSubmit = (symptoms: string[]) => {
    onSymptomsSelected(symptoms);
    setIsOpen(false);
  };

  // Mock common symptoms for demonstration
  const commonSymptoms = [
    'Pain', 'Swelling', 'Numbness', 'Stiffness', 'Weakness',
    'Burning sensation', 'Tingling', 'Muscle spasms'
  ];

  const filteredSymptoms = commonSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickSelect = (symptom: string) => {
    const newSymptoms = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];
    onSymptomsSelected(newSymptoms);
  };

  return (
    <div className="space-y-4">
      {/* Quick Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Common symptoms for {bodyPart}:</h3>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Quick Selection Grid */}
        <div className="flex flex-wrap gap-2">
          {filteredSymptoms.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <Button
                key={symptom}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect(symptom)}
                className={cn(
                  "h-9 text-xs transition-all",
                  isSelected && "bg-primary text-primary-foreground"
                )}
              >
                {isSelected && <Check className="h-3 w-3 mr-1" />}
                {symptom}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced Selector */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full h-11">
            <Plus className="h-4 w-4 mr-2" />
            Browse All Symptoms
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Symptoms</SheetTitle>
            <SheetDescription>
              Choose the symptoms for {bodyPart}
            </SheetDescription>
          </SheetHeader>
          
          <div className="h-full">
            <UniversalSymptomSelector
              isOpen={true}
              onClose={() => setIsOpen(false)}
              bodyPart={bodyPart}
              gender={patientData.gender as 'male' | 'female'}
              view="front"
              onSymptomsSelected={handleSymptomSubmit}
              initialSymptoms={selectedSymptoms}
              imageUrl=""
              onSymptomSubmit={handleSymptomSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Selected Count */}
      {selectedSymptoms.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}