import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Stethoscope, 
  Users, 
  Clock, 
  CheckCircle, 
  LogOut, 
  User, 
  Calendar,
  Phone,
  FileText,
  Eye,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PrescriptionRequestDetail from "@/components/PrescriptionRequestDetail";
import { AppointmentManagement } from "@/components/AppointmentManagement";
import { VideoConsultationsList } from '@/components/VideoConsultationsList';

interface PrescriptionRequest {
  id: string;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  body_part: string;
  symptoms: string;
  probable_diagnosis: string;
  short_summary: string;
  basic_investigations: string;
  common_treatments: string;
  prescription_required: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  assigned_doctor_id: string | null;
  is_referral?: boolean;
  referral_type?: string | null;
  patient_phone?: string;
  clinical_history?: string;
  chief_complaint?: string;
  physical_examination?: string;
  external_source?: string | null;
  external_id?: string | null;
  callback_url?: string | null;
  prescription?: {
    id: string;
    medications: string;
    instructions: string;
    pdf_url?: string;
    created_at: string;
  } | null;
}

interface DoctorProfile {
  full_name: string;
  specialization: string;
  license_number: string;
}

const DoctorDashboard = () => {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PrescriptionRequest | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [importedRequestId, setImportedRequestId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
    
    // Set up auto-refresh every 10 seconds to pull new requests and update PDF status
    const interval = setInterval(() => {
      if (!loading) {
        checkAuthAndFetchData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Check for imported consultation parameter
    const searchParams = new URLSearchParams(location.search);
    const imported = searchParams.get('imported');
    
    if (imported) {
      setImportedRequestId(imported);
      // Clean URL after capturing the parameter
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search]);

  const checkAuthAndFetchData = async () => {
    try {
      console.log("Dashboard loading - checking authentication");
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found");
        navigate("/doctor/login");
        return;
      }

      setUser(user);

      // Check if user has doctor role
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) throw roleError;

      const hasDocRole = roles?.some(r => r.role === 'doctor');
      if (!hasDocRole) {
        console.log("User doesn't have doctor role");
        await supabase.auth.signOut();
        navigate("/doctor/login");
        return;
      }

      // Fetch doctor profile
      const { data: profile, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setDoctorProfile(profile);
      } else {
        // Create default profile if none exists
        setDoctorProfile({
          full_name: user.email?.split('@')[0] || "Doctor",
          specialization: "General Medicine",
          license_number: "Pending"
        });
      }

      // Fetch real prescription requests from Supabase
      const { data: requestsData, error: requestsError } = await supabase
        .from("prescription_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        throw requestsError;
      }

      // Fetch prescriptions for completed cases
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (prescriptionsError) {
        console.error("Error fetching prescriptions:", prescriptionsError);
        // Don't throw error, just log it as prescriptions are optional
      }

      // Process requests and determine prescription requirement based on New Master data
      const processedRequests = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Check New Master table for prescription requirement logic
          const { data: masterData, error: masterError } = await supabase
            .from("New Master")
            .select("*")
            .ilike("Probable Diagnosis", `%${request.probable_diagnosis}%`)
            .limit(1);

          if (masterError) {
            console.error("Error fetching master data:", masterError);
          }

          // Determine if prescription is required or referral based on "prescription_Y-N" column
          const masterRecord = masterData?.[0];
          let prescriptionRequired = true;
          let isReferral = false;

          if (masterRecord && masterRecord["prescription_Y-N"]) {
            const prescriptionStatus = masterRecord["prescription_Y-N"].toLowerCase();
            
            // If it contains "doctors review and prescription", it needs prescription
            if (prescriptionStatus.includes("doctors review and prescription")) {
              prescriptionRequired = true;
              isReferral = false;
            }
            // If it contains specialist names, it's a referral
            else if (prescriptionStatus.includes("cardiologist") || 
                     prescriptionStatus.includes("ent specialist") || 
                     prescriptionStatus.includes("dermatologist") ||
                     prescriptionStatus.includes("specialist")) {
              prescriptionRequired = false;
              isReferral = true;
            }
          }

          // Find prescription for this request if it's completed
          const prescription = prescriptionsData?.find(p => p.request_id === request.id);

          return {
            ...request,
            prescription_required: prescriptionRequired,
            is_referral: isReferral,
            referral_type: isReferral ? masterRecord?.["prescription_Y-N"] : null,
            prescription: prescription ? {
              id: prescription.id,
              medications: prescription.medications,
              instructions: prescription.instructions,
              pdf_url: prescription.pdf_url,
              created_at: prescription.created_at
            } : null
          };
        })
      );

      setRequests(processedRequests);
      
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/doctor/login");
  };

  const handleViewPrescription = async (request: PrescriptionRequest) => {
    if (request.prescription) {
      try {
        // Use the new download function to get fresh signed URL
        const { data, error } = await supabase.functions.invoke('download-prescription', {
          body: { 
            prescriptionId: request.prescription.id,
            requestId: request.id 
          }
        });

        if (error || !data?.success) {
          console.error('Error downloading prescription:', error);
          
          // If download fails, try to generate a new PDF
          toast({
            title: "Generating PDF",
            description: "Please wait while we prepare your prescription...",
          });

          const { data: generateData, error: generateError } = await supabase.functions.invoke('generate-prescription-pdf-simple', {
            body: {
              requestId: request.id,
              doctorId: user?.id
            }
          });

          if (generateError || !generateData?.success) {
            throw new Error('Failed to generate prescription');
          }

          if (generateData?.pdfUrl) {
            window.open(generateData.pdfUrl, '_blank');
            
            toast({
              title: "Success",
              description: "Prescription PDF generated successfully!",
            });
          }
          return;
        }

        // Open the fresh signed URL
        window.open(data.downloadUrl, '_blank');
        
      } catch (error) {
        console.error('Error handling prescription:', error);
        toast({
          title: "Error",
          description: "Failed to generate prescription PDF",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-primary';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusCounts = () => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      total: requests.length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <PrescriptionRequestDetail
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onUpdate={(updatedRequest) => {
          setRequests(requests.map(r => 
            r.id === updatedRequest.id ? updatedRequest : r
          ));
          setSelectedRequest(null);
        }}
      />
    );
  }

  const stats = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">VrDoc</h1>
              </div>
              <div className="hidden md:block">
                <p className="text-lg font-semibold text-foreground">
                  Welcome, {doctorProfile?.full_name || "Doctor"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {doctorProfile?.specialization}
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
                 <div className="bg-primary/10 p-3 rounded-full">
                   <Users className="h-6 w-6 text-primary" />
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
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                 <div className="bg-primary/10 p-3 rounded-full">
                   <FileText className="h-6 w-6 text-primary" />
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

        {/* Request Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Instant Consults ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({stats.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <MessageCircle className="h-4 w-4 mr-2" />
              Teleconsultations
            </TabsTrigger>
          </TabsList>

          {(['pending', 'in_progress', 'completed'] as const).map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              <div className="grid gap-4">
                {requests
                  .filter(request => request.status === status)
                  .map((request) => (
                     <Card key={request.id} className={`hover:shadow-md transition-shadow ${
                       importedRequestId === request.id 
                         ? 'border-primary border-2 bg-primary/5' 
                         : ''
                     }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {request.patient_name}
                                </span>
                              </div>
                               <Badge className={getStatusColor(request.status)}>
                                 {request.status.replace('_', ' ')}
                               </Badge>
                               {importedRequestId === request.id && (
                                 <Badge variant="outline" className="border-primary text-primary">
                                   Imported from DAIGASST
                                 </Badge>
                               )}
                               {request.external_source && (
                                 <Badge variant="secondary">
                                   {request.external_source}
                                 </Badge>
                               )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{request.patient_age} years old</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{request.patient_gender}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{request.body_part}</span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {request.short_summary || request.symptoms}
                            </p>
                          </div>

                           <div className="flex items-center gap-2 ml-4">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setSelectedRequest(request)}
                             >
                               <Eye className="h-4 w-4 mr-1" />
                               View Details
                             </Button>
                             
                             {/* Show prescription button for completed cases */}
                             {request.status === 'completed' && request.prescription && (
                               <Button
                                 variant="default"
                                 size="sm"
                                 onClick={() => handleViewPrescription(request)}
                                 className="bg-green-600 hover:bg-green-700"
                               >
                                 <FileText className="h-4 w-4 mr-1" />
                                 View Prescription
                               </Button>
                             )}
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {requests.filter(request => request.status === status).length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No {status.replace('_', ' ')} requests found</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-6">
            <VideoConsultationsList userRole="doctor" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;