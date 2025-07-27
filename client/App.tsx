import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, RoleBasedRedirect } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Providers from "./pages/Providers";
import About from "./pages/About";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import MyBookings from "./pages/MyBookings";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import ProviderProfile from "./pages/ProviderProfile";
import ProviderDocumentVerification from "./pages/ProviderDocumentVerification";
import BusinessManagement from "./pages/BusinessManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/provider-portal" element={<ProviderPortal />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/provider-onboarding" element={<ProviderOnboarding />} />
          <Route
            path="/provider-document-verification"
            element={<ProviderDocumentVerification />}
          />
          <Route path="/provider/:providerId" element={<ProviderProfile />} />
          <Route path="/business-management" element={<BusinessManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
