import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
    email: "",
    full_name: "",
    specialization: "",
    license_number: "",
    phone: "",
    temporary_password: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('admin-onboard-doctor', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor account created successfully!",
      });

      // Reset form
      setFormData({
        email: "",
        full_name: "",
        specialization: "",
        license_number: "",
        phone: "",
        temporary_password: "",
        notes: ""
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, temporary_password: password }));
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="General Medicine"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                      placeholder="MD12345"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temporary_password" className="flex items-center justify-between">
                    Temporary Password *
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generatePassword}
                    >
                      Generate
                    </Button>
                  </Label>
                  <div className="relative">
                    <Input
                      id="temporary_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.temporary_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, temporary_password: e.target.value }))}
                      placeholder="Enter temporary password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this doctor..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Creating Account..." : "Create Doctor Account"}
                </Button>
              </form>
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