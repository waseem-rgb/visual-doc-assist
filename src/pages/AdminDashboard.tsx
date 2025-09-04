import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  UserPlus, 
  Users, 
  Activity,
  Eye,
  EyeOff,
  Stethoscope,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface OnboardingRequest {
  id: string;
  email: string;
  full_name: string;
  specialization?: string;  
  license_number?: string;
  phone?: string;
  status: 'pending' | 'invited' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  notes?: string;
  created_by_admin?: {
    email: string;
    role: string;
  };
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingRequests, setOnboardingRequests] = useState<OnboardingRequest[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    specialization: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    phone: "",
    email: "",
    availability: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  
  const specialties = [
    "General Medicine",
    "Cardiology", 
    "Dermatology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Surgery",
    "Other"
  ];

  const daysOfWeek = [
    { id: "monday", label: "Mon" },
    { id: "tuesday", label: "Tue" },
    { id: "wednesday", label: "Wed" },
    { id: "thursday", label: "Thu" },
    { id: "friday", label: "Fri" },
    { id: "saturday", label: "Sat" },
    { id: "sunday", label: "Sun" }
  ];

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role, is_active')
          .eq('id', user.id)
          .eq('role', 'super_admin')
          .eq('is_active', true)
          .single();

        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
          await fetchOnboardingRequests();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  const fetchOnboardingRequests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-onboard-doctor', {
        method: 'GET'
      });

      if (error) throw error;

      setOnboardingRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching onboarding requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctor onboarding requests",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate email if not provided
      const email = formData.email || `${formData.full_name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`;
      
      const payload = {
        ...formData,
        email,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
        temporary_password: 'TempPass123!', // Default temporary password
      };

      const { data, error } = await supabase.functions.invoke('admin-onboard-doctor', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor account created successfully!",
      });

      // Reset form
      setFormData({
        full_name: "",
        specialization: "",
        qualification: "",
        experience_years: "",
        consultation_fee: "",
        phone: "",
        email: "",
        availability: []
      });

      // Refresh the requests list
      await fetchOnboardingRequests();

    } catch (error: any) {
      console.error('Error creating doctor:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to create doctor account",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailabilityChange = (dayId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        availability: [...prev.availability, dayId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        availability: prev.availability.filter(day => day !== dayId)
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Shield className="h-12 w-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage doctor onboarding and system administration</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Doctor Onboarding Form */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Doctor Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder=""
                    required
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialty *</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Qualification */}
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., MBBS, MD, MS"
                  />
                </div>

                {/* Experience and Consultation Fee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Experience (Years) *</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                      placeholder=""
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee">Consultation Fee (₹) *</Label>
                    <Input
                      id="consultation_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultation_fee: e.target.value }))}
                      placeholder=""
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-3">
                  <Label>Availability (Optional - defaults to Mon-Fri)</Label>
                  <div className="flex flex-wrap gap-4">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={formData.availability.includes(day.id)}
                          onCheckedChange={(checked) => 
                            handleAvailabilityChange(day.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={day.id} className="text-sm font-normal">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={submitting}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {submitting ? "Onboard Doctor" : "Onboard Doctor"}
                </Button>
              </form>

              {/* Admin Note */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium text-primary mb-2">Admin Note:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Doctor will receive an OTP on their mobile to verify account</li>
                  <li>• They can then login using their mobile number</li>
                  <li>• You can also manage doctors directly through Supabase dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Onboarding History */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Doctor Onboarding History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {onboardingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No doctor onboarding requests yet
                  </p>
                ) : (
                  onboardingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <strong>{request.full_name}</strong>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      {request.specialization && (
                        <p className="text-sm">Specialization: {request.specialization}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.notes && (
                        <p className="text-xs bg-muted p-2 rounded">{request.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin Instructions:</strong> Use this dashboard to create doctor accounts. 
            Created doctors will receive their login credentials and can immediately access the doctor portal. 
            All actions are logged for audit purposes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AdminDashboard;