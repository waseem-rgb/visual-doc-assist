import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Phone,
  AlertCircle 
} from 'lucide-react';
import { format, isToday, isFuture, isPast, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface VideoConsultationCardProps {
  appointment: {
    id: string;
    appointment_date: string;
    patient_name: string;
    patient_phone: string;
    chief_complaint?: string;
    status: string;
    doctor_profiles?: {
      full_name: string;
      specialization: string;
    };
  };
  userRole: 'doctor' | 'patient';
}

export function VideoConsultationCard({ appointment, userRole }: VideoConsultationCardProps) {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  
  const appointmentDate = new Date(appointment.appointment_date);
  const now = new Date();
  const minutesUntil = differenceInMinutes(appointmentDate, now);
  
  // Determine if the consultation can be joined
  const canJoin = () => {
    if (userRole === 'doctor') {
      // Doctors can join 30 minutes before and up to 2 hours after
      return minutesUntil <= 30 && minutesUntil >= -120;
    } else {
      // Patients can join 15 minutes before and up to 1 hour after
      return minutesUntil <= 15 && minutesUntil >= -60;
    }
  };

  const getStatusBadge = () => {
    if (isPast(appointmentDate) && minutesUntil < -60) {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (canJoin()) {
      return <Badge variant="default" className="bg-green-600">Ready to Join</Badge>;
    } else if (isFuture(appointmentDate)) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else {
      return <Badge variant="secondary">Ended</Badge>;
    }
  };

  const getJoinButtonText = () => {
    if (minutesUntil > 0) {
      return `Join in ${minutesUntil} minutes`;
    } else if (minutesUntil >= -15) {
      return 'Join Now';
    } else {
      return 'Join Consultation';
    }
  };

  const handleJoinConsultation = async () => {
    setIsJoining(true);
    try {
      navigate(`/consultation/video/${appointment.id}`);
    } catch (error) {
      console.error('Error joining consultation:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Consultation
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Appointment Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, 'HH:mm')}</span>
          </div>
        </div>

        {/* Patient/Doctor Info */}
        <div className="space-y-2">
          {userRole === 'doctor' ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Patient: {appointment.patient_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.patient_phone}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  Dr. {appointment.doctor_profiles?.full_name || 'Doctor'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {appointment.doctor_profiles?.specialization || 'General Medicine'}
              </div>
            </>
          )}
        </div>

        {/* Chief Complaint */}
        {appointment.chief_complaint && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Chief Complaint: </span>
              {appointment.chief_complaint}
            </p>
          </div>
        )}

        {/* Join Button or Info */}
        <div className="pt-2">
          {canJoin() ? (
            <Button 
              onClick={handleJoinConsultation}
              disabled={isJoining}
              className="w-full"
              size="lg"
            >
              {isJoining ? 'Joining...' : getJoinButtonText()}
            </Button>
          ) : isFuture(appointmentDate) ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>
                You can join {userRole === 'doctor' ? '30' : '15'} minutes before the scheduled time
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>This consultation has ended</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}