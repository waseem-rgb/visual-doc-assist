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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Desktop App wrapper
const DesktopApp = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/consultation" element={<Consultation />} />
    <Route path="/doctor/login" element={<DoctorLogin />} />
    <Route path="/doctor/dashboard" element={
      <ProtectedRoute redirectTo="/doctor/login">
        <DoctorDashboard />
      </ProtectedRoute>
    } />
    <Route path="/customer/login" element={<CustomerAuth />} />
    <Route path="/customer/dashboard" element={
      <ProtectedRoute redirectTo="/customer/login">
        <CustomerDashboard />
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
    <Route path="/doctor/login" element={<MobileLayout><DoctorLogin /></MobileLayout>} />
    <Route path="/doctor/dashboard" element={
      <ProtectedRoute redirectTo="/doctor/login">
        <MobileLayout><DoctorDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    <Route path="/customer/login" element={<MobileLayout><CustomerAuth /></MobileLayout>} />
    <Route path="/customer/dashboard" element={
      <ProtectedRoute redirectTo="/customer/login">
        <MobileLayout><CustomerDashboard /></MobileLayout>
      </ProtectedRoute>
    } />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<MobileLayout><NotFound /></MobileLayout>} />
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
