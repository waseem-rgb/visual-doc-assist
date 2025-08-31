import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Calendar as CalendarIcon, MessageCircle, User, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfDay, isBefore, isAfter, setHours, setMinutes } from 'date-fns';

interface DoctorAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Appointment {
  appointment_date: string;
}

interface TeleconsultationBookingProps {
  onBookingSuccess?: () => void;
}

export function TeleconsultationBooking({ onBookingSuccess }: TeleconsultationBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    complaint: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctorData();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDate]);

  const fetchDoctorData = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('id, full_name, specialization')
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setDoctorInfo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;
      console.log('Availability data:', data);
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate) return;

    try {
      const startOfSelectedDay = startOfDay(selectedDate);
      const endOfSelectedDay = addDays(startOfSelectedDay, 1);

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startOfSelectedDay.toISOString())
        .lt('appointment_date', endOfSelectedDay.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;
      setBookedSlots(data || []);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !availability.length) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return [];

    const slots = [];
    const startTime = dayAvailability.start_time.split(':');
    const endTime = dayAvailability.end_time.split(':');
    
    let current = setMinutes(setHours(new Date(), parseInt(startTime[0])), parseInt(startTime[1]));
    const end = setMinutes(setHours(new Date(), parseInt(endTime[0])), parseInt(endTime[1]));

    while (isBefore(current, end)) {
      const timeString = format(current, 'HH:mm');
      const appointmentDateTime = setMinutes(setHours(selectedDate, current.getHours()), current.getMinutes());
      
      const isBooked = bookedSlots.some(slot => {
        const slotTime = new Date(slot.appointment_date);
        return slotTime.getHours() === current.getHours() && slotTime.getMinutes() === current.getMinutes();
      });

      // Don't show past times for today
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const isPast = isToday && isAfter(now, appointmentDateTime);

      if (!isBooked && !isPast) {
        slots.push(timeString);
      }

      current = new Date(current.getTime() + 30 * 60 * 1000); // 30-minute slots
    }

    return slots;
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const today = new Date();
    
    // Don't allow past dates
    if (isBefore(date, startOfDay(today))) return false;
    
    // Don't allow more than 30 days in advance
    if (isAfter(date, addDays(today, 30))) return false;

    const hasAvailability = availability.some(a => a.day_of_week === dayOfWeek);
    console.log(`Date ${date.toDateString()}, dayOfWeek: ${dayOfWeek}, hasAvailability: ${hasAvailability}, availabilityLength: ${availability.length}`);
    return hasAvailability;
  };

  const generateWhatsAppLink = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone}?text=Hello! I'm ready for our scheduled teleconsultation.`;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select date and time.",
        variant: "destructive"
      });
      return;
    }

    if (!patientData.name || !patientData.age || !patientData.gender || !patientData.phone) {
      toast({
        title: "Patient Details Required",
        description: "Please fill in all patient information.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      
      // Use fallback doctor info if not loaded
      const defaultDoctorId = '9d2c7a4c-9da0-46c2-bc00-f102d0768e1a';
      const defaultDoctorPhone = '+971501234567';
      
      const whatsappLink = generateWhatsAppLink(doctorInfo?.phone || defaultDoctorPhone);

      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('appointments').insert({
        customer_id: user.user?.id,
        doctor_id: doctorInfo?.id || defaultDoctorId,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: 30,
        whatsapp_link: whatsappLink,
        patient_name: patientData.name,
        patient_age: patientData.age,
        patient_gender: patientData.gender,
        patient_phone: patientData.phone,
        chief_complaint: patientData.complaint,
        status: 'scheduled'
      });

      if (error) throw error;

      // Send SMS notification about appointment booking
      if (patientData.phone) {
        try {
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              to: patientData.phone,
              type: 'appointment_booked',
              patientName: patientData.name,
              doctorName: doctorInfo?.full_name || 'Dr. ' + (doctorInfo?.id || 'Unknown'),
              appointmentDate: format(appointmentDateTime, 'PPP'),
              appointmentTime: selectedTime
            }
          });
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // Don't fail the entire operation if SMS fails
        }
      }

      toast({
        title: "✅ Appointment Booked Successfully!",
        description: `Teleconsultation: ${format(appointmentDateTime, 'PPP')} at ${selectedTime}. SMS sent to ${patientData.phone}`,
      });

      // Show WhatsApp link prominently
      setTimeout(() => {
        toast({
          title: "📱 Your WhatsApp Consultation Link",
          description: "Click this link at your appointment time to join the consultation",
        });
        
        // Auto-open WhatsApp link for easy access
        if (confirm("Open WhatsApp now to save your consultation link?")) {
          window.open(whatsappLink, '_blank');
        }
      }, 2000);

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setPatientData({ name: '', age: '', gender: '', phone: '', complaint: '' });
      
      onBookingSuccess?.();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Book Teleconsultation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Info */}
          {doctorInfo && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">{doctorInfo.full_name}</h3>
              <p className="text-muted-foreground">{doctorInfo.specialization}</p>
              <p className="text-sm text-muted-foreground">License: {doctorInfo.license_number}</p>
            </div>
          )}

          {/* Patient Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Patient Name *</Label>
              <Input
                id="name"
                placeholder="Enter patient name"
                value={patientData.name}
                onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                placeholder="Enter age"
                value={patientData.age}
                onChange={(e) => setPatientData(prev => ({ ...prev, age: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={patientData.gender}
                onChange={(e) => setPatientData(prev => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={patientData.phone}
                onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint">Chief Complaint</Label>
            <Textarea
              id="complaint"
              placeholder="Briefly describe the main health concern..."
              value={patientData.complaint}
              onChange={(e) => setPatientData(prev => ({ ...prev, complaint: e.target.value }))}
            />
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  console.log('Date selected:', date);
                  setSelectedDate(date);
                }}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border"
              />
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Available Times
              </h3>
              {selectedDate ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {getAvailableTimeSlots().map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className="justify-center"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                  {getAvailableTimeSlots().length === 0 && (
                    <p className="text-muted-foreground col-span-2 text-center py-4">
                      No available times for this date
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Please select a date first</p>
              )}
            </div>
          </div>

          {/* WhatsApp Info */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">📱 WhatsApp Video Consultation</h4>
            <p className="text-green-700 text-sm">
              Your consultation will be conducted via WhatsApp video call. You'll receive a WhatsApp link 
              to join the consultation at your scheduled time.
            </p>
          </div>

          {/* Book Button */}
          <Button 
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTime || loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Booking..." : "Book Teleconsultation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}