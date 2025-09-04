import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/layouts/MobileLayout";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Consultation from "./pages/Consultation";
import { ConsultationWizard } from "./pages/consultation/ConsultationWizard";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeleconsultationBookingPage from "./pages/TeleconsultationBooking";
import VideoConsultationRoom from "./pages/VideoConsultationRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Desktop App wrapper
const DesktopApp = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/consultation" element={<Consultation />} />
    <Route path="/doctor/login" element={<DoctorLogin />} />
    <Route path="/doctor/dashboard" element={
      <ProtectedRoute redirectTo="/doctor/login" requireRole="doctor">
        <DoctorDashboard />
      </ProtectedRoute>
    } />
    <Route path="/customer/login" element={<CustomerAuth />} />
    <Route path="/customer/dashboard" element={
      <ProtectedRoute redirectTo="/customer/login" requireRole="customer">
        <CustomerDashboard />
      </ProtectedRoute>
    } />
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/teleconsultation" element={
      <ProtectedRoute redirectTo="/customer/login">
        <TeleconsultationBookingPage />
      </ProtectedRoute>
    } />
    <Route path="/consultation/video/:appointmentId" element={
      <ProtectedRoute redirectTo="/customer/login">
        <VideoConsultationRoom />
      </ProtectedRoute>
    } />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Mobile App wrapper
const MobileApp = () => (
  <Routes>
    <Route path="/" element={<MobileLayout><Index /></MobileLayout>} />
    <Route path="/consultation" element={<ConsultationWizard />} />
    <Route path="/doctor/login" element={<MobileLayout hideBottomNav={true}><DoctorLogin /></MobileLayout>} />
    <Route path="/doctor/dashboard" element={
      <ProtectedRoute redirectTo="/doctor/login" requireRole="doctor">
        <MobileLayout hideBottomNav={true}><DoctorDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    <Route path="/customer/login" element={<MobileLayout hideBottomNav={true}><CustomerAuth /></MobileLayout>} />
    <Route path="/customer/dashboard" element={
      <ProtectedRoute redirectTo="/customer/login" requireRole="customer">
        <MobileLayout><CustomerDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    <Route path="/admin/dashboard" element={<MobileLayout hideBottomNav={true}><AdminDashboard /></MobileLayout>} />
    <Route path="/teleconsultation" element={
      <ProtectedRoute redirectTo="/customer/login">
        <TeleconsultationBookingPage />
      </ProtectedRoute>
    } />
    <Route path="/consultation/video/:appointmentId" element={
      <ProtectedRoute redirectTo="/customer/login">
        <VideoConsultationRoom />
      </ProtectedRoute>
    } />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<MobileLayout hideBottomNav={true}><NotFound /></MobileLayout>} />
  </Routes>
);

const App = () => {
  const isMobile = useIsMobile();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {isMobile ? <MobileApp /> : <DesktopApp />}
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;