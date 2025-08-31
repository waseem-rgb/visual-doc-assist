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
import CustomerAuth from "./pages/CustomerAuth";
import CustomerDashboard from "./pages/CustomerDashboard";
import TeleconsultationBookingPage from "./pages/TeleconsultationBooking";
import VideoConsultationRoom from "./pages/VideoConsultationRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Customer Desktop App
const CustomerDesktopApp = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/consultation" element={<Consultation />} />
    <Route path="/login" element={<CustomerAuth />} />
    <Route path="/dashboard" element={
      <ProtectedRoute redirectTo="/login">
        <CustomerDashboard />
      </ProtectedRoute>
    } />
    <Route path="/teleconsultation" element={
      <ProtectedRoute redirectTo="/login">
        <TeleconsultationBookingPage />
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

// Customer Mobile App
const CustomerMobileApp = () => (
  <Routes>
    <Route path="/" element={<MobileLayout><Index /></MobileLayout>} />
    <Route path="/consultation" element={<ConsultationWizard />} />
    <Route path="/login" element={<MobileLayout hideBottomNav={true}><CustomerAuth /></MobileLayout>} />
    <Route path="/dashboard" element={
      <ProtectedRoute redirectTo="/login">
        <MobileLayout><CustomerDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    <Route path="/teleconsultation" element={
      <ProtectedRoute redirectTo="/login">
        <TeleconsultationBookingPage />
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

const AppCustomer = () => {
  const isMobile = useIsMobile();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {isMobile ? <CustomerMobileApp /> : <CustomerDesktopApp />}
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppCustomer;