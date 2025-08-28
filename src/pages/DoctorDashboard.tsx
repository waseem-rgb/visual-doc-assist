import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  Users, 
  Clock, 
  CheckCircle, 
  Phone,
  FileText,
  User,
  Calendar,
  Stethoscope
} from 'lucide-react';
import PrescriptionRequestDetail from '@/components/PrescriptionRequestDetail';

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
  assigned_doctor_id: string | null;
  created_at: string;
}

interface DoctorProfile {
  full_name: string;
  specialization: string;
  license_number: string;
}

const DoctorDashboard = () => {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PrescriptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/doctor/login');
      return;
    }

    // Check doctor role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'doctor');

    if (!roles || roles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have doctor privileges.',
      });
      await supabase.auth.signOut();
      navigate('/doctor/login');
      return;
    }

    await Promise.all([
      loadDoctorProfile(session.user.id),
      loadPrescriptionRequests()
    ]);
    setLoading(false);
  };

  const loadDoctorProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading doctor profile:', error);
    } else {
      setDoctorProfile(data);
    }
  };

  const loadPrescriptionRequests = async () => {
    const { data, error } = await supabase
      .from('prescription_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load prescription requests.',
      });
    } else {
      setRequests(data || []);
      
      // Calculate stats
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const inProgress = data?.filter(r => r.status === 'in_progress').length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      
      setStats({
        pending,
        inProgress,
        completed,
        total: data?.length || 0
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/doctor/login');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-red-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <PrescriptionRequestDetail
        request={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          loadPrescriptionRequests();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
                {doctorProfile && (
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {doctorProfile.full_name} • {doctorProfile.specialization}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cases</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-red-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prescription Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Cases</CardTitle>
            <CardDescription>
              Manage prescription requests and patient consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              </TabsList>
              
              {['pending', 'in_progress', 'completed'].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {requests
                    .filter(r => r.status === status)
                    .map((request) => (
                      <Card key={request.id} className="hover:shadow-medium transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold">{request.patient_name}</span>
                                </div>
                                <Badge variant={getStatusBadgeVariant(request.status)}>
                                  {request.status.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(request.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Age:</span> {request.patient_age}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Gender:</span> {request.patient_gender}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Body Part:</span> {request.body_part}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Type:</span>{' '}
                                  {request.prescription_required ? 'Prescription' : 'Referral'}
                                </div>
                              </div>
                              
                              {request.probable_diagnosis && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  <span className="font-medium">Probable Diagnosis:</span> {request.probable_diagnosis}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  
                  {requests.filter(r => r.status === status).length === 0 && (
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        status === 'pending' ? 'bg-red-100' :
                        status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {status === 'pending' ? <Clock className={`w-8 h-8 text-red-600`} /> :
                         status === 'in_progress' ? <FileText className={`w-8 h-8 text-yellow-600`} /> :
                         <CheckCircle className={`w-8 h-8 text-green-600`} />}
                      </div>
                      <p className="text-muted-foreground">
                        No {status.replace('_', ' ')} cases
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;