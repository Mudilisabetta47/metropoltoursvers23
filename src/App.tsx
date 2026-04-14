import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ComingSoonPage from "./pages/ComingSoonPage";
import CookieBanner from "./components/CookieBanner";
import TravelAdvisorChat from "./components/chat/TravelAdvisorChat";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
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
const AdminInquiryDetail = lazy(() => import("./pages/AdminInquiryDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCMS = lazy(() => import("./pages/AdminCMS"));
const AdminTourBuilder = lazy(() => import("./pages/AdminTourBuilder"));
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard"));
const AdminBookingDetail = lazy(() => import("./pages/AdminBookingDetail"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminFinances = lazy(() => import("./pages/AdminFinances"));
const AdminDepartures = lazy(() => import("./pages/AdminDepartures"));
const AdminTemplates = lazy(() => import("./pages/AdminTemplates"));
const AdminLegal = lazy(() => import("./pages/AdminLegal"));
const AdminTourBookings = lazy(() => import("./pages/AdminTourBookings"));
const AdminEmployees = lazy(() => import("./pages/AdminEmployees"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminRoutes = lazy(() => import("./pages/AdminRoutes"));
const AdminStops = lazy(() => import("./pages/AdminStops"));
const AdminBuses = lazy(() => import("./pages/AdminBuses"));
const AdminShifts = lazy(() => import("./pages/AdminShifts"));
const AdminCostEstimate = lazy(() => import("./pages/AdminCostEstimate"));
const KarrierePage = lazy(() => import("./pages/KarrierePage"));
const WeekendTripsPage = lazy(() => import("./pages/WeekendTripsPage"));
const WeekendTripDetailPage = lazy(() => import("./pages/WeekendTripDetailPage"));
const AdminWeekendTripBuilder = lazy(() => import("./pages/AdminWeekendTripBuilder"));
const AdminMailbox = lazy(() => import("./pages/AdminMailbox"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const PassengerDataPage = lazy(() => import("./pages/PassengerDataPage"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Role-based redirect: drivers → ops, others → dashboard
const AdminRedirect = () => {
  const { roles, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  const isDriverOnly = roles.includes('driver') && !roles.includes('admin') && !roles.includes('office') && !roles.includes('agent');
  return <Navigate to={isDriverOnly ? "/admin/driver" : "/admin/dashboard"} replace />;
};

// Coming Soon gate: public visitors see countdown, staff sees full site
const COMING_SOON_ENABLED = false; // Toggle to false to disable

const PublicGate = ({ children }: { children: React.ReactNode }) => {
  const { user, hasAnyStaffRole, isLoading } = useAuth();
  const location = useLocation();
  
  // Always allow auth, admin, reset-password, legal pages
  const bypassPaths = ['/auth', '/admin', '/reset-password', '/imprint', '/privacy', '/terms', '/passagierdaten'];
  const isBypassed = bypassPaths.some(p => location.pathname.startsWith(p));
  
  if (isBypassed) return <>{children}</>;
  if (isLoading) return <PageLoader />;
  
  // Staff can see everything
  if (COMING_SOON_ENABLED && !hasAnyStaffRole) {
    return <ComingSoonPage />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <PublicGate>
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
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/imprint" element={<ImprintPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/karriere" element={<KarrierePage />} />
              <Route path="/pauschalreisen/:tourId" element={<TourDetailPage />} />
              <Route path="/reisen/:tourId" element={<TourDetailPage />} />
              <Route path="/reisen/checkout" element={<TourCheckoutPage />} />
              <Route path="/tour-checkout" element={<TourCheckoutPage />} />
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/admin/ops" element={<OperationsDashboard />} />
              <Route path="/admin/driver" element={<DriverDashboard />} />
              <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
              <Route path="/admin/inquiries/:inquiryId" element={<AdminInquiryDetail />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/booking/:bookingId" element={<AdminBookingDetail />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/finances" element={<AdminFinances />} />
              <Route path="/admin/departures" element={<AdminDepartures />} />
              <Route path="/admin/templates" element={<AdminTemplates />} />
              <Route path="/admin/legal" element={<AdminLegal />} />
              <Route path="/admin/cms" element={<AdminCMS />} />
              <Route path="/admin/tour-builder" element={<AdminTourBuilder />} />
              <Route path="/admin/tour-builder/:tourId" element={<AdminTourBuilder />} />
              <Route path="/admin/weekend-trip-builder" element={<AdminWeekendTripBuilder />} />
              <Route path="/admin/weekend-trip-builder/:tripId" element={<AdminWeekendTripBuilder />} />
              <Route path="/admin/tour-bookings" element={<AdminTourBookings />} />
              <Route path="/admin/bus-bookings" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<AdminEmployees />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/routes" element={<AdminRoutes />} />
              <Route path="/admin/stops" element={<AdminStops />} />
              <Route path="/admin/buses" element={<AdminBuses />} />
              <Route path="/admin/shifts" element={<AdminShifts />} />
              <Route path="/admin/cost-estimate" element={<AdminCostEstimate />} />
              <Route path="/admin/mailbox" element={<AdminMailbox />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/passagierdaten" element={<PassengerDataPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PublicGate>
          </Suspense>
          <TravelAdvisorChat />
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
