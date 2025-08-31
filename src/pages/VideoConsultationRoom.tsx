import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { VideoConsultation } from '@/components/VideoConsultation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VideoConsultationRoom() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<any>(null);
  const [userRole, setUserRole] = useState<'doctor' | 'patient'>('patient');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId || !user) return;
    
    fetchAppointmentDetails();
  }, [appointmentId, user]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch appointment details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor_profiles!appointments_doctor_id_fkey(full_name, specialization)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      if (!appointmentData) {
        throw new Error('Appointment not found');
      }

      // Check if user has access to this appointment
      const hasAccess = appointmentData.customer_id === user.id || appointmentData.doctor_id === user.id;
      
      if (!hasAccess) {
        throw new Error('You do not have access to this consultation');
      }

      // Determine user role
      const role = appointmentData.doctor_id === user.id ? 'doctor' : 'patient';
      setUserRole(role);
      setAppointment(appointmentData);

      // Check if consultation is scheduled for today or if it's a doctor (doctors can join anytime)
      const appointmentDate = new Date(appointmentData.appointment_date);
      const now = new Date();
      const isToday = appointmentDate.toDateString() === now.toDateString();
      const canJoin = role === 'doctor' || isToday;

      if (!canJoin) {
        setError('This consultation is not scheduled for today');
        return;
      }

    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultationEnd = () => {
    toast({
      title: "Consultation Completed",
      description: "Thank you for using our video consultation service"
    });
    
    if (userRole === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => navigate(-1)}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment || !appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Consultation not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <VideoConsultation
      appointmentId={appointmentId}
      userRole={userRole}
      onConsultationEnd={handleConsultationEnd}
    />
  );
}