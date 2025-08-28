import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PrescriptionRequestDetail from "@/components/PrescriptionRequestDetail";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      console.log("Dashboard loading - bypassing auth checks");
      
      // Skip auth checks for now - set mock doctor profile
      setDoctorProfile({
        full_name: "Dr. Waseem Ahmed", 
        specialization: "General Medicine",
        license_number: "MD12345"
      });

      // Mock some sample prescription requests for testing
      const mockRequests: PrescriptionRequest[] = [
        {
          id: "1",
          patient_name: "John Doe",
          patient_age: "35",
          patient_gender: "male",
          body_part: "chest",
          symptoms: "Chest pain and shortness of breath",
          probable_diagnosis: "Possible angina",
          short_summary: "Patient reports chest pain during physical activity",
          basic_investigations: "ECG, Chest X-ray, Cardiac enzymes",
          common_treatments: "Rest, Nitrates, Beta-blockers",
          prescription_required: true,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          assigned_doctor_id: null
        },
        {
          id: "2", 
          patient_name: "Jane Smith",
          patient_age: "28",
          patient_gender: "female",
          body_part: "head",
          symptoms: "Severe headache and nausea",
          probable_diagnosis: "Migraine",
          short_summary: "Recurring headaches with photophobia",
          basic_investigations: "Neurological examination",
          common_treatments: "Sumatriptan, Rest in dark room",
          prescription_required: true,
          status: 'in_progress' as const,
          created_at: new Date().toISOString(),
          assigned_doctor_id: "doc1"
        }
      ];
      
      setRequests(mockRequests);
      
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
    // Simple navigation back to login without auth
    navigate("/doctor/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
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
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
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
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-blue-500" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({stats.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
          </TabsList>

          {(['pending', 'in_progress', 'completed'] as const).map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              <div className="grid gap-4">
                {requests
                  .filter(request => request.status === status)
                  .map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
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
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;