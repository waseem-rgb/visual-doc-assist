import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoConsultationCard } from './VideoConsultationCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface VideoConsultationsListProps {
  userRole: 'doctor' | 'patient';
  limit?: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  patient_name: string;
  patient_phone: string;
  chief_complaint?: string;
  status: string;
  doctor_profiles?: {
    full_name: string;
    specialization: string;
  } | null;
}

export function VideoConsultationsList({ userRole, limit }: VideoConsultationsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, userRole]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          patient_name,
          patient_phone,
          chief_complaint,
          status,
          doctor_profiles!appointments_doctor_id_fkey(full_name, specialization)
        `)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true });

      // Filter based on user role
      if (userRole === 'doctor') {
        query = query.eq('doctor_id', user.id);
      } else {
        query = query.eq('customer_id', user.id);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAppointments((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Video Consultations Scheduled</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'doctor' 
              ? 'No upcoming video consultations with patients.' 
              : 'Book your first video consultation with a doctor.'}
          </p>
          {userRole === 'patient' && (
            <Button onClick={() => navigate('/teleconsultation')}>
              <Calendar className="h-4 w-4 mr-2" />
              Book Video Consultation
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <VideoConsultationCard
          key={appointment.id}
          appointment={appointment}
          userRole={userRole}
        />
      ))}
      
      {limit && appointments.length === limit && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate(userRole === 'doctor' ? '/doctor/dashboard' : '/customer/dashboard')}
              className="text-primary hover:text-primary-dark"
            >
              View All Consultations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}