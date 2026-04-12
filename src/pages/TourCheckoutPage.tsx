import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft, Bus, Calendar, MapPin, Users, Luggage, Check,
  Loader2, AlertCircle, Hotel, Coffee, Armchair, RefreshCcw,
  Plus, Minus, FileText, Receipt, Download, Tag, X, Star,
  Shield, Clock, CheckCircle2, CreditCard, Wallet, Banknote,
  Copy, Lock, ChevronRight, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTourDocuments } from "@/hooks/useTourDocuments";
import {
  TourTariff, TourDate, TourRoute, TourLuggageAddon, TourExtra, ExtendedPackageTour,
} from "@/hooks/useTourBuilder";

type PaymentMethod = "paypal" | "stripe";
type CheckoutStep = "summary" | "passengers" | "payment" | "confirmation";

interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PickupStop {
  id: string;
  city: string;
  location_name: string;
  departure_time: string;
  surcharge: number;
  address?: string;
  meeting_point?: string;
}

const BANK_DETAILS = {
  recipient: "METROPOL TOURS GmbH",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
};

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

const TourCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openDocument, downloadAllDocuments, isGenerating } = useTourDocuments();

  const tourId = searchParams.get("tour") || "";
  const dateId = searchParams.get("date") || "";
  const tariffId = searchParams.get("tariff") || "";
  const initialPax = parseInt(searchParams.get("pax") || "2");

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tour, setTour] = useState<ExtendedPackageTour | null>(null);
  const [selectedDate, setSelectedDate] = useState<TourDate | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<TourTariff | null>(null);
  const [allDates, setAllDates] = useState<TourDate[]>([]);
  const [allTariffs, setAllTariffs] = useState<TourTariff[]>([]);
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [luggageAddons, setLuggageAddons] = useState<TourLuggageAddon[]>([]);
  const [tourExtras, setTourExtras] = useState<TourExtra[]>([]);
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([]);

  const [participants, setParticipants] = useState(initialPax);
  const [selectedPickupStop, setSelectedPickupStop] = useState<PickupStop | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("paypal");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTravelInfo, setAgreeTravelInfo] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; percent_off?: number; amount_off?: number; description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // === Payment return handlers (unchanged logic) ===
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (paymentStatus === "success" && tourId && sessionId) {
      const verifyAndLoadBooking = async () => {
        setIsLoading(true);
        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-tour-payment', { body: { sessionId } });
          if (verifyError) console.error("Payment verification error:", verifyError);
          if (verifyData?.success && verifyData?.bookingId) {
            setBookingId(verifyData.bookingId);
            setBookingNumber(verifyData.bookingNumber || "");
            setCurrentStep("confirmation");
            try { await supabase.functions.invoke('generate-tour-documents', { body: { bookingId: verifyData.bookingId } }); } catch (docErr) { console.error("Document generation failed:", docErr); }
          } else {
            let query = supabase.from("tour_bookings").select("id, booking_number").eq("tour_id", tourId);
            if (sessionId) query = query.eq("stripe_session_id", sessionId);
            const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (data) { setBookingNumber(data.booking_number); setBookingId(data.id); setCurrentStep("confirmation"); }
          }
        } catch (err) { console.error("Error verifying payment:", err); }
        await loadTourData();
      };
      verifyAndLoadBooking();
      return;
    }
    if (paymentStatus === "paypal_success" && tourId) {
      const paypalOrderId = searchParams.get("paypal_order_id") || searchParams.get("token");
      const capturePayPal = async () => {
        setIsLoading(true);
        try {
          if (paypalOrderId) {
            const { data: captureData, error: captureError } = await supabase.functions.invoke('capture-paypal-order', { body: { orderId: paypalOrderId } });
            if (captureError) console.error("PayPal capture error:", captureError);
            if (captureData?.success && captureData?.bookingId) {
              setBookingId(captureData.bookingId);
              setBookingNumber(captureData.bookingNumber || "");
              setCurrentStep("confirmation");
              supabase.functions.invoke('generate-tour-documents', { body: { bookingId: captureData.bookingId } }).catch(err => console.error("Doc gen error:", err));
            }
          }
        } catch (err) { console.error("PayPal capture error:", err); }
        await loadTourData();
      };
      capturePayPal();
      return;
    }
    if (paymentStatus === "success" && tourId) {
      const findExistingBooking = async () => {
        setIsLoading(true);
        try {
          let query = supabase.from("tour_bookings").select("id, booking_number").eq("tour_id", tourId);
          if (dateId) query = query.eq("tour_date_id", dateId);
          const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (data) { setBookingNumber(data.booking_number); setBookingId(data.id); setCurrentStep("confirmation"); }
        } catch (err) { console.error("Error finding booking:", err); }
        await loadTourData();
      };
      findExistingBooking();
      return;
    }
    if (tourId) loadTourData();
  }, [tourId, dateId, tariffId]);

  useEffect(() => {
    setPassengerInfo(
      Array(participants).fill(null).map((_, i) => passengerInfo[i] || { firstName: "", lastName: "", email: "", phone: "" })
    );
  }, [participants]);

  const loadTourData = async () => {
    setIsLoading(true);
    try {
      const { data: tourData, error: tourError } = await supabase.from("package_tours").select("*").eq("id", tourId).single();
      if (tourError || !tourData) throw new Error("Tour not found");
      setTour(tourData as unknown as ExtendedPackageTour);
      const client = supabase as any;
      const [datesRes, tariffsRes, routesRes, luggageRes, extrasRes] = await Promise.all([
        supabase.from("tour_dates").select("*").eq("tour_id", tourId).eq("is_active", true).order("departure_date"),
        supabase.from("tour_tariffs").select("*").eq("tour_id", tourId).eq("is_active", true).order("sort_order"),
        supabase.from("tour_routes").select("*, tour_pickup_stops(*)").eq("tour_id", tourId).eq("is_active", true),
        supabase.from("tour_luggage_addons").select("*").eq("tour_id", tourId).eq("is_active", true),
        client.from("tour_extras").select("*").eq("tour_id", tourId).eq("is_active", true).order("sort_order"),
      ]);
      const dates = (datesRes.data || []) as TourDate[];
      const tariffs = (tariffsRes.data || []) as TourTariff[];
      setAllDates(dates); setAllTariffs(tariffs);
      setLuggageAddons((luggageRes.data || []) as TourLuggageAddon[]);
      setTourExtras((extrasRes.data || []) as TourExtra[]);
      const allStops: PickupStop[] = [];
      (routesRes.data || []).forEach((route: any) => {
        if (route.tour_pickup_stops) route.tour_pickup_stops.forEach((stop: any) => { if (stop.is_active) allStops.push(stop); });
      });
      setPickupStops(allStops.sort((a, b) => a.surcharge - b.surcharge));
      setRoutes(routesRes.data as TourRoute[] || []);
      const date = dates.find((d) => d.id === dateId) || dates[0];
      const tariff = tariffs.find((t) => t.id === tariffId) || tariffs.find((t) => t.is_recommended) || tariffs[0];
      setSelectedDate(date || null); setSelectedTariff(tariff || null);
      if (allStops.length > 0) setSelectedPickupStop(allStops[0]);
    } catch (error) { console.error("Error loading tour data:", error); toast.error("Fehler beim Laden der Reisedaten"); }
    finally { setIsLoading(false); }
  };

  const formatDate = (dateStr: string) => { try { return format(parseISO(dateStr), "dd.MM.yyyy", { locale: de }); } catch { return dateStr; } };
  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) || "";

  const calculateBasePrice = () => {
    if (!selectedDate || !selectedTariff) return 0;
    const basePrice = selectedTariff.slug === "basic" ? selectedDate.price_basic
      : selectedTariff.slug === "smart" ? selectedDate.price_smart || selectedDate.price_basic
      : selectedTariff.slug === "flex" ? selectedDate.price_flex || selectedDate.price_basic
      : selectedDate.price_business || selectedDate.price_basic;
    return basePrice + selectedTariff.price_modifier;
  };

  const pricePerPerson = calculateBasePrice();
  const pickupSurcharge = selectedPickupStop?.surcharge || 0;
  const priceWithPickup = pricePerPerson + pickupSurcharge;
  const baseTotal = priceWithPickup * participants;
  const addonsTotal = Object.entries(selectedAddons).reduce((sum, [addonId, qty]) => {
    const addon = luggageAddons.find((a) => a.id === addonId);
    return sum + (addon?.price || 0) * qty;
  }, 0);
  const extrasTotal = Object.entries(selectedExtras).reduce((sum, [extraId, qty]) => {
    const extra = tourExtras.find((e) => e.id === extraId);
    if (!extra) return sum;
    return sum + extra.price * qty * (extra.price_type === 'per_person' ? participants : 1);
  }, 0);
  const subtotal = baseTotal + addonsTotal + extrasTotal;
  const discountAmount = appliedCoupon
    ? appliedCoupon.percent_off ? Math.round(subtotal * (appliedCoupon.percent_off / 100)) : appliedCoupon.amount_off || 0
    : 0;
  const totalPrice = Math.max(subtotal - discountAmount, 0);
  const availableSeats = selectedDate ? selectedDate.total_seats - selectedDate.booked_seats : 0;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true); setCouponError("");
    try {
      const { data, error } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase().trim()).eq("is_active", true).maybeSingle();
      if (error || !data) { setCouponError("Ungültiger Gutscheincode"); return; }
      if (data.valid_until && new Date(data.valid_until) < new Date()) { setCouponError("Gutschein ist abgelaufen"); return; }
      if (data.max_redemptions && data.times_redeemed >= data.max_redemptions) { setCouponError("Gutschein bereits vollständig eingelöst"); return; }
      if (data.min_amount && subtotal < data.min_amount) { setCouponError(`Mindestbestellwert: ${data.min_amount}€`); return; }
      setAppliedCoupon({ code: data.code, percent_off: data.percent_off, amount_off: data.amount_off, description: data.description });
      toast.success("Gutschein angewendet!");
    } catch { setCouponError("Fehler bei der Gutscheinprüfung"); }
    finally { setIsValidatingCoupon(false); }
  };
  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); };

  const steps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
    { key: "summary", label: "Reiseauswahl", icon: Bus },
    { key: "passengers", label: "Reisende", icon: Users },
    { key: "payment", label: "Zahlung", icon: CreditCard },
    { key: "confirmation", label: "Bestätigung", icon: CheckCircle2 },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleNextStep = async () => {
    if (currentStep === "summary") {
      if (!selectedDate || !selectedTariff || !selectedPickupStop) { toast.error("Bitte wählen Sie Termin, Tarif und Zustieg aus"); return; }
      if (participants > availableSeats) { toast.error(`Nur noch ${availableSeats} Plätze verfügbar`); return; }
      setCurrentStep("passengers"); window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "passengers") {
      const isValid = passengerInfo.every((p) => p.firstName && p.lastName && p.email);
      if (!isValid) { toast.error("Bitte füllen Sie alle Pflichtfelder aus"); return; }
      setCurrentStep("payment"); window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "payment") {
      if (!agreeTerms) { toast.error("Bitte akzeptieren Sie die AGB"); return; }
      if (!agreePrivacy) { toast.error("Bitte bestätigen Sie die Datenschutzhinweise"); return; }
      await processBooking();
    }
  };
  const handlePrevStep = () => {
    if (currentStep === "passengers") setCurrentStep("summary");
    else if (currentStep === "payment") setCurrentStep("passengers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const processBooking = async () => {
    setIsProcessing(true);
    try {
      const bookingNum = `MT-${Date.now().toString(36).toUpperCase()}`;
      const passengerDetails = passengerInfo.map((p, i) => ({ index: i + 1, firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone }));
      const luggageAddonsData = Object.entries(selectedAddons).filter(([_, qty]) => qty > 0).map(([addonId, qty]) => {
        const addon = luggageAddons.find((a) => a.id === addonId);
        return { addon_id: addonId, name: addon?.name || "", quantity: qty, price_each: addon?.price || 0, total: (addon?.price || 0) * qty };
      });
      const consentTimestamp = new Date().toISOString();
      const { data: bookingData, error: bookingError } = await supabase.from("tour_bookings").insert({
        booking_number: bookingNum, tour_id: tourId, tour_date_id: selectedDate!.id,
        tariff_id: selectedTariff!.id, pickup_stop_id: selectedPickupStop?.id || null,
        user_id: user?.id || null, participants, passenger_details: passengerDetails,
        contact_first_name: passengerInfo[0].firstName, contact_last_name: passengerInfo[0].lastName,
        contact_email: passengerInfo[0].email, contact_phone: passengerInfo[0].phone || null,
        base_price: pricePerPerson, pickup_surcharge: pickupSurcharge * participants,
        luggage_addons: luggageAddonsData, total_price: totalPrice,
        discount_code: appliedCoupon?.code || null, discount_amount: discountAmount || null,
        payment_method: selectedPaymentMethod, status: "pending", booking_type: "direct",
        customer_notes: JSON.stringify({ consent_agb: consentTimestamp, consent_privacy: consentTimestamp, consent_travel_info: agreeTravelInfo ? consentTimestamp : null }),
      }).select("id, booking_number").single();
      if (bookingError) throw bookingError;

      const { data: seatsReserved, error: seatsError } = await supabase.rpc("reserve_tour_seats", { p_tour_date_id: selectedDate!.id, p_seats: participants });
      if (seatsError) console.warn("Seat reservation skipped:", seatsError.message);
      else if (!seatsReserved) console.warn("Seats could not be reserved - may be sold out");

      if (selectedPaymentMethod === "stripe") {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke("create-tour-payment", { body: { bookingId: bookingData.id, couponCode: appliedCoupon?.code || null } });
        if (stripeError || !stripeData?.url) throw new Error(stripeData?.error || "Kreditkarten-Zahlung konnte nicht erstellt werden");
        window.location.href = stripeData.url; return;
      }
      if (selectedPaymentMethod === "paypal") {
        const { data: paypalData, error: paypalError } = await supabase.functions.invoke("create-paypal-order", { body: { bookingId: bookingData.id, couponCode: appliedCoupon?.code || null } });
        if (paypalError || !paypalData?.approveUrl) throw new Error(paypalData?.error || "PayPal-Zahlung konnte nicht erstellt werden");
        window.location.href = paypalData.approveUrl; return;
      }
      setBookingNumber(bookingData.booking_number); setBookingId(bookingData.id); setCurrentStep("confirmation");
      toast.success("Buchung erfolgreich erstellt!");
      supabase.functions.invoke("send-booking-confirmation", { body: { tourBookingId: bookingData.id } }).catch((err) => console.error("Email send error:", err));
      supabase.functions.invoke("generate-tour-documents", { body: { bookingId: bookingData.id } }).catch((err) => console.error("Document generation error:", err));
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Fehler bei der Buchung. Bitte versuchen Sie es erneut.");
    } finally { setIsProcessing(false); }
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerInfo]; updated[index] = { ...updated[index], [field]: value }; setPassengerInfo(updated);
  };
  const toggleAddon = (addonId: string, delta: number) => {
    const addon = luggageAddons.find((a) => a.id === addonId); if (!addon) return;
    const newVal = Math.max(0, Math.min(addon.max_per_booking, (selectedAddons[addonId] || 0) + delta));
    setSelectedAddons({ ...selectedAddons, [addonId]: newVal });
  };
  const toggleExtra = (extraId: string, delta: number) => {
    const extra = tourExtras.find((e) => e.id === extraId); if (!extra) return;
    const newVal = Math.max(0, Math.min(extra.max_per_booking, (selectedExtras[extraId] || 0) + delta));
    setSelectedExtras({ ...selectedExtras, [extraId]: newVal });
  };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Kopiert!"); };

  // === LOADING ===
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="font-semibold text-foreground">Reisedaten werden geladen…</p>
          <p className="text-sm text-muted-foreground">Einen Moment bitte</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour || !selectedDate || !selectedTariff) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Reise nicht gefunden</h2>
          <p className="text-muted-foreground mb-6">Die gewünschte Reise konnte nicht geladen werden.</p>
          <Button onClick={() => navigate("/")}>Zurück zur Startseite</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const paymentMethodLabel = selectedPaymentMethod === "paypal" ? "PayPal" : "Kreditkarte";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero Banner */}
        {currentStep !== "confirmation" && (
          <div className="relative bg-gradient-to-r from-secondary to-secondary/90 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {tour.image_url && <img src={tour.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="relative container mx-auto px-4 py-8 lg:py-10">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-white/80 hover:text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Reise
              </Button>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60 font-medium uppercase tracking-wider mb-1">Sichere Buchung</p>
                  <h1 className="text-2xl lg:text-3xl font-bold">{tour.destination}</h1>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/80">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(selectedDate.departure_date)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedDate.duration_days || tour.duration_days} Tage</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tour.location}, {tour.country}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/60"><Lock className="w-3.5 h-3.5" />SSL-verschlüsselt</div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60"><Shield className="w-3.5 h-3.5" />DSGVO-konform</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-6 lg:py-10">
          {/* Stepper */}
          {currentStep !== "confirmation" && (
            <div className="max-w-3xl mx-auto mb-8 lg:mb-10">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isUpcoming = index > currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                            isCompleted ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25" :
                            isCurrent ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" :
                            "bg-muted border-border text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                        </motion.div>
                        <span className={cn(
                          "text-xs mt-2 font-medium hidden sm:block",
                          isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                        )}>{step.label}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 mx-2 sm:mx-4 mt-[-20px] sm:mt-[-24px]">
                          <div className="h-0.5 bg-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">
              <AnimatePresence mode="wait">
                {/* === STEP 1: SUMMARY === */}
                {currentStep === "summary" && (
                  <motion.div key="summary" {...fadeIn} className="space-y-5">
                    {/* Included Services */}
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          Im Preis enthalten
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { icon: Hotel, label: "Übernachtung", desc: "Hotel inkl." },
                            { icon: Coffee, label: "Frühstück", desc: "Täglich inkl." },
                            { icon: Bus, label: "Busreise", desc: "Hin & zurück" },
                            ...(selectedTariff.suitcase_included ? [{ icon: Luggage, label: "Koffer", desc: `bis ${selectedTariff.suitcase_weight_kg}kg` }] : []),
                          ].map((item, i) => (
                            <div key={i} className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                              <div className="w-11 h-11 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <item.icon className="w-5 h-5 text-primary" />
                              </div>
                              <p className="text-sm font-semibold text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Participants */}
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          Teilnehmer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground font-medium">Anzahl Reisende</span>
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-2" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-bold text-xl">{participants}</span>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-2" onClick={() => setParticipants(Math.min(availableSeats, participants + 1))} disabled={participants >= availableSeats}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {availableSeats <= 10 && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                            <Clock className="w-4 h-4 shrink-0" />
                            Nur noch {availableSeats} Plätze verfügbar – jetzt sichern!
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tariff Selection */}
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Tarif wählen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {allTariffs.map((tariff) => (
                            <motion.div
                              key={tariff.id}
                              whileHover={{ y: -2 }}
                              onClick={() => setSelectedTariff(tariff)}
                              className={cn(
                                "relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                selectedTariff?.id === tariff.id
                                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                  : "border-border hover:border-primary/40 hover:shadow-sm"
                              )}
                            >
                              {tariff.is_recommended && (
                                <Badge className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-xs shadow-sm">⭐ Empfohlen</Badge>
                              )}
                              <h4 className="font-bold text-foreground text-base">{tariff.name}</h4>
                              <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2.5">
                                  <Luggage className={cn("w-4 h-4 shrink-0", tariff.suitcase_included ? "text-primary" : "text-muted-foreground/40")} />
                                  <span className={tariff.suitcase_included ? "text-foreground" : "text-muted-foreground"}>{tariff.suitcase_included ? `Koffer bis ${tariff.suitcase_weight_kg}kg` : "Nur Handgepäck"}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <Armchair className={cn("w-4 h-4 shrink-0", tariff.seat_reservation ? "text-primary" : "text-muted-foreground/40")} />
                                  <span className={tariff.seat_reservation ? "text-foreground" : "text-muted-foreground"}>{tariff.seat_reservation ? "Sitzplatzreservierung" : "Freie Platzwahl"}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <RefreshCcw className={cn("w-4 h-4 shrink-0", tariff.is_refundable ? "text-primary" : "text-muted-foreground/40")} />
                                  <span className={tariff.is_refundable ? "text-foreground" : "text-muted-foreground"}>{tariff.is_refundable ? `Storno bis ${tariff.cancellation_days}T vorher` : "Keine Stornierung"}</span>
                                </div>
                              </div>
                              {tariff.price_modifier > 0 && (
                                <p className="mt-3 text-sm font-bold text-primary">+{tariff.price_modifier}€ p.P.</p>
                              )}
                              {selectedTariff?.id === tariff.id && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pickup Stop */}
                    {pickupStops.length > 0 && (
                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Zustiegspunkt
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Select value={selectedPickupStop?.id || ""} onValueChange={(id) => setSelectedPickupStop(pickupStops.find((s) => s.id === id) || null)}>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Zustiegspunkt wählen" /></SelectTrigger>
                            <SelectContent>
                              {pickupStops.map((stop) => (
                                <SelectItem key={stop.id} value={stop.id}>
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span>{stop.city} – {stop.location_name} ({formatTime(stop.departure_time)} Uhr)</span>
                                    {stop.surcharge > 0 && <Badge variant="secondary" className="ml-2">+{stop.surcharge}€</Badge>}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedPickupStop && (
                            <div className="mt-3 p-4 bg-muted/50 rounded-xl text-sm space-y-1 border border-border/50">
                              <p className="font-semibold text-foreground">{selectedPickupStop.city} – {selectedPickupStop.location_name}</p>
                              {selectedPickupStop.address && <p className="text-muted-foreground">{selectedPickupStop.address}</p>}
                              {selectedPickupStop.meeting_point && <p className="text-muted-foreground">📍 Treffpunkt: {selectedPickupStop.meeting_point}</p>}
                              <p className="text-primary font-semibold mt-1">
                                🕐 Abfahrt: {formatTime(selectedPickupStop.departure_time)} Uhr
                                {selectedPickupStop.surcharge > 0 && ` · +${selectedPickupStop.surcharge}€ p.P.`}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Luggage Add-ons */}
                    {luggageAddons.length > 0 && (
                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Luggage className="w-5 h-5 text-primary" />
                            Zusätzliches Gepäck
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {luggageAddons.map((addon) => (
                            <div key={addon.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                              <div>
                                <p className="font-semibold text-foreground">{addon.name}</p>
                                {addon.description && <p className="text-sm text-muted-foreground mt-0.5">{addon.description}</p>}
                                <p className="text-sm text-primary font-bold mt-1">{addon.price}€</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleAddon(addon.id, -1)} disabled={!selectedAddons[addon.id]}><Minus className="w-3.5 h-3.5" /></Button>
                                <span className="w-7 text-center font-bold text-base">{selectedAddons[addon.id] || 0}</span>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleAddon(addon.id, 1)} disabled={(selectedAddons[addon.id] || 0) >= addon.max_per_booking}><Plus className="w-3.5 h-3.5" /></Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Tour Extras */}
                    {tourExtras.length > 0 && (
                      <Card className="border-border/60 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="w-5 h-5 text-primary" />
                            Zusatzleistungen
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {tourExtras.map((extra) => {
                            const priceLabel = extra.price_type === 'per_person' ? 'p.P.' : extra.price_type === 'per_night' ? 'pro Nacht' : extra.price_type === 'per_person_night' ? 'p.P./Nacht' : 'pro Buchung';
                            return (
                              <div key={extra.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                                <div>
                                  <p className="font-semibold text-foreground">{extra.name}</p>
                                  {extra.description && <p className="text-sm text-muted-foreground mt-0.5">{extra.description}</p>}
                                  <p className="text-sm text-primary font-bold mt-1">{extra.price}€ {priceLabel}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleExtra(extra.id, -1)} disabled={!selectedExtras[extra.id]}><Minus className="w-3.5 h-3.5" /></Button>
                                  <span className="w-7 text-center font-bold text-base">{selectedExtras[extra.id] || 0}</span>
                                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleExtra(extra.id, 1)} disabled={(selectedExtras[extra.id] || 0) >= extra.max_per_booking}><Plus className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}

                {/* === STEP 2: PASSENGERS === */}
                {currentStep === "passengers" && (
                  <motion.div key="passengers" {...fadeIn}>
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          Reisende eingeben
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Bitte geben Sie die Daten aller Reisenden ein.</p>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {passengerInfo.map((passenger, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-5 bg-muted/30 rounded-xl space-y-4 border border-border/50"
                          >
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</div>
                              Reisender {index + 1}
                              {index === 0 && <Badge variant="secondary" className="text-xs ml-1">Hauptkontakt</Badge>}
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Vorname *</Label>
                                <Input value={passenger.firstName} onChange={(e) => updatePassenger(index, "firstName", e.target.value)} placeholder="Max" className="h-11" autoComplete="given-name" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Nachname *</Label>
                                <Input value={passenger.lastName} onChange={(e) => updatePassenger(index, "lastName", e.target.value)} placeholder="Mustermann" className="h-11" autoComplete="family-name" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm font-medium">E-Mail *</Label>
                                <Input type="email" value={passenger.email} onChange={(e) => updatePassenger(index, "email", e.target.value)} placeholder="max@beispiel.de" className="h-11" autoComplete="email" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Telefon</Label>
                                <Input type="tel" value={passenger.phone} onChange={(e) => updatePassenger(index, "phone", e.target.value)} placeholder="+49 170 1234567" className="h-11" autoComplete="tel" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* === STEP 3: PAYMENT === */}
                {currentStep === "payment" && (
                  <motion.div key="payment" {...fadeIn} className="space-y-5">
                    {/* Payment Methods */}
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          Zahlungsart
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {([
                          { key: "stripe" as PaymentMethod, icon: CreditCard, label: "Kreditkarte", desc: "Visa, Mastercard, American Express", badge: "Sofort" },
                          { key: "paypal" as PaymentMethod, icon: Wallet, label: "PayPal", desc: "Schnell & sicher mit PayPal bezahlen", badge: "Sofort" },
                        ]).map((method) => (
                          <motion.div
                            key={method.key}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            onClick={() => setSelectedPaymentMethod(method.key)}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                              selectedPaymentMethod === method.key
                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                              selectedPaymentMethod === method.key ? "bg-primary/10" : "bg-muted"
                            )}>
                              <method.icon className={cn("w-6 h-6", selectedPaymentMethod === method.key ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{method.label}</p>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{method.badge}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{method.desc}</p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              selectedPaymentMethod === method.key ? "border-primary" : "border-muted-foreground/30"
                            )}>
                              {selectedPaymentMethod === method.key && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Booking Overview */}
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Buchungsübersicht</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {[
                            { label: "Reise", value: tour.destination, icon: MapPin },
                            { label: "Termin", value: formatDate(selectedDate.departure_date), icon: Calendar },
                            { label: "Tarif", value: selectedTariff.name, icon: Star },
                            { label: "Reisende", value: `${participants} Person(en)`, icon: Users },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                              <item.icon className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-muted/40 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Hauptkontakt</p>
                          <p className="text-sm font-semibold text-foreground">{passengerInfo[0]?.firstName} {passengerInfo[0]?.lastName} · {passengerInfo[0]?.email}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Legal Checkboxes */}
                    <Card className="border-border/60 shadow-sm">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(c as boolean)} className="mt-0.5" />
                          <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich akzeptiere die <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">AGB</a> und die <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">Reisebedingungen</a> *
                          </Label>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox id="privacy" checked={agreePrivacy} onCheckedChange={(c) => setAgreePrivacy(c as boolean)} className="mt-0.5" />
                          <Label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich habe die <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">Datenschutzhinweise</a> gelesen und akzeptiert *
                          </Label>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox id="travelinfo" checked={agreeTravelInfo} onCheckedChange={(c) => setAgreeTravelInfo(c as boolean)} className="mt-0.5" />
                          <Label htmlFor="travelinfo" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich bestätige die Reiseinformationen zur Pauschalreise (optional)
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* === STEP 4: CONFIRMATION === */}
                {currentStep === "confirmation" && (
                  <motion.div key="confirmation" {...fadeIn}>
                    <Card className="overflow-hidden border-primary/20 shadow-lg">
                      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 lg:p-10 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                          className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-5"
                        >
                          <CheckCircle2 className="w-10 h-10 text-primary" />
                        </motion.div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Buchung erfolgreich!</h2>
                        <p className="text-muted-foreground">
                          Buchungsnummer: <span className="font-mono font-bold text-foreground text-lg">{bookingNumber}</span>
                        </p>
                      </div>

                      <CardContent className="p-6 lg:p-8 space-y-6">
                        <p className="text-center text-muted-foreground">
                          Eine Bestätigung wurde an <strong className="text-foreground">{passengerInfo[0]?.email}</strong> gesendet.
                        </p>

                        {/* Bank Details */}
                        <div className="bg-muted/40 rounded-xl p-5 border border-border/50">
                          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-primary" />
                            Überweisungsdaten
                          </h3>
                          <div className="space-y-2.5">
                            {[
                              { label: "Empfänger", value: BANK_DETAILS.recipient },
                              { label: "IBAN", value: BANK_DETAILS.iban },
                              { label: "BIC", value: BANK_DETAILS.bic },
                              { label: "Bank", value: BANK_DETAILS.bank },
                              { label: "Verwendungszweck", value: `Buchung ${bookingNumber}` },
                              { label: "Betrag", value: `${totalPrice.toFixed(2)} €` },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                                <div>
                                  <span className="text-muted-foreground text-xs">{item.label}</span>
                                  <p className="font-semibold text-foreground">{item.value}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => copyToClipboard(item.value)}>
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-muted/40 rounded-xl p-5 border border-border/50">
                          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Reiseunterlagen
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Bestätigung", icon: FileText, type: "confirmation" as const },
                              { label: "Rechnung", icon: Receipt, type: "invoice" as const },
                              { label: "Voucher", icon: Hotel, type: "voucher" as const },
                              { label: "Reiseplan", icon: MapPin, type: "travelplan" as const },
                            ].map((doc) => (
                              <Button
                                key={doc.type}
                                variant="outline"
                                className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5 transition-all"
                                disabled={isGenerating}
                                onClick={() => openDocument({ bookingNumber: bookingNumber! }, doc.type)}
                              >
                                <doc.icon className="w-6 h-6 text-primary" />
                                <span className="text-xs font-medium">{doc.label}</span>
                              </Button>
                            ))}
                          </div>
                          <Button variant="secondary" className="w-full mt-3" disabled={isGenerating} onClick={() => downloadAllDocuments({ bookingNumber: bookingNumber! })}>
                            <Download className="w-4 h-4 mr-2" />
                            {isGenerating ? "Wird generiert…" : "Alle herunterladen"}
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                          <Button onClick={() => navigate("/bookings")} size="lg" className="gap-2">
                            Meine Buchungen
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" onClick={() => navigate("/")} size="lg">Zur Startseite</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* === SIDEBAR === */}
            {currentStep !== "confirmation" && (
              <div className="lg:col-span-1">
                <div className="sticky top-28 space-y-4">
                  <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/8 to-primary/3 px-5 py-4 border-b border-primary/10">
                      <h3 className="font-bold text-foreground text-lg">Preisübersicht</h3>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      {/* Price Breakdown */}
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{participants}× Reisepreis à {pricePerPerson}€</span>
                          <span className="font-semibold">{(pricePerPerson * participants).toFixed(0)}€</span>
                        </div>
                        {pickupSurcharge > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>{participants}× Zustiegsaufpreis</span>
                            <span>+{(pickupSurcharge * participants).toFixed(0)}€</span>
                          </div>
                        )}
                        {addonsTotal > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Zusatzgepäck</span>
                            <span>+{addonsTotal.toFixed(0)}€</span>
                          </div>
                        )}
                        {extrasTotal > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Zusatzleistungen</span>
                            <span>+{extrasTotal.toFixed(0)}€</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between text-primary font-semibold">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{appliedCoupon.code}</span>
                            <span>−{discountAmount.toFixed(0)}€</span>
                          </div>
                        )}
                      </div>

                      {/* Coupon */}
                      <div className="space-y-2">
                        {appliedCoupon ? (
                          <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                            <Tag className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary flex-1">{appliedCoupon.code}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeCoupon}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input placeholder="Gutscheincode" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }} className="text-sm h-9" />
                            <Button variant="outline" size="sm" onClick={validateCoupon} disabled={!couponCode.trim() || isValidatingCoupon}>
                              {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                            </Button>
                          </div>
                        )}
                        {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                      </div>

                      <Separator />

                      {/* Total */}
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs text-muted-foreground">Gesamtpreis</span>
                          <p className="text-xs text-muted-foreground">inkl. MwSt.</p>
                        </div>
                        <div className="text-right">
                          {discountAmount > 0 && <span className="text-sm text-muted-foreground line-through block">{subtotal.toFixed(0)}€</span>}
                          <span className="text-3xl font-bold text-primary">{totalPrice.toFixed(0)}€</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        size="lg"
                        className="w-full text-base font-semibold h-13 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                        onClick={handleNextStep}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird verarbeitet…</>
                        ) : currentStep === "payment" ? (
                          <><Lock className="w-4 h-4 mr-2" />Jetzt kostenpflichtig buchen</>
                        ) : (
                          <>Weiter<ChevronRight className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>

                      {currentStep !== "summary" && (
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handlePrevStep}>
                          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Zurück
                        </Button>
                      )}

                      {/* Trust Indicators */}
                      <div className="pt-3 border-t border-border/50 space-y-2">
                        {[
                          { icon: Lock, text: "256-bit SSL-Verschlüsselung" },
                          { icon: Shield, text: "DSGVO-konformer Datenschutz" },
                          { icon: CheckCircle2, text: "Sofortige Buchungsbestätigung" },
                          ...(selectedTariff?.is_refundable ? [{ icon: RefreshCcw, text: `Kostenfreie Storno bis ${selectedTariff.cancellation_days}T vorher` }] : []),
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <item.icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Help Card */}
                  <Card className="border-border/60">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-medium text-foreground mb-1">Fragen zur Buchung?</p>
                      <p className="text-xs text-muted-foreground mb-2">Wir helfen Ihnen gerne weiter.</p>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate("/service")}>
                        Hilfe & Kontakt
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom */}
      {currentStep !== "confirmation" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Gesamtpreis</p>
              <p className="text-2xl font-bold text-primary">{totalPrice.toFixed(0)}€</p>
            </div>
            <Button size="lg" className="flex-1 max-w-[220px] font-semibold shadow-md" onClick={handleNextStep} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === "payment" ? (
                <><Lock className="w-4 h-4 mr-1.5" />Jetzt buchen</>
              ) : (
                <>Weiter<ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TourCheckoutPage;
