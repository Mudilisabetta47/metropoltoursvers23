import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import CheckoutPage from "./pages/CheckoutPage";
import ServicePage from "./pages/ServicePage";
import BusinessServicesPage from "./pages/BusinessServicesPage";
import BookingsPage from "./pages/BookingsPage";
import AuthPage from "./pages/AuthPage";
import ImprintPage from "./pages/ImprintPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import TourDetailPage from "./components/tours/TourDetailPage";
import AdminInquiriesPage from "./pages/AdminInquiriesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCMS from "./pages/AdminCMS";
import AdminTourBuilder from "./pages/AdminTourBuilder";
import OperationsDashboard from "./pages/OperationsDashboard";
import WeekendTripsPage from "./pages/WeekendTripsPage";
import NotFound from "./pages/NotFound";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/service" element={<ServicePage />} />
            <Route path="/business" element={<BusinessServicesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/wochenendtrips" element={<WeekendTripsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/imprint" element={<ImprintPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/pauschalreisen/:tourId" element={<TourDetailPage />} />
            <Route path="/reisen/:tourId" element={<TourDetailPage />} />
            <Route path="/admin" element={<Navigate to="/admin/ops" replace />} />
            <Route path="/admin/ops" element={<OperationsDashboard />} />
            <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/cms" element={<AdminCMS />} />
            <Route path="/admin/tour-builder" element={<AdminTourBuilder />} />
            <Route path="/admin/tour-builder/:tourId" element={<AdminTourBuilder />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;