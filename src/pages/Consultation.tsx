import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConsultationStore } from "@/store/consultationStore";
import BodyMap from "@/components/BodyMap";
import GeneralSymptoms from "@/components/GeneralSymptoms";

const Consultation = () => {
  const navigate = useNavigate();
  const { patientData, setPatientData, resetConsultation } = useConsultationStore();
  const [symptomType, setSymptomType] = useState("head-to-toe");

  const handlePatientDataChange = (field: string, value: string) => {
    setPatientData({ ...patientData, [field]: value });
  };

  const isFormValid = patientData.name && patientData.age && patientData.gender && patientData.phone;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold gradient-text mb-2">Start Your Consultation</h1>
          <p className="text-muted-foreground">Please provide your details and select your symptoms</p>
        </div>

        {/* Patient Details Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={patientData.name}
                  onChange={(e) => handlePatientDataChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={patientData.age}
                  onChange={(e) => handlePatientDataChange("age", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={patientData.phone}
                  onChange={(e) => handlePatientDataChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={patientData.gender}
                  onValueChange={(value) => handlePatientDataChange("gender", value)}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            {/* Pregnancy question for females over 18 */}
            {patientData.gender === 'female' && parseInt(patientData.age) >= 18 && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Are you currently pregnant?</Label>
                <RadioGroup
                  value={patientData.isPregnant || ''}
                  onValueChange={(value) => handlePatientDataChange("isPregnant", value)}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pregnant-yes" />
                    <Label htmlFor="pregnant-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pregnant-no" />
                    <Label htmlFor="pregnant-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Symptom Selection */}
        {isFormValid && (
          <Card>
            <CardHeader>
              <CardTitle>Symptom Selection</CardTitle>
              <p className="text-muted-foreground">Choose how you'd like to describe your symptoms</p>
            </CardHeader>
            <CardContent>
              <Tabs value={symptomType} onValueChange={setSymptomType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="head-to-toe">Head to Toe Specific</TabsTrigger>
                  <TabsTrigger value="general">General Symptoms</TabsTrigger>
                </TabsList>
                
                <TabsContent value="head-to-toe" className="mt-6">
                  <BodyMap 
                    gender={patientData.gender as "male" | "female"} 
                    patientData={patientData}
                  />
                </TabsContent>
                
                <TabsContent value="general" className="mt-6">
                  <GeneralSymptoms patientData={patientData} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Consultation;