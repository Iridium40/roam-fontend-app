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
import DebugAuth from "./pages/DebugAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/provider-portal" element={<ProviderPortal />} />
            <Route
              path="/provider-document-verification"
              element={<ProviderDocumentVerification />}
            />

            {/* Protected routes - any authenticated provider */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Owner-specific routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Dispatcher-specific routes */}
            <Route
              path="/dispatcher/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner", "dispatcher"]}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Provider-specific routes */}
            <Route
              path="/provider/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={["owner", "dispatcher", "provider"]}
                >
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Legacy route redirects */}
            <Route
              path="/provider-dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Business management - owner only */}
            <Route
              path="/business-management"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <BusinessManagement />
                </ProtectedRoute>
              }
            />

            {/* General protected routes */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/provider-onboarding"
              element={
                <ProtectedRoute>
                  <ProviderOnboarding />
                </ProtectedRoute>
              }
            />

            <Route path="/provider/:providerId" element={<ProviderProfile />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
