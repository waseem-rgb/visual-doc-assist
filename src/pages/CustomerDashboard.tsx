
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useConsultationStore } from "@/store/consultationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  ArrowRight,
  User, 
  Calendar,
  Eye,
  LogOut,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PrescriptionStatus from "@/components/PrescriptionStatus";
import { VideoConsultationsList } from '@/components/VideoConsultationsList';
import type { User as AuthUser } from "@supabase/supabase-js";

interface PrescriptionRequest {
  id: string;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  body_part: string;
  symptoms: string;
  probable_diagnosis: string;
  short_summary: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  prescription_required: boolean;
  is_referral?: boolean;
  customer_email?: string;
  prescription?: {
    id: string;
    medications: string;
    instructions: string;
    pdf_url?: string;
    created_at: string;
  } | null;
}

const CustomerDashboard = () => {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetConsultation } = useConsultationStore();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      console.log("Customer Dashboard loading - checking authentication");
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found");
        navigate("/customer/login");
        return;
      }

      // Check if user has doctor role - if so, redirect to doctor dashboard
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) {
        console.error("Error checking user roles:", roleError);
      } else {
        const hasDocRole = roles?.some(r => r.role === 'doctor');
        if (hasDocRole) {
          console.log("User has doctor role - redirecting to doctor dashboard");
          navigate("/doctor/dashboard");
          return;
        }
      }

      setUser(user);

      // Fetch customer's prescription requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("prescription_requests")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        throw requestsError;
      }

      // Fetch prescriptions for completed cases
      const completedRequestIds = requestsData
        ?.filter(req => req.status === 'completed')
        .map(req => req.id) || [];

      let prescriptionsData: any[] = [];
      if (completedRequestIds.length > 0) {
        const { data: presData, error: prescriptionsError } = await supabase
          .from("prescriptions")
          .select("*")
          .in("request_id", completedRequestIds);

        if (prescriptionsError) {
          console.error("Error fetching prescriptions:", prescriptionsError);
        } else {
          prescriptionsData = presData || [];
        }
      }

      // Combine requests with their prescriptions
      const requestsWithPrescriptions = (requestsData || []).map(request => {
        const prescription = prescriptionsData.find(p => p.request_id === request.id);
        return {
          ...request,
          prescription: prescription ? {
            id: prescription.id,
            medications: prescription.medications,
            instructions: prescription.instructions,
            pdf_url: prescription.pdf_url,
            created_at: prescription.created_at
          } : null
        };
      });

      setRequests(requestsWithPrescriptions);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 10 seconds to catch PDF generation updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh if there are completed requests without prescriptions OR prescriptions without PDFs
      const needsRefresh = requests.some(r => 
        r.status === 'completed' && (
          !r.prescription || // No prescription record yet
          (r.prescription && !r.prescription.pdf_url) // Prescription exists but no PDF
        )
      );
      
      if (needsRefresh) {
        console.log('Auto-refreshing data to check for prescription/PDF updates');
        checkAuthAndFetchData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [requests]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Stethoscope className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p>Loading your medical records...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">VrDoc</h1>
              </div>
              <div className="hidden md:block">
                <p className="text-lg font-semibold text-foreground">
                  Welcome back!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your Health Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-500/10 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Stethoscope className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.in_progress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Medical Consultations</h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/teleconsultation")}
                className="hidden md:flex"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Book Teleconsultation
              </Button>
              <Button 
                onClick={() => {
                console.log('Start New Consultation clicked - navigating to /consultation');
                // Reset consultation store before starting new consultation
                resetConsultation();
                navigate("/consultation");
                }} 
                className="hidden md:flex"
              >
                <Heart className="h-4 w-4 mr-2" />
                Start Instant Consultation
              </Button>
            </div>
          </div>

          {/* Request Cards */}
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No consultations yet</p>
                  <p>Start your first consultation to see your medical records here.</p>
                  <div className="text-center py-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                      <Button
                        size="lg"
                        className="gradient-primary shadow-medium transition-bounce hover:shadow-large"
                        onClick={() => {
                          resetConsultation();
                          navigate("/consultation");
                        }}
                      >
                        Start Instant Consultation
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => navigate("/teleconsultation")}
                      >
                        Book Teleconsultation
                        <MessageCircle className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold text-lg">
                              {request.patient_name}
                            </span>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} text-white flex items-center gap-1`}>
                            {getStatusIcon(request.status)}
                            {request.status.replace('_', ' ')}
                          </Badge>
                          {request.is_referral && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Referral Required
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{request.patient_age} years old, {request.patient_gender}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{request.body_part}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          <strong>Diagnosis:</strong> {request.probable_diagnosis}
                        </p>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.short_summary || request.symptoms}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Reset consultation store before starting reconsultation
                              resetConsultation();
                              navigate("/consultation");
                            }}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Instant Reconsult
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/teleconsultation")}
                            className="w-full"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Book Teleconsult
                          </Button>
                        </div>
                        
                        {/* Show prescription status */}
                        <PrescriptionStatus request={request} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Video Consultations Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Your Upcoming Video Consultations</h3>
            <VideoConsultationsList userRole="patient" limit={3} />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button 
          onClick={() => {
            console.log('Mobile Start New Consultation clicked - navigating to /consultation');
            // Reset consultation store before starting new consultation
            resetConsultation();
            navigate("/consultation");
          }}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <Heart className="h-5 w-5 mr-2" />
          Start Instant Consultation
        </Button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
