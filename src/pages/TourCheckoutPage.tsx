import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  Bus,
  Calendar,
  MapPin,
  Users,
  Luggage,
  Check,
  
  Loader2,
  AlertCircle,
  Hotel,
  Coffee,
  Armchair,
  RefreshCcw,
  Plus,
  Minus,
  FileText,
  Receipt,
  Download,
  Tag,
  X,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  CreditCard,
  Wallet,
  Banknote,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTourDocuments } from "@/hooks/useTourDocuments";
import {
  TourTariff,
  TourDate,
  TourRoute,
  TourLuggageAddon,
  TourExtra,
  ExtendedPackageTour,
} from "@/hooks/useTourBuilder";

type PaymentMethod = "bank_transfer" | "stripe" | "paypal";
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

// Bank details constants
const BANK_DETAILS = {
  recipient: "METROPOL TOURS GmbH",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
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

  // Data
  const [tour, setTour] = useState<ExtendedPackageTour | null>(null);
  const [selectedDate, setSelectedDate] = useState<TourDate | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<TourTariff | null>(null);
  const [allDates, setAllDates] = useState<TourDate[]>([]);
  const [allTariffs, setAllTariffs] = useState<TourTariff[]>([]);
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [luggageAddons, setLuggageAddons] = useState<TourLuggageAddon[]>([]);
  const [tourExtras, setTourExtras] = useState<TourExtra[]>([]);
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([]);

  // Form state
  const [participants, setParticipants] = useState(initialPax);
  const [selectedPickupStop, setSelectedPickupStop] = useState<PickupStop | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTravelInfo, setAgreeTravelInfo] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    percent_off?: number;
    amount_off?: number;
    description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Check if returning from payment (e.g. Stripe redirect with payment=success)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (paymentStatus === "success" && tourId && sessionId) {
      const verifyAndLoadBooking = async () => {
        setIsLoading(true);
        try {
          // Call verify-tour-payment to confirm with Stripe, update status, send email
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-tour-payment', {
            body: { sessionId }
          });

          if (verifyError) {
            console.error("Payment verification error:", verifyError);
          }

          if (verifyData?.success && verifyData?.bookingId) {
            setBookingId(verifyData.bookingId);
            setBookingNumber(verifyData.bookingNumber || "");
            setCurrentStep("confirmation");

            // Trigger PDF document generation (non-blocking)
            try {
              await supabase.functions.invoke('generate-tour-documents', {
                body: { bookingId: verifyData.bookingId }
              });
              console.log("Tour documents generated successfully");
            } catch (docErr) {
              console.error("Document generation failed (non-blocking):", docErr);
            }
          } else {
            // Fallback: try to find existing booking
            let query = supabase.from("tour_bookings").select("id, booking_number").eq("tour_id", tourId);
            if (sessionId) {
              query = query.eq("stripe_session_id", sessionId);
            }
            const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (data) {
              setBookingNumber(data.booking_number);
              setBookingId(data.id);
              setCurrentStep("confirmation");
            }
          }
        } catch (err) {
          console.error("Error verifying payment:", err);
        }
        await loadTourData();
      };
      verifyAndLoadBooking();
      return;
    }
    // PayPal return
    if (paymentStatus === "paypal_success" && tourId) {
      const paypalOrderId = searchParams.get("paypal_order_id") || searchParams.get("token");
      const capturePayPal = async () => {
        setIsLoading(true);
        try {
          if (paypalOrderId) {
            const { data: captureData, error: captureError } = await supabase.functions.invoke('capture-paypal-order', {
              body: { orderId: paypalOrderId }
            });
            if (captureError) console.error("PayPal capture error:", captureError);
            if (captureData?.success && captureData?.bookingId) {
              setBookingId(captureData.bookingId);
              setBookingNumber(captureData.bookingNumber || "");
              setCurrentStep("confirmation");
              // Generate documents
              supabase.functions.invoke('generate-tour-documents', {
                body: { bookingId: captureData.bookingId }
              }).catch(err => console.error("Doc gen error:", err));
            }
          }
        } catch (err) {
          console.error("PayPal capture error:", err);
        }
        await loadTourData();
      };
      capturePayPal();
      return;
    }
    if (paymentStatus === "success" && tourId) {
      // No session_id but payment=success (e.g. bank transfer)
      const findExistingBooking = async () => {
        setIsLoading(true);
        try {
          let query = supabase.from("tour_bookings").select("id, booking_number").eq("tour_id", tourId);
          if (dateId) {
            query = query.eq("tour_date_id", dateId);
          }
          const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (data) {
            setBookingNumber(data.booking_number);
            setBookingId(data.id);
            setCurrentStep("confirmation");
          }
        } catch (err) {
          console.error("Error finding booking:", err);
        }
        await loadTourData();
      };
      findExistingBooking();
      return;
    }
    if (tourId) loadTourData();
  }, [tourId, dateId, tariffId]);

  useEffect(() => {
    setPassengerInfo(
      Array(participants)
        .fill(null)
        .map((_, i) => passengerInfo[i] || { firstName: "", lastName: "", email: "", phone: "" })
    );
  }, [participants]);

  const loadTourData = async () => {
    setIsLoading(true);
    try {
      const { data: tourData, error: tourError } = await supabase
        .from("package_tours")
        .select("*")
        .eq("id", tourId)
        .single();

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
      setAllDates(dates);
      setAllTariffs(tariffs);
      setLuggageAddons((luggageRes.data || []) as TourLuggageAddon[]);
      setTourExtras((extrasRes.data || []) as TourExtra[]);

      const allStops: PickupStop[] = [];
      (routesRes.data || []).forEach((route: any) => {
        if (route.tour_pickup_stops) {
          route.tour_pickup_stops.forEach((stop: any) => {
            if (stop.is_active) allStops.push(stop);
          });
        }
      });
      setPickupStops(allStops.sort((a, b) => a.surcharge - b.surcharge));
      setRoutes(routesRes.data as TourRoute[] || []);

      const date = dates.find((d) => d.id === dateId) || dates[0];
      const tariff = tariffs.find((t) => t.id === tariffId) || tariffs.find((t) => t.is_recommended) || tariffs[0];
      setSelectedDate(date || null);
      setSelectedTariff(tariff || null);
      if (allStops.length > 0) setSelectedPickupStop(allStops[0]);
    } catch (error) {
      console.error("Error loading tour data:", error);
      toast.error("Fehler beim Laden der Reisedaten");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), "dd.MM.yyyy", { locale: de }); } catch { return dateStr; }
  };
  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) || "";

  // Price calculation
  const calculateBasePrice = () => {
    if (!selectedDate || !selectedTariff) return 0;
    const basePrice =
      selectedTariff.slug === "basic" ? selectedDate.price_basic
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
    const multiplier = extra.price_type === 'per_person' ? participants : 1;
    return sum + extra.price * qty * multiplier;
  }, 0);

  const subtotal = baseTotal + addonsTotal + extrasTotal;
  const discountAmount = appliedCoupon
    ? appliedCoupon.percent_off
      ? Math.round(subtotal * (appliedCoupon.percent_off / 100))
      : appliedCoupon.amount_off || 0
    : 0;
  const totalPrice = Math.max(subtotal - discountAmount, 0);
  const availableSeats = selectedDate ? selectedDate.total_seats - selectedDate.booked_seats : 0;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const { data, error } = await supabase
        .from("coupons").select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true).maybeSingle();
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
    { key: "summary", label: "Reise", icon: Bus },
    { key: "passengers", label: "Reisende", icon: Users },
    { key: "payment", label: "Zahlung", icon: Banknote },
    { key: "confirmation", label: "Bestätigung", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNextStep = async () => {
    if (currentStep === "summary") {
      if (!selectedDate || !selectedTariff || !selectedPickupStop) {
        toast.error("Bitte wählen Sie Termin, Tarif und Zustieg aus");
        return;
      }
      if (participants > availableSeats) {
        toast.error(`Nur noch ${availableSeats} Plätze verfügbar`);
        return;
      }
      setCurrentStep("passengers");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "passengers") {
      const isValid = passengerInfo.every((p) => p.firstName && p.lastName && p.email);
      if (!isValid) {
        toast.error("Bitte füllen Sie alle Pflichtfelder aus");
        return;
      }
      setCurrentStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "payment") {
      if (!agreeTerms) {
        toast.error("Bitte akzeptieren Sie die AGB");
        return;
      }
      if (!agreePrivacy) {
        toast.error("Bitte bestätigen Sie die Datenschutzhinweise");
        return;
      }
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
      const passengerDetails = passengerInfo.map((p, i) => ({
        index: i + 1, firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone,
      }));
      const luggageAddonsData = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, qty]) => {
          const addon = luggageAddons.find((a) => a.id === addonId);
          return { addon_id: addonId, name: addon?.name || "", quantity: qty, price_each: addon?.price || 0, total: (addon?.price || 0) * qty };
        });

      const consentTimestamp = new Date().toISOString();

      const { data: bookingData, error: bookingError } = await supabase
        .from("tour_bookings")
        .insert({
          booking_number: bookingNum, tour_id: tourId, tour_date_id: selectedDate!.id,
          tariff_id: selectedTariff!.id, pickup_stop_id: selectedPickupStop?.id || null,
          user_id: user?.id || null, participants, passenger_details: passengerDetails,
          contact_first_name: passengerInfo[0].firstName, contact_last_name: passengerInfo[0].lastName,
          contact_email: passengerInfo[0].email, contact_phone: passengerInfo[0].phone || null,
          base_price: pricePerPerson, pickup_surcharge: pickupSurcharge * participants,
          luggage_addons: luggageAddonsData, total_price: totalPrice,
          discount_code: appliedCoupon?.code || null, discount_amount: discountAmount || null,
          payment_method: "bank_transfer", status: "pending", booking_type: "direct",
          customer_notes: JSON.stringify({
            consent_agb: consentTimestamp,
            consent_privacy: consentTimestamp,
            consent_travel_info: agreeTravelInfo ? consentTimestamp : null,
          }),
        })
        .select("id, booking_number").single();

      if (bookingError) throw bookingError;

      await supabase.from("tour_dates")
        .update({ booked_seats: selectedDate!.booked_seats + participants })
        .eq("id", selectedDate!.id);

      setBookingNumber(bookingData.booking_number);
      setBookingId(bookingData.id);
      setCurrentStep("confirmation");
      toast.success("Buchung erfolgreich erstellt!");

      // Send confirmation email + generate documents (non-blocking)
      supabase.functions.invoke("send-booking-confirmation", {
        body: { tourBookingId: bookingData.id },
      }).catch((err) => console.error("Email send error:", err));

      supabase.functions.invoke("generate-tour-documents", {
        body: { bookingId: bookingData.id },
      }).catch((err) => console.error("Document generation error:", err));

    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Fehler bei der Buchung. Bitte versuchen Sie es erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerInfo];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerInfo(updated);
  };

  const toggleAddon = (addonId: string, delta: number) => {
    const addon = luggageAddons.find((a) => a.id === addonId);
    if (!addon) return;
    const current = selectedAddons[addonId] || 0;
    const newVal = Math.max(0, Math.min(addon.max_per_booking, current + delta));
    setSelectedAddons({ ...selectedAddons, [addonId]: newVal });
  };

  const toggleExtra = (extraId: string, delta: number) => {
    const extra = tourExtras.find((e) => e.id === extraId);
    if (!extra) return;
    const current = selectedExtras[extraId] || 0;
    const newVal = Math.max(0, Math.min(extra.max_per_booking, current + delta));
    setSelectedExtras({ ...selectedExtras, [extraId]: newVal });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopiert!");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold text-foreground">Reisedaten werden geladen...</p>
            <p className="text-sm text-muted-foreground">Einen Moment bitte</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour || !selectedDate || !selectedTariff) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20 flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Reise nicht gefunden</h2>
          <p className="text-muted-foreground mb-6">Die gewünschte Reise konnte nicht geladen werden.</p>
          <Button onClick={() => navigate("/")}>Zurück zur Startseite</Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Included services tiles for sidebar
  const ServiceTiles = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {[
        { icon: Hotel, label: "Hotel inkl." },
        { icon: Coffee, label: "Frühstück inkl." },
        { icon: Bus, label: "Busreise inkl." },
        ...(selectedTariff?.suitcase_included ? [{ icon: Luggage, label: `Koffer ${selectedTariff.suitcase_weight_kg}kg` }] : []),
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 p-2 bg-primary/5 rounded-lg">
          <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Back Button */}
          {currentStep !== "confirmation" && (
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Reise
            </Button>
          )}

          {/* Premium Progress Bar */}
          {currentStep !== "confirmation" && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card border border-border/50">
                <Progress value={progressPercent} className="h-2 mb-5" />
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center relative">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                            isCompleted
                              ? "bg-primary text-primary-foreground shadow-md"
                              : isCurrent
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                        </div>
                        <span
                          className={cn(
                            "text-xs mt-2 text-center font-medium hidden sm:block",
                            isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-semibold sm:hidden mt-1">{step.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Step 1: Summary & Selection */}
              {currentStep === "summary" && (
                <>
                  {/* Tour Summary Card */}
                  <Card className="overflow-hidden">
                    {tour.image_url && (
                      <div className="h-40 sm:h-48 overflow-hidden">
                        <img src={tour.image_url} alt={tour.destination} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Bus className="w-5 h-5 text-primary" />
                        {tour.destination}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{formatDate(selectedDate.departure_date)}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedDate.duration_days || tour.duration_days} Tage
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{tour.location}</p>
                            <p className="text-sm text-muted-foreground">{tour.country}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Included Services Tiles */}
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Du bekommst:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { icon: Hotel, label: "Übernachtung", desc: "Hotel inkl." },
                            { icon: Coffee, label: "Frühstück", desc: "Täglich inkl." },
                            { icon: Bus, label: "Busreise", desc: "Hin & zurück" },
                            ...(selectedTariff.suitcase_included
                              ? [{ icon: Luggage, label: "Koffer", desc: `bis ${selectedTariff.suitcase_weight_kg}kg` }]
                              : []),
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <item.icon className="w-5 h-5 text-primary" />
                              </div>
                              <p className="text-sm font-semibold text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Participants */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-primary" />
                        Teilnehmer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">Anzahl Reisende</span>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">{participants}</span>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setParticipants(Math.min(availableSeats, participants + 1))} disabled={participants >= availableSeats}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {availableSeats <= 10 && (
                        <Badge variant="secondary" className="mt-3 bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Nur noch {availableSeats} Plätze verfügbar
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tariff Selection */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tarif wählen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {allTariffs.map((tariff) => (
                          <div
                            key={tariff.id}
                            onClick={() => setSelectedTariff(tariff)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                              selectedTariff?.id === tariff.id
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {tariff.is_recommended && (
                              <Badge className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-xs">Empfohlen</Badge>
                            )}
                            <h4 className="font-bold text-foreground">{tariff.name}</h4>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <div className="flex items-center gap-2">
                                <Luggage className={cn("w-4 h-4", tariff.suitcase_included ? "text-primary" : "text-muted-foreground")} />
                                <span>{tariff.suitcase_included ? `Koffer bis ${tariff.suitcase_weight_kg}kg` : "Nur Handgepäck"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Armchair className={cn("w-4 h-4", tariff.seat_reservation ? "text-primary" : "text-muted-foreground")} />
                                <span>{tariff.seat_reservation ? "Sitzplatzreservierung" : "Freie Platzwahl"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <RefreshCcw className={cn("w-4 h-4", tariff.is_refundable ? "text-primary" : "text-muted-foreground")} />
                                <span>{tariff.is_refundable ? `Storno bis ${tariff.cancellation_days}T vorher` : "Keine Stornierung"}</span>
                              </div>
                            </div>
                            {tariff.price_modifier > 0 && (
                              <p className="mt-2 text-sm font-semibold text-primary">+{tariff.price_modifier}€ p.P.</p>
                            )}
                            {selectedTariff?.id === tariff.id && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pickup Stop */}
                  {pickupStops.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                          Zustieg wählen
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select value={selectedPickupStop?.id || ""} onValueChange={(id) => setSelectedPickupStop(pickupStops.find((s) => s.id === id) || null)}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Zustiegspunkt wählen" />
                          </SelectTrigger>
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
                          <div className="mt-3 p-3 bg-muted/50 rounded-xl text-sm space-y-1">
                            <p className="font-semibold">{selectedPickupStop.city} – {selectedPickupStop.location_name}</p>
                            {selectedPickupStop.address && <p className="text-muted-foreground">{selectedPickupStop.address}</p>}
                            {selectedPickupStop.meeting_point && <p className="text-muted-foreground">Treffpunkt: {selectedPickupStop.meeting_point}</p>}
                            <p className="text-primary font-semibold">
                              Abfahrt: {formatTime(selectedPickupStop.departure_time)} Uhr
                              {selectedPickupStop.surcharge > 0 && ` | +${selectedPickupStop.surcharge}€ p.P.`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Luggage Add-ons */}
                  {luggageAddons.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Luggage className="w-5 h-5 text-primary" />
                          Zusätzliches Gepäck
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {luggageAddons.map((addon) => (
                          <div key={addon.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                            <div>
                              <p className="font-medium">{addon.name}</p>
                              {addon.description && <p className="text-sm text-muted-foreground">{addon.description}</p>}
                              <p className="text-sm text-primary font-semibold">{addon.price}€</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => toggleAddon(addon.id, -1)} disabled={!selectedAddons[addon.id]}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center font-semibold">{selectedAddons[addon.id] || 0}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => toggleAddon(addon.id, 1)} disabled={(selectedAddons[addon.id] || 0) >= addon.max_per_booking}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Tour Extras */}
                  {tourExtras.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Star className="w-5 h-5 text-primary" />
                          Zusatzleistungen
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tourExtras.map((extra) => {
                          const priceLabel = extra.price_type === 'per_person' ? 'p.P.' : extra.price_type === 'per_night' ? 'pro Nacht' : extra.price_type === 'per_person_night' ? 'p.P./Nacht' : 'pro Buchung';
                          return (
                            <div key={extra.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                              <div>
                                <p className="font-medium">{extra.name}</p>
                                {extra.description && <p className="text-sm text-muted-foreground">{extra.description}</p>}
                                <p className="text-sm text-primary font-semibold">{extra.price}€ {priceLabel}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => toggleExtra(extra.id, -1)} disabled={!selectedExtras[extra.id]}>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-semibold">{selectedExtras[extra.id] || 0}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => toggleExtra(extra.id, 1)} disabled={(selectedExtras[extra.id] || 0) >= extra.max_per_booking}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Step 2: Passenger Details */}
              {currentStep === "passengers" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Reisende eingeben
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bitte Telefon ergänzen, damit wir Sie bei Änderungen erreichen können.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {passengerInfo.map((passenger, index) => (
                      <div key={index} className="p-5 bg-muted/30 rounded-xl space-y-4 border border-border/50">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          Reisender {index + 1}
                          {index === 0 && <Badge variant="secondary" className="text-xs">Hauptkontakt</Badge>}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Vorname *</Label>
                            <Input value={passenger.firstName} onChange={(e) => updatePassenger(index, "firstName", e.target.value)} placeholder="Max" className="mt-1.5 h-11" autoComplete="given-name" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Nachname *</Label>
                            <Input value={passenger.lastName} onChange={(e) => updatePassenger(index, "lastName", e.target.value)} placeholder="Mustermann" className="mt-1.5 h-11" autoComplete="family-name" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">E-Mail *</Label>
                            <Input type="email" value={passenger.email} onChange={(e) => updatePassenger(index, "email", e.target.value)} placeholder="max@beispiel.de" className="mt-1.5 h-11" autoComplete="email" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Telefon</Label>
                            <Input type="tel" value={passenger.phone} onChange={(e) => updatePassenger(index, "phone", e.target.value)} placeholder="+49 170 1234567" className="mt-1.5 h-11" autoComplete="tel" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment – Bank Transfer */}
              {currentStep === "payment" && (
                <div className="space-y-5">
                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-primary" />
                        Zahlung per Überweisung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Zahlungsart: Überweisung</p>
                            <p className="text-sm text-muted-foreground">
                              Du erhältst nach der Buchung eine E-Mail mit unseren Bankdaten und dem Verwendungszweck.
                            </p>
                          </div>
                        </div>
                        <div className="p-3 bg-card rounded-lg border border-border/50 text-sm">
                          <p className="text-muted-foreground">
                            Deine Buchung wird nach Zahlungseingang bestätigt und automatisch freigegeben.
                            Du erhältst dann eine zweite E-Mail mit deinen vollständigen Reiseunterlagen.
                          </p>
                        </div>
                      </div>

                      {/* Booking Summary */}
                      <div className="p-4 bg-muted/30 rounded-xl space-y-2 text-sm">
                        <h4 className="font-semibold text-foreground mb-3">Deine Buchung im Überblick</h4>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reise</span>
                          <span className="font-medium">{tour.destination}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Termin</span>
                          <span className="font-medium">{formatDate(selectedDate.departure_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarif</span>
                          <span className="font-medium">{selectedTariff.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reisende</span>
                          <span className="font-medium">{participants} Person(en)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kontakt</span>
                          <span className="font-medium">{passengerInfo[0]?.firstName} {passengerInfo[0]?.lastName}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Checkboxes */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="terms"
                            checked={agreeTerms}
                            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                          />
                          <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich akzeptiere die{" "}
                            <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">AGB</a> *
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="privacy"
                            checked={agreePrivacy}
                            onCheckedChange={(checked) => setAgreePrivacy(checked as boolean)}
                          />
                          <Label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich habe die{" "}
                            <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">Datenschutzhinweise</a>{" "}
                            gelesen und akzeptiert *
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="travelinfo"
                            checked={agreeTravelInfo}
                            onCheckedChange={(checked) => setAgreeTravelInfo(checked as boolean)}
                          />
                          <Label htmlFor="travelinfo" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                            Ich bestätige die Reiseinformationen zur Pauschalreise (optional)
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === "confirmation" && (
                <Card className="border-primary/20 overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-5">
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Buchung erfolgreich erstellt!</h2>
                    <p className="text-muted-foreground mb-2">
                      Buchungsnummer: <span className="font-mono font-bold text-foreground">{bookingNumber}</span>
                    </p>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">⏳ Warte auf Zahlungseingang</Badge>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <p className="text-center text-muted-foreground">
                      Eine Bestätigung mit den Bankdaten wurde an <strong>{passengerInfo[0]?.email}</strong> gesendet.
                    </p>

                    {/* Bank Details */}
                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-primary" />
                        Überweisungsdaten
                      </h3>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: "Empfänger", value: BANK_DETAILS.recipient },
                          { label: "IBAN", value: BANK_DETAILS.iban },
                          { label: "BIC", value: BANK_DETAILS.bic },
                          { label: "Bank", value: BANK_DETAILS.bank },
                          { label: "Verwendungszweck", value: `Buchung ${bookingNumber}` },
                          { label: "Betrag", value: `${totalPrice.toFixed(2)} €` },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border/50">
                            <div>
                              <span className="text-muted-foreground text-xs">{item.label}</span>
                              <p className="font-semibold text-foreground">{item.value}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(item.value)}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Document Downloads */}
                    <div className="bg-muted/30 rounded-xl p-5">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Deine Reiseunterlagen
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
                          disabled={isGenerating}
                          onClick={() => openDocument({ bookingNumber: bookingNumber! }, "confirmation")}
                        >
                          <FileText className="w-6 h-6 text-primary" />
                          <span className="text-sm font-medium">Bestätigung</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
                          disabled={isGenerating}
                          onClick={() => openDocument({ bookingNumber: bookingNumber! }, "invoice")}
                        >
                          <Receipt className="w-6 h-6 text-primary" />
                          <span className="text-sm font-medium">Rechnung</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
                          disabled={isGenerating}
                          onClick={() => openDocument({ bookingNumber: bookingNumber! }, "voucher")}
                        >
                          <Hotel className="w-6 h-6 text-accent" />
                          <span className="text-sm font-medium">Voucher</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
                          disabled={isGenerating}
                          onClick={() => openDocument({ bookingNumber: bookingNumber! }, "travelplan")}
                        >
                          <MapPin className="w-6 h-6 text-primary" />
                          <span className="text-sm font-medium">Reiseplan</span>
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        className="w-full mt-3"
                        disabled={isGenerating}
                        onClick={() => downloadAllDocuments({ bookingNumber: bookingNumber! })}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? "Wird generiert..." : "Alle Unterlagen herunterladen"}
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => navigate("/bookings")} size="lg">Meine Buchungen</Button>
                      <Button variant="outline" onClick={() => navigate("/")} size="lg">Zur Startseite</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Sticky Price Summary */}
            {currentStep !== "confirmation" && (
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <Card className="border-2 border-primary/20 shadow-elevated overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b pb-4">
                      <CardTitle className="text-lg">Preisübersicht</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {/* Included services */}
                      <ServiceTiles />

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{participants}× Reisepreis</span>
                          <span className="font-medium">{(pricePerPerson * participants).toFixed(0)}€</span>
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
                          <div className="flex justify-between text-primary font-medium">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {appliedCoupon.code}
                            </span>
                            <span>-{discountAmount.toFixed(0)}€</span>
                          </div>
                        )}
                      </div>

                      {/* Coupon Input */}
                      <div className="space-y-2">
                        {appliedCoupon ? (
                          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
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

                      <div className="flex justify-between items-end">
                        <span className="text-muted-foreground text-sm">Gesamtpreis</span>
                        <div className="text-right">
                          {discountAmount > 0 && (
                            <span className="text-sm text-muted-foreground line-through block">{subtotal.toFixed(0)}€</span>
                          )}
                          <span className="text-3xl font-bold text-primary">{totalPrice.toFixed(0)}€</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button size="lg" className="w-full text-base" onClick={handleNextStep} disabled={isProcessing}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Buchung wird erstellt...
                          </>
                        ) : currentStep === "payment" ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Jetzt verbindlich buchen
                          </>
                        ) : (
                          "Weiter"
                        )}
                      </Button>

                      {currentStep !== "summary" && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={handlePrevStep}>
                          <ArrowLeft className="w-3 h-3 mr-1" />
                          Zurück
                        </Button>
                      )}

                      {/* Trust Elements */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Banknote className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Zahlung per Überweisung</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>SSL-verschlüsselt</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Sofortige Buchungsbestätigung per E-Mail</span>
                        </div>
                        {selectedTariff?.is_refundable && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <RefreshCcw className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Kostenfreie Storno bis {selectedTariff.cancellation_days} Tage vorher</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      {currentStep !== "confirmation" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Gesamtpreis</p>
              <p className="text-2xl font-bold text-primary">{totalPrice.toFixed(0)}€</p>
            </div>
            <Button size="lg" className="flex-1 max-w-[200px]" onClick={handleNextStep} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStep === "payment" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Buchen
                </>
              ) : (
                "Weiter"
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
