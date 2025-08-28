import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Search, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

const MedicationSelector = ({ onMedicationsChange, disabled = false }: MedicationSelectorProps) => {
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [prescribedMedications, setPrescribedMedications] = useState<PrescribedMedication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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

  if (disabled && prescribedMedications.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No medications prescribed
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Medication Button */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicationSelector;