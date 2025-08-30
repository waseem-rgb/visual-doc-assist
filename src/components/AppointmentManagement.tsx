import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MessageCircle, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  whatsapp_link: string | null;
  notes: string | null;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  patient_phone: string;
  chief_complaint: string | null;
}

interface AppointmentManagementProps {
  userRole?: 'customer' | 'doctor';
}

export function AppointmentManagement({ userRole = 'customer' }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [userRole]);

  const fetchAppointments = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (userRole === 'customer') {
        query = query.eq('customer_id', user.user.id);
      } else if (userRole === 'doctor') {
        query = query.eq('doctor_id', user.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully`
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {userRole === 'customer' ? 'My Appointments' : 'Patient Appointments'}
      </h2>
      
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No appointments scheduled</p>
          </CardContent>
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{appointment.patient_name}</span>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(appointment.appointment_date), 'PPP')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(appointment.appointment_date), 'p')} ({appointment.duration_minutes} min)
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {appointment.patient_phone}
                    </div>
                    <div>
                      Age: {appointment.patient_age}, Gender: {appointment.patient_gender}
                    </div>
                  </div>

                  {appointment.chief_complaint && (
                    <div className="mt-2">
                      <p className="text-sm"><strong>Chief Complaint:</strong> {appointment.chief_complaint}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mt-2">
                      <p className="text-sm"><strong>Notes:</strong> {appointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {appointment.whatsapp_link && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => window.open(appointment.whatsapp_link!, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Join WhatsApp Call
                    </Button>
                  )}

                  {userRole === 'doctor' && (
                    <div className="flex gap-2">
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                        >
                          Start Call
                        </Button>
                      )}
                      {appointment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}

                  {userRole === 'customer' && appointment.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}