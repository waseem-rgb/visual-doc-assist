import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/layouts/MobileLayout";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import IndexDoctor from "./pages/IndexDoctor";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import VideoConsultationRoom from "./pages/VideoConsultationRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Doctor Desktop App
const DoctorDesktopApp = () => (
  <Routes>
    <Route path="/" element={<IndexDoctor />} />
    <Route path="/login" element={<DoctorLogin />} />
    <Route path="/dashboard" element={
      <ProtectedRoute redirectTo="/login">
        <DoctorDashboard />
      </ProtectedRoute>
    } />
    <Route path="/consultation/video/:appointmentId" element={
      <ProtectedRoute redirectTo="/login">
        <VideoConsultationRoom />
      </ProtectedRoute>
    } />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Doctor Mobile App
const DoctorMobileApp = () => (
  <Routes>
    <Route path="/" element={<MobileLayout><IndexDoctor /></MobileLayout>} />
    <Route path="/login" element={<MobileLayout hideBottomNav={true}><DoctorLogin /></MobileLayout>} />
    <Route path="/dashboard" element={
      <ProtectedRoute redirectTo="/login">
        <MobileLayout hideBottomNav={true}><DoctorDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    <Route path="/consultation/video/:appointmentId" element={
      <ProtectedRoute redirectTo="/login">
        <VideoConsultationRoom />
      </ProtectedRoute>
    } />
    <Route path="*" element={<MobileLayout hideBottomNav={true}><NotFound /></MobileLayout>} />
  </Routes>
);

const AppDoctor = () => {
  const isMobile = useIsMobile();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {isMobile ? <DoctorMobileApp /> : <DoctorDesktopApp />}
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppDoctor;