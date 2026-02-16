import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import CookieBanner from "./components/CookieBanner";

// Lazy-loaded pages for code splitting
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const ReisenPage = lazy(() => import("./pages/ReisenPage"));
const BusinessServicesPage = lazy(() => import("./pages/BusinessServicesPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ImprintPage = lazy(() => import("./pages/ImprintPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const TourDetailPage = lazy(() => import("./components/tours/TourDetailPage"));
const TourCheckoutPage = lazy(() => import("./pages/TourCheckoutPage"));
const AdminInquiriesPage = lazy(() => import("./pages/AdminInquiriesPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCMS = lazy(() => import("./pages/AdminCMS"));
const AdminTourBuilder = lazy(() => import("./pages/AdminTourBuilder"));
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard"));
const WeekendTripsPage = lazy(() => import("./pages/WeekendTripsPage"));
const WeekendTripDetailPage = lazy(() => import("./pages/WeekendTripDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/service" element={<ServicePage />} />
              <Route path="/reisen" element={<ReisenPage />} />
              <Route path="/business" element={<BusinessServicesPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/wochenendtrips" element={<WeekendTripsPage />} />
              <Route path="/wochenendtrips/:destination" element={<WeekendTripDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/imprint" element={<ImprintPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/pauschalreisen/:tourId" element={<TourDetailPage />} />
              <Route path="/reisen/:tourId" element={<TourDetailPage />} />
              <Route path="/reisen/checkout" element={<TourCheckoutPage />} />
              <Route path="/admin" element={<Navigate to="/admin/ops" replace />} />
              <Route path="/admin/ops" element={<OperationsDashboard />} />
              <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/cms" element={<AdminCMS />} />
              <Route path="/admin/tour-builder" element={<AdminTourBuilder />} />
              <Route path="/admin/tour-builder/:tourId" element={<AdminTourBuilder />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
