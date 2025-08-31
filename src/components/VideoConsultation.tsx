import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Circle,
  Square,
  Users,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMLDataCollection } from '@/hooks/useMLDataCollection';
import { format } from 'date-fns';

interface VideoConsultationProps {
  appointmentId: string;
  userRole: 'doctor' | 'patient';
  onConsultationEnd: () => void;
}

export function VideoConsultation({ appointmentId, userRole, onConsultationEnd }: VideoConsultationProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [consultationSession, setConsultationSession] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [consultationStartTime, setConsultationStartTime] = useState<Date | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const { toast } = useToast();
  const { submitToMLEngine } = useMLDataCollection();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeVideoConsultation();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeVideoConsultation = async () => {
    try {
      // Create or join video consultation session
      const { data: session, error } = await supabase
        .from('video_consultations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!session) {
        // Create new session if doctor
        if (userRole === 'doctor') {
          const roomId = `room_${appointmentId}_${Date.now()}`;
          const { data: newSession, error: createError } = await supabase
            .from('video_consultations')
            .insert({
              appointment_id: appointmentId,
              room_id: roomId,
              status: 'waiting'
            })
            .select()
            .single();

          if (createError) throw createError;
          setConsultationSession(newSession);
        }
      } else {
        setConsultationSession(session);
      }

      // Initialize media devices
      await initializeMedia();
      
      // Set up peer connection
      setupPeerConnection();

    } catch (error) {
      console.error('Failed to initialize video consultation:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize video consultation",
        variant: "destructive"
      });
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Failed to access media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Please allow camera and microphone access",
        variant: "destructive"
      });
    }
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && consultationSession) {
        // Send ICE candidate to remote peer via Supabase realtime
        sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId: consultationSession.room_id
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        if (!consultationStartTime) {
          setConsultationStartTime(new Date());
          updateConsultationStatus('active');
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    setPeerConnection(pc);
    
    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
  };

  const sendSignalingMessage = async (message: any) => {
    // Implement signaling via Supabase realtime
    // This would typically involve sending messages through a channel
    console.log('Sending signaling message:', message);
  };

  const updateConsultationStatus = async (status: string) => {
    if (!consultationSession) return;

    try {
      await supabase
        .from('video_consultations')
        .update({ 
          status,
          started_at: status === 'active' ? new Date().toISOString() : undefined
        })
        .eq('id', consultationSession.id);
    } catch (error) {
      console.error('Failed to update consultation status:', error);
    }
  };

  const requestRecordingPermission = () => {
    setShowConsentDialog(true);
  };

  const handleRecordingConsent = async (consent: boolean) => {
    setRecordingConsent(consent);
    setShowConsentDialog(false);

    if (consent) {
      // Update consent in database
      const consentField = userRole === 'doctor' ? 'recording_consent_doctor' : 'recording_consent_patient';
      
      try {
        await supabase
          .from('video_consultations')
          .update({ [consentField]: true })
          .eq('id', consultationSession.id);

        // Check if both parties have consented
        const { data: session } = await supabase
          .from('video_consultations')
          .select('recording_consent_doctor, recording_consent_patient')
          .eq('id', consultationSession.id)
          .single();

        if (session?.recording_consent_doctor && session?.recording_consent_patient) {
          startRecording();
        }
      } catch (error) {
        console.error('Failed to update recording consent:', error);
      }
    }
  };

  const startRecording = async () => {
    if (!localStream || !remoteStream) return;

    try {
      // Create a combined stream for recording
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      
      const localVideo = localVideoRef.current!;
      const remoteVideo = remoteVideoRef.current!;
      
      const drawFrame = () => {
        if (isRecording) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw remote video (main)
          ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
          
          // Draw local video (picture-in-picture)
          const pipWidth = 320;
          const pipHeight = 180;
          ctx.drawImage(
            localVideo, 
            canvas.width - pipWidth - 20, 
            20, 
            pipWidth, 
            pipHeight
          );
          
          requestAnimationFrame(drawFrame);
        }
      };

      const canvasStream = canvas.captureStream(30);
      
      // Combine video from canvas with audio from both streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      if (localStream.getAudioTracks()[0]) {
        const localAudio = audioContext.createMediaStreamSource(localStream);
        localAudio.connect(destination);
      }
      
      if (remoteStream.getAudioTracks()[0]) {
        const remoteAudio = audioContext.createMediaStreamSource(remoteStream);
        remoteAudio.connect(destination);
      }

      const recordingStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        await saveRecording();
      };

      recorder.start(1000); // Record in 1-second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);
      drawFrame();

      await supabase
        .from('video_consultations')
        .update({ recording_enabled: true })
        .eq('id', consultationSession.id);

      toast({
        title: "Recording Started",
        description: "The consultation is now being recorded for ML training"
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (recordedChunks.length === 0) return;

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const fileName = `consultation_${consultationSession.id}_${Date.now()}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('consultation-recordings')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Update consultation with recording URL
      const { data: { publicUrl } } = supabase.storage
        .from('consultation-recordings')
        .getPublicUrl(fileName);

      await supabase
        .from('video_consultations')
        .update({
          recording_url: publicUrl,
          recording_metadata: {
            fileName,
            size: blob.size,
            duration: consultationStartTime ? Date.now() - consultationStartTime.getTime() : null
          }
        })
        .eq('id', consultationSession.id);

      // Create ML training session entry
      await supabase
        .from('ml_training_sessions')
        .insert({
          video_consultation_id: consultationSession.id,
          processing_status: 'pending'
        });

      setRecordedChunks([]);
      
      toast({
        title: "Recording Saved",
        description: "Consultation recording has been saved for ML training"
      });

    } catch (error) {
      console.error('Failed to save recording:', error);
      toast({
        title: "Save Error",
        description: "Failed to save recording",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endConsultation = async () => {
    try {
      if (isRecording) {
        stopRecording();
      }

      await supabase
        .from('video_consultations')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', consultationSession.id);

      // Submit consultation data to ML engine
      try {
        await submitToMLEngine({
          videoConsultationId: consultationSession.id,
          consultationType: 'teleconsultation',
          symptoms: 'Video consultation symptoms - to be extracted from recording',
          diagnosis: 'To be determined from consultation analysis',
          treatmentPlan: 'To be determined by doctor during consultation'
        });
      } catch (mlError) {
        console.error('Failed to submit to ML engine:', mlError);
        // Don't fail the consultation end if ML submission fails
      }

      cleanup();
      onConsultationEnd();

      toast({
        title: "Consultation Ended",
        description: "The video consultation has been completed and submitted for ML training"
      });

    } catch (error) {
      console.error('Failed to end consultation:', error);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Video Consultation</h1>
            <p className="text-sm text-muted-foreground">
              {userRole === 'doctor' ? 'Doctor View' : 'Patient View'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {consultationStartTime && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(consultationStartTime, 'HH:mm')}
            </Badge>
          )}
          
          {isConnected && (
            <Badge variant="default" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Connected
            </Badge>
          )}
          
          {isRecording && (
            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
              <Circle className="h-3 w-3 fill-current" />
              Recording
            </Badge>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Card className="p-6 text-center">
              <CardContent className="space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground">
                  {userRole === 'doctor' ? 'Waiting for patient to join...' : 'Connecting to doctor...'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full h-12 w-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full h-12 w-12"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {userRole === 'doctor' && !isRecording && (
            <Button
              variant="outline"
              size="lg"
              onClick={requestRecordingPermission}
              className="rounded-full h-12 w-12"
            >
              <Circle className="h-5 w-5" />
            </Button>
          )}

          {isRecording && (
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="rounded-full h-12 w-12"
            >
              <Square className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="destructive"
            size="lg"
            onClick={endConsultation}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Recording Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recording Consent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This consultation will be recorded for ML training purposes to improve our diagnostic capabilities. 
              The recording will be securely stored and used only for medical AI development.
            </p>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                checked={recordingConsent}
                onCheckedChange={(checked) => setRecordingConsent(!!checked)}
              />
              <label htmlFor="consent" className="text-sm">
                I consent to this consultation being recorded for ML training purposes
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleRecordingConsent(true)}
                disabled={!recordingConsent}
                className="flex-1"
              >
                Start Recording
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRecordingConsent(false)}
                className="flex-1"
              >
                Continue Without Recording
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}