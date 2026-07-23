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
import AnalyticsLoader from "./components/AnalyticsLoader";
import NoIndexRoutes from "./components/NoIndexRoutes";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const ReisenPage = lazy(() => import("./pages/ReisenPage"));
const BusreisenPage = lazy(() => import("./pages/BusreisenPage"));
const BusinessServicesPage = lazy(() => import("./pages/BusinessServicesPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const TrackBookingPage = lazy(() => import("./pages/TrackBookingPage"));
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
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
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
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminPaymentAudit = lazy(() => import("./pages/AdminPaymentAudit"));
const AdminFleetCompliance = lazy(() => import("./pages/AdminFleetCompliance"));
const AdminTollVignettes = lazy(() => import("./pages/AdminTollVignettes"));
const AdminFuelLog = lazy(() => import("./pages/AdminFuelLog"));
const AdminWorkshops = lazy(() => import("./pages/AdminWorkshops"));
const AdminDriverCompliance = lazy(() => import("./pages/AdminDriverCompliance"));
const AdminPayroll = lazy(() => import("./pages/AdminPayroll"));
const AdminB2BCustomers = lazy(() => import("./pages/AdminB2BCustomers"));
const AdminComplaints = lazy(() => import("./pages/AdminComplaints"));
const AdminDispoBoard = lazy(() => import("./pages/AdminDispoBoard"));
const AdminDispatch = lazy(() => import("./pages/AdminDispatch"));
const AdminSLAMonitor = lazy(() => import("./pages/AdminSLAMonitor"));
const AdminIncidentWorkflow = lazy(() => import("./pages/AdminIncidentWorkflow"));
const PassengerDataPage = lazy(() => import("./pages/PassengerDataPage"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AdminWallboard = lazy(() => import("./pages/AdminWallboard"));
const WallboardLive = lazy(() => import("./pages/WallboardLive"));
const AdminCustomerDetail = lazy(() => import("./pages/AdminCustomerDetail"));
const AdminFleetMaintenance = lazy(() => import("./pages/AdminFleetMaintenance"));
const AdminDynamicPricing = lazy(() => import("./pages/AdminDynamicPricing"));
const AdminJobs = lazy(() => import("./pages/AdminJobs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminStub = lazy(() => import("./pages/AdminStub"));
const AdminLines = lazy(() => import("./pages/AdminLines"));
const AdminLineTrips = lazy(() => import("./pages/AdminLineTrips"));
const TrackTripPage = lazy(() => import("./pages/TrackTripPage"));
const TrackTripLandingPage = lazy(() => import("./pages/TrackTripLandingPage"));
const AdminTrips = lazy(() => import("./pages/AdminTrips"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const AdminCopilot = lazy(() => import("./pages/AdminCopilot"));
const AdminCopilotAudit = lazy(() => import("./pages/AdminCopilotAudit"));

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
const COMING_SOON_ENABLED = true; // Toggle to false to disable

const PublicGate = ({ children }: { children: React.ReactNode }) => {
  const { user, hasAnyStaffRole, isLoading } = useAuth();
  const location = useLocation();
  
  // Always allow auth, admin, reset-password, legal pages
  const bypassPaths = ['/auth', '/admin', '/reset-password', '/imprint', '/privacy', '/terms', '/passagierdaten', '/verfolge', '/.lovable/oauth/consent'];
  const isBypassed = bypassPaths.some(p => location.pathname.startsWith(p));
  
  if (isBypassed) return <>{children}</>;
  if (isLoading) return <PageLoader />;
  
  // Staff can see everything
  if (COMING_SOON_ENABLED && !hasAnyStaffRole) {
    return <ComingSoonPage />;
  }
  
  return <>{children}</>;
};

// Backend-Subdomain: backend.metours.de → automatisch ins Admin-Cockpit
const BACKEND_HOSTS = ['backend.metours.de', 'backend.lovable.app'];
const BackendHostRedirect = () => {
  const location = useLocation();
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const isBackendHost = BACKEND_HOSTS.includes(host) || host.startsWith('backend.');
  if (isBackendHost && location.pathname === '/') {
    return <Navigate to="/admin" replace />;
  }
  return null;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackendHostRedirect />
          <NoIndexRoutes />
          <AnalyticsLoader />
          <Suspense fallback={<PageLoader />}>
            <PublicGate>
            <Routes>
              <Route path="/" element={<Index />} />

              <Route path="/search" element={<SearchPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/service" element={<ServicePage />} />
              <Route path="/reisen" element={<ReisenPage />} />
              <Route path="/busreisen" element={<BusreisenPage />} />
              <Route path="/business" element={<BusinessServicesPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/track/:bookingId" element={<TrackBookingPage />} />
              <Route path="/wochenendtrips" element={<WeekendTripsPage />} />
              <Route path="/wochenendtrips/:tourId" element={<TourDetailPage />} />
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
              <Route path="/admin/copilot" element={<AdminCopilot />} />
              <Route path="/admin/copilot-audit" element={<AdminCopilotAudit />} />
              <Route path="/admin/ops" element={<OperationsDashboard />} />
              <Route path="/admin/driver" element={<DriverDashboard />} />
              <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
              <Route path="/admin/inquiries/:inquiryId" element={<AdminInquiryDetail />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/booking/:bookingId" element={<AdminBookingDetail />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/customers/by-email/:customerId" element={<AdminCustomerDetail />} />
              <Route path="/admin/customers/:customerId" element={<AdminCustomerDetail />} />
              <Route path="/admin/wallboard" element={<AdminWallboard />} />
              <Route path="/admin/wallboard/live" element={<WallboardLive />} />
              <Route path="/wallboard/:token" element={<WallboardLive />} />
              <Route path="/admin/fleet-maintenance" element={<AdminFleetMaintenance />} />
              <Route path="/admin/dynamic-pricing" element={<AdminDynamicPricing />} />
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
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/bus-bookings" element={<AdminBookings />} />

              <Route path="/admin/employees" element={<AdminEmployees />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/routes" element={<AdminRoutes />} />
              <Route path="/admin/stops" element={<AdminStops />} />
              <Route path="/admin/buses" element={<AdminBuses />} />
              <Route path="/admin/shifts" element={<AdminShifts />} />
              <Route path="/admin/cost-estimate" element={<AdminCostEstimate />} />
              <Route path="/admin/mailbox" element={<AdminMailbox />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/audit" element={<AdminAuditLog />} />
              <Route path="/admin/payment-audit" element={<AdminPaymentAudit />} />
              <Route path="/admin/fleet-compliance" element={<AdminFleetCompliance />} />
              <Route path="/admin/toll-vignettes" element={<AdminTollVignettes />} />
              <Route path="/admin/fuel-log" element={<AdminFuelLog />} />
              <Route path="/admin/workshops" element={<AdminWorkshops />} />
              <Route path="/admin/driver-compliance" element={<AdminDriverCompliance />} />
              <Route path="/admin/payroll" element={<AdminPayroll />} />
              <Route path="/admin/b2b" element={<AdminB2BCustomers />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/dispo-board" element={<AdminDispoBoard />} />
              <Route path="/admin/dispatch" element={<AdminDispatch />} />
              <Route path="/admin/fahrtenplanung" element={<AdminDispatch />} />
              <Route path="/admin/sla-monitor" element={<AdminSLAMonitor />} />
              <Route path="/admin/incident-workflow" element={<AdminIncidentWorkflow />} />
              <Route path="/admin/jobs" element={<AdminJobs />} />
              <Route path="/admin/help" element={<AdminStub title="Hilfe & Support" subtitle="Dokumentation, Tutorials und Kontakt" description="Das Hilfe-Center mit Dokumentation, Video-Tutorials und direktem Support-Kontakt wird gerade aufgebaut." />} />
              <Route path="/admin/profile" element={<AdminStub title="Mein Profil" subtitle="Persönliche Daten, Rolle und Berechtigungen" description="Dein Profilbereich mit Account-Einstellungen und Sicherheitsoptionen ist in Vorbereitung." />} />
              <Route path="/admin/drivers" element={<AdminStub title="Fahrer-Stammdaten" subtitle="Personalakte, Lizenzen und Einsatzplanung" description="Die Fahrer-Verwaltung mit Lizenz-Tracking und Schichtplänen ist bereits in Arbeit." />} />
              <Route path="/passagierdaten" element={<PassengerDataPage />} />
             <Route path="/admin/lines" element={<AdminLines />} />
             <Route path="/admin/line-trips" element={<AdminLineTrips />} />
             <Route path="/admin/trips" element={<AdminTrips />} />
              <Route path="/verfolge" element={<TrackTripLandingPage />} />
              <Route path="/verfolge/:tripNumber" element={<TrackTripPage />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
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
