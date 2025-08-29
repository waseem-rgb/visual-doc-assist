import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Search, Pill, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMedicationInsights, suggestMedicationsForDiagnosis } from "@/utils/aiService";

// Utility function to strip markdown formatting
const stripMarkdown = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
    .replace(/`(.*?)`/g, '$1') // Remove code `text`
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .trim();
};

interface Medication {
  id: string;
  name: string;
  generic_name: string;
  brand_names: string;
  category: string;
  dosage_form: string;
  common_dosages: string;
  indication: string;
  contraindication: string;
  side_effects: string;
}

interface PrescribedMedication extends Medication {
  prescribed_dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicationSelectorProps {
  onMedicationsChange: (medications: PrescribedMedication[]) => void;
  disabled?: boolean;
  diagnosis?: string;
  patientAge?: string;
  patientGender?: string;
}

const MedicationSelector = ({ 
  onMedicationsChange, 
  disabled = false, 
  diagnosis, 
  patientAge, 
  patientGender 
}: MedicationSelectorProps) => {
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [prescribedMedications, setPrescribedMedications] = useState<PrescribedMedication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCustomMed, setShowCustomMed] = useState(false);
  const [customMedication, setCustomMedication] = useState({
    name: "",
    strength: "",
    dosage: "",
    frequency: "Twice daily",
    duration: "7 days",
    instructions: "Take with food"
  });
  const [loadingAI, setLoadingAI] = useState<{ [key: number]: boolean }>({});
  const [aiInsights, setAiInsights] = useState<{ [key: number]: string }>({});
  const [loadingAIAssist, setLoadingAIAssist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    onMedicationsChange(prescribedMedications);
  }, [prescribedMedications, onMedicationsChange]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Medication_new")
        .select("*")
        .order("name");

      if (error) throw error;

      // Filter out empty/null names and clean the data
      const cleanedData = (data || [])
        .filter(med => med.name && med.name.trim())
        .map(med => ({
          id: med.id || med.name,
          name: med.name || "",
          generic_name: med.generic_name || "",
          brand_names: med.brand_names || "",
          category: med.category || "",
          dosage_form: med.dosage_form || "",
          common_dosages: med.common_dosages || "",
          indication: med.indication || "",
          contraindication: med.contraindication || "",
          side_effects: med.side_effects || "",
        }));

      setAvailableMedications(cleanedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch medications: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = availableMedications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addMedication = (medication: Medication) => {
    const prescribedMed: PrescribedMedication = {
      ...medication,
      prescribed_dosage: medication.common_dosages.split(',')[0]?.trim() || "",
      frequency: "Twice daily",
      duration: "7 days",
      instructions: "Take with food",
    };

    setPrescribedMedications(prev => [...prev, prescribedMed]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const addCustomMedication = () => {
    if (!customMedication.name) {
      toast({
        title: "Missing Information",
        description: "Please provide medication name.",
        variant: "destructive",
      });
      return;
    }

    const customMed: PrescribedMedication = {
      id: `custom-${Date.now()}`,
      name: customMedication.name,
      generic_name: "",
      brand_names: "",
      category: "Custom Medication",
      dosage_form: "",
      common_dosages: customMedication.strength,
      indication: "",
      contraindication: "",
      side_effects: "",
      prescribed_dosage: `${customMedication.strength} ${customMedication.dosage}`,
      frequency: customMedication.frequency,
      duration: customMedication.duration,
      instructions: customMedication.instructions,
    };

    setPrescribedMedications(prev => [...prev, customMed]);
    setCustomMedication({
      name: "",
      strength: "",
      dosage: "",
      frequency: "Twice daily",
      duration: "7 days",
      instructions: "Take with food"
    });
    setShowCustomMed(false);
    
    toast({
      title: "Custom Medication Added",
      description: `${customMedication.name} has been added to the prescription.`,
    });
  };

  const removeMedication = (index: number) => {
    setPrescribedMedications(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof PrescribedMedication, value: string) => {
    setPrescribedMedications(prev =>
      prev.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      )
    );
  };

  const getAIInsights = async (medicationName: string, index: number) => {
    setLoadingAI(prev => ({ ...prev, [index]: true }));
    
    try {
      const insights = await getMedicationInsights(medicationName);
      setAiInsights(prev => ({ ...prev, [index]: insights }));
      
      toast({
        title: "AI Insights Generated",
        description: `Clinical insights for ${medicationName} have been generated.`,
      });
    } catch (error) {
      console.error('Error getting AI insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(prev => ({ ...prev, [index]: false }));
    }
  };

  const getAIAssistMedications = async () => {
    if (!diagnosis) {
      toast({
        title: "No Diagnosis Available",
        description: "Please select a diagnosis first to get AI medication suggestions.",
        variant: "destructive",
      });
      return;
    }

    setLoadingAIAssist(true);
    
    try {
      const suggestions = await suggestMedicationsForDiagnosis(diagnosis, patientAge, patientGender);
      
      // Parse the AI suggestions and convert to medication objects
      const lines = suggestions.split('\n').filter(line => line.includes('|'));
      
      const suggestedMedications: PrescribedMedication[] = lines.map((line, index) => {
        const parts = line.split('|').map(part => stripMarkdown(part.trim()));
        if (parts.length >= 4) {
          return {
            id: `ai-suggested-${Date.now()}-${index}`,
            name: stripMarkdown(parts[0]) || 'Suggested Medication',
            generic_name: stripMarkdown(parts[0]) || '',
            brand_names: '',
            category: 'AI Suggested',
            dosage_form: '',
            common_dosages: stripMarkdown(parts[1]) || '',
            indication: diagnosis,
            contraindication: '',
            side_effects: '',
            prescribed_dosage: stripMarkdown(parts[1]) || '',
            frequency: stripMarkdown(parts[2]) || 'As directed',
            duration: stripMarkdown(parts[3]) || '7 days',
            instructions: stripMarkdown(parts[4]) || 'Take as prescribed',
          };
        }
        return null;
      }).filter(Boolean) as PrescribedMedication[];

      if (suggestedMedications.length > 0) {
        setPrescribedMedications(prev => [...prev, ...suggestedMedications]);
        toast({
          title: "AI Medications Added",
          description: `${suggestedMedications.length} AI-suggested medications added based on diagnosis.`,
        });
      } else {
        toast({
          title: "No Suggestions Found",
          description: "AI couldn't generate specific medication suggestions for this diagnosis.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error getting AI medication assistance:', error);
      toast({
        title: "Error",
        description: "Failed to get AI medication suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAIAssist(false);
    }
  };

  if (disabled && prescribedMedications.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No medications prescribed
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Medication Buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add from Database
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomMed(!showCustomMed)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Medication
          </Button>
          {diagnosis && (
            <Button
              variant="default"
              size="sm"
              onClick={getAIAssistMedications}
              disabled={loadingAIAssist}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loadingAIAssist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              AI Assist
            </Button>
          )}
        </div>
      )}

      {/* Search Interface */}
      {showSearch && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Search Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="Search by medication name or generic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading medications...
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredMedications.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {searchQuery ? "No medications found" : "Start typing to search medications"}
                    </div>
                  ) : (
                    filteredMedications.map((med) => (
                      <div
                        key={med.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => addMedication(med)}
                      >
                        <div>
                          <p className="font-medium">{med.name}</p>
                          {med.generic_name && (
                            <p className="text-sm text-muted-foreground">
                              Generic: {med.generic_name}
                            </p>
                          )}
                          {med.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {med.category}
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Medication Form */}
      {showCustomMed && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5" />
              Add Custom Medication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-med-name">Medication Name *</Label>
                  <Input
                    id="custom-med-name"
                    value={customMedication.name}
                    onChange={(e) => setCustomMedication(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Paracetamol"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-med-strength">Strength</Label>
                  <Input
                    id="custom-med-strength"
                    value={customMedication.strength}
                    onChange={(e) => setCustomMedication(prev => ({ ...prev, strength: e.target.value }))}
                    placeholder="e.g., 500mg (optional for combinations)"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="custom-med-dosage">Dosage Form</Label>
                  <Input
                    id="custom-med-dosage"
                    value={customMedication.dosage}
                    onChange={(e) => setCustomMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., Tablet, Capsule"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-med-frequency">Frequency</Label>
                  <Select
                    value={customMedication.frequency}
                    onValueChange={(value) => setCustomMedication(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="custom-med-duration">Duration</Label>
                  <Input
                    id="custom-med-duration"
                    value={customMedication.duration}
                    onChange={(e) => setCustomMedication(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="custom-med-instructions">Instructions</Label>
                <Textarea
                  id="custom-med-instructions"
                  value={customMedication.instructions}
                  onChange={(e) => setCustomMedication(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Special instructions..."
                  className="resize-none"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addCustomMedication} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Custom Medication
                </Button>
                <Button variant="outline" onClick={() => setShowCustomMed(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescribed Medications */}
      {prescribedMedications.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Prescribed Medications</Label>
          {prescribedMedications.map((med, index) => (
            <Card key={`${med.id}-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5" />
                    {med.name}
                  </CardTitle>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {med.generic_name && (
                  <p className="text-sm text-muted-foreground">
                    Generic: {med.generic_name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prescription Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                    <Input
                      id={`dosage-${index}`}
                      value={med.prescribed_dosage}
                      onChange={(e) => updateMedication(index, 'prescribed_dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Select
                      value={med.frequency}
                      onValueChange={(value) => updateMedication(index, 'frequency', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Four times daily">Four times daily</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`duration-${index}`}>Duration</Label>
                    <Input
                      id={`duration-${index}`}
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`instructions-${index}`}>Instructions</Label>
                  <Textarea
                    id={`instructions-${index}`}
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="Special instructions for this medication..."
                    className="resize-none"
                    rows={2}
                    disabled={disabled}
                  />
                </div>

                {/* Medication Information (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {med.indication && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Indication</Label>
                      <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{med.indication}</p>
                    </div>
                  )}
                  {med.side_effects && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Side Effects</Label>
                      <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{med.side_effects}</p>
                    </div>
                  )}
                  {med.contraindication && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Contraindications</Label>
                      <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{med.contraindication}</p>
                    </div>
                  )}
                </div>

                {/* AI Insights Section */}
                {!disabled && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-muted-foreground">AI Clinical Insights</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getAIInsights(med.name, index)}
                        disabled={loadingAI[index]}
                        className="flex items-center gap-2"
                      >
                        {loadingAI[index] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                        {loadingAI[index] ? 'Generating...' : 'Get AI Insights'}
                      </Button>
                    </div>
                    
                    {aiInsights[index] && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <Label className="text-sm font-medium text-blue-800">AI-Generated Clinical Summary</Label>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {aiInsights[index]}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          *AI-generated content should not replace professional medical judgment and official prescribing information.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicationSelector;