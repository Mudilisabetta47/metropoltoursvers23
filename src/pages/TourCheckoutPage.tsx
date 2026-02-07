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
  CreditCard,
  Loader2,
  AlertCircle,
  Hotel,
  Coffee,
  Armchair,
  RefreshCcw,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  TourTariff,
  TourDate,
  TourRoute,
  TourLuggageAddon,
  ExtendedPackageTour,
} from "@/hooks/useTourBuilder";

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

const TourCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([]);

  // Form state
  const [participants, setParticipants] = useState(initialPax);
  const [selectedPickupStop, setSelectedPickupStop] = useState<PickupStop | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "invoice">("card");
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);

  useEffect(() => {
    if (tourId) {
      loadTourData();
    }
  }, [tourId, dateId, tariffId]);

  useEffect(() => {
    // Initialize passenger info when participants change
    setPassengerInfo(
      Array(participants)
        .fill(null)
        .map((_, i) => passengerInfo[i] || { firstName: "", lastName: "", email: "", phone: "" })
    );
  }, [participants]);

  const loadTourData = async () => {
    setIsLoading(true);
    try {
      // Fetch tour
      const { data: tourData, error: tourError } = await supabase
        .from("package_tours")
        .select("*")
        .eq("id", tourId)
        .single();

      if (tourError || !tourData) {
        throw new Error("Tour not found");
      }
      setTour(tourData as unknown as ExtendedPackageTour);

      // Parallel fetches
      const [datesRes, tariffsRes, routesRes, luggageRes] = await Promise.all([
        supabase.from("tour_dates").select("*").eq("tour_id", tourId).eq("is_active", true).order("departure_date"),
        supabase.from("tour_tariffs").select("*").eq("tour_id", tourId).eq("is_active", true).order("sort_order"),
        supabase.from("tour_routes").select("*, tour_pickup_stops(*)").eq("tour_id", tourId).eq("is_active", true),
        supabase.from("tour_luggage_addons").select("*").eq("tour_id", tourId).eq("is_active", true),
      ]);

      const dates = (datesRes.data || []) as TourDate[];
      const tariffs = (tariffsRes.data || []) as TourTariff[];

      setAllDates(dates);
      setAllTariffs(tariffs);
      setLuggageAddons((luggageRes.data || []) as TourLuggageAddon[]);

      // Extract pickup stops from routes
      const allStops: PickupStop[] = [];
      (routesRes.data || []).forEach((route: any) => {
        if (route.tour_pickup_stops) {
          route.tour_pickup_stops.forEach((stop: any) => {
            if (stop.is_active) {
              allStops.push(stop);
            }
          });
        }
      });
      setPickupStops(allStops.sort((a, b) => a.surcharge - b.surcharge));
      setRoutes(routesRes.data as TourRoute[] || []);

      // Set selected date and tariff
      const date = dates.find((d) => d.id === dateId) || dates[0];
      const tariff = tariffs.find((t) => t.id === tariffId) || tariffs.find((t) => t.is_recommended) || tariffs[0];
      setSelectedDate(date || null);
      setSelectedTariff(tariff || null);

      // Auto-select first pickup stop
      if (allStops.length > 0) {
        setSelectedPickupStop(allStops[0]);
      }
    } catch (error) {
      console.error("Error loading tour data:", error);
      toast.error("Fehler beim Laden der Reisedaten");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd.MM.yyyy", { locale: de });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5) || "";
  };

  // Price calculation
  const calculateBasePrice = () => {
    if (!selectedDate || !selectedTariff) return 0;
    const basePrice =
      selectedTariff.slug === "basic"
        ? selectedDate.price_basic
        : selectedTariff.slug === "smart"
        ? selectedDate.price_smart || selectedDate.price_basic
        : selectedTariff.slug === "flex"
        ? selectedDate.price_flex || selectedDate.price_basic
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

  const totalPrice = baseTotal + addonsTotal;
  const availableSeats = selectedDate ? selectedDate.total_seats - selectedDate.booked_seats : 0;

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "summary", label: "Übersicht" },
    { key: "passengers", label: "Reisende" },
    { key: "payment", label: "Zahlung" },
    { key: "confirmation", label: "Bestätigung" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

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
    } else if (currentStep === "passengers") {
      const isValid = passengerInfo.every((p) => p.firstName && p.lastName && p.email);
      if (!isValid) {
        toast.error("Bitte füllen Sie alle Pflichtfelder aus");
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      if (!agreeTerms) {
        toast.error("Bitte akzeptieren Sie die AGB");
        return;
      }
      await processBooking();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === "passengers") setCurrentStep("summary");
    else if (currentStep === "payment") setCurrentStep("passengers");
  };

  const processBooking = async () => {
    setIsProcessing(true);
    try {
      // Generate booking number
      const bookingNum = `MT-${Date.now().toString(36).toUpperCase()}`;

      const passengerDetails = passengerInfo.map((p, i) => ({
        index: i + 1,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
      }));

      const luggageAddonsData = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, qty]) => {
          const addon = luggageAddons.find((a) => a.id === addonId);
          return {
            addon_id: addonId,
            name: addon?.name || "",
            quantity: qty,
            price_each: addon?.price || 0,
            total: (addon?.price || 0) * qty,
          };
        });

      const { data: bookingData, error: bookingError } = await supabase
        .from("tour_bookings")
        .insert({
          booking_number: bookingNum,
          tour_id: tourId,
          tour_date_id: selectedDate!.id,
          tariff_id: selectedTariff!.id,
          pickup_stop_id: selectedPickupStop?.id || null,
          user_id: user?.id || null,
          participants,
          passenger_details: passengerDetails,
          contact_first_name: passengerInfo[0].firstName,
          contact_last_name: passengerInfo[0].lastName,
          contact_email: passengerInfo[0].email,
          contact_phone: passengerInfo[0].phone || null,
          base_price: pricePerPerson,
          pickup_surcharge: pickupSurcharge * participants,
          luggage_addons: luggageAddonsData,
          total_price: totalPrice,
          payment_method: paymentMethod,
          status: "pending",
          booking_type: "direct",
        })
        .select("id, booking_number")
        .single();

      if (bookingError) throw bookingError;

      // Update booked seats count
      await supabase
        .from("tour_dates")
        .update({ booked_seats: selectedDate!.booked_seats + participants })
        .eq("id", selectedDate!.id);

      setBookingNumber(bookingData.booking_number);
      setCurrentStep("confirmation");
      toast.success("Buchung erfolgreich!");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Fehler bei der Buchung. Bitte versuchen Sie es erneut.");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          {currentStep !== "confirmation" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Reise
            </Button>
          )}

          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all text-sm",
                        index < currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : index === currentStepIndex
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs mt-2 hidden sm:block text-center",
                        index <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn("h-1 w-6 sm:w-16 lg:w-24 mx-1 sm:mx-2", index < currentStepIndex ? "bg-primary" : "bg-muted")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Summary & Selection */}
              {currentStep === "summary" && (
                <>
                  {/* Tour Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-primary" />
                        {tour.destination}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{formatDate(selectedDate.departure_date)}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedDate.duration_days || tour.duration_days} Tage
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{tour.location}</p>
                            <p className="text-sm text-muted-foreground">{tour.country}</p>
                          </div>
                        </div>
                      </div>

                      {/* Included Features */}
                      <Separator />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Hotel className="w-4 h-4 text-emerald-600" />
                          <span>Übernachtung inkl.</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Coffee className="w-4 h-4 text-emerald-600" />
                          <span>Frühstück inkl.</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Bus className="w-4 h-4 text-emerald-600" />
                          <span>Busreise inkl.</span>
                        </div>
                        {selectedTariff.suitcase_included && (
                          <div className="flex items-center gap-2 text-sm">
                            <Luggage className="w-4 h-4 text-emerald-600" />
                            <span>Koffer bis {selectedTariff.suitcase_weight_kg}kg inkl.</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Participants */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Teilnehmer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">Anzahl Reisende</span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setParticipants(Math.max(1, participants - 1))}
                            disabled={participants <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">{participants}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setParticipants(Math.min(availableSeats, participants + 1))}
                            disabled={participants >= availableSeats}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {availableSeats <= 10 && (
                        <p className="text-sm text-amber-600 mt-2">
                          Nur noch {availableSeats} Plätze verfügbar!
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tariff Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tarif wählen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {allTariffs.map((tariff) => (
                          <div
                            key={tariff.id}
                            onClick={() => setSelectedTariff(tariff)}
                            className={cn(
                              "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                              selectedTariff?.id === tariff.id
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            )}
                          >
                            {tariff.is_recommended && (
                              <Badge className="absolute -top-2 left-4 bg-accent text-accent-foreground">
                                Empfohlen
                              </Badge>
                            )}
                            <h4 className="font-bold text-foreground">{tariff.name}</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Luggage className={cn("w-4 h-4", tariff.suitcase_included ? "text-emerald-600" : "text-muted-foreground")} />
                                <span>{tariff.suitcase_included ? `Koffer bis ${tariff.suitcase_weight_kg}kg` : "Nur Handgepäck"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Armchair className={cn("w-4 h-4", tariff.seat_reservation ? "text-emerald-600" : "text-muted-foreground")} />
                                <span>{tariff.seat_reservation ? "Sitzplatzreservierung" : "Freie Platzwahl"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <RefreshCcw className={cn("w-4 h-4", tariff.is_refundable ? "text-emerald-600" : "text-muted-foreground")} />
                                <span>{tariff.is_refundable ? `Storno bis ${tariff.cancellation_days}T vorher` : "Keine Stornierung"}</span>
                              </div>
                            </div>
                            {tariff.price_modifier > 0 && (
                              <p className="mt-2 text-sm font-medium text-primary">+{tariff.price_modifier}€ p.P.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pickup Stop Selection */}
                  {pickupStops.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          Zustieg wählen
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select
                          value={selectedPickupStop?.id || ""}
                          onValueChange={(id) => {
                            const stop = pickupStops.find((s) => s.id === id);
                            setSelectedPickupStop(stop || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Zustiegspunkt wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupStops.map((stop) => (
                              <SelectItem key={stop.id} value={stop.id}>
                                <div className="flex items-center justify-between w-full gap-4">
                                  <span>
                                    {stop.city} – {stop.location_name} ({formatTime(stop.departure_time)} Uhr)
                                  </span>
                                  {stop.surcharge > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                      +{stop.surcharge}€
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPickupStop && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium">{selectedPickupStop.city} – {selectedPickupStop.location_name}</p>
                            {selectedPickupStop.address && (
                              <p className="text-muted-foreground">{selectedPickupStop.address}</p>
                            )}
                            {selectedPickupStop.meeting_point && (
                              <p className="text-muted-foreground">Treffpunkt: {selectedPickupStop.meeting_point}</p>
                            )}
                            <p className="text-primary font-medium mt-1">
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
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Luggage className="w-5 h-5 text-primary" />
                          Zusätzliches Gepäck
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {luggageAddons.map((addon) => (
                          <div key={addon.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{addon.name}</p>
                              {addon.description && (
                                <p className="text-sm text-muted-foreground">{addon.description}</p>
                              )}
                              <p className="text-sm text-primary font-medium">{addon.price}€</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleAddon(addon.id, -1)}
                                disabled={!selectedAddons[addon.id]}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center font-medium">
                                {selectedAddons[addon.id] || 0}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleAddon(addon.id, 1)}
                                disabled={(selectedAddons[addon.id] || 0) >= addon.max_per_booking}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Step 2: Passenger Details */}
              {currentStep === "passengers" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reisende eingeben</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {passengerInfo.map((passenger, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Reisender {index + 1}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Vorname *</Label>
                            <Input
                              value={passenger.firstName}
                              onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                              placeholder="Max"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Nachname *</Label>
                            <Input
                              value={passenger.lastName}
                              onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                              placeholder="Mustermann"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>E-Mail *</Label>
                            <Input
                              type="email"
                              value={passenger.email}
                              onChange={(e) => updatePassenger(index, "email", e.target.value)}
                              placeholder="max@beispiel.de"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Telefon</Label>
                            <Input
                              type="tel"
                              value={passenger.phone}
                              onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                              placeholder="+49..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment */}
              {currentStep === "payment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Zahlungsmethode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      {(["card", "paypal", "invoice"] as const).map((method) => (
                        <div
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer text-center transition-all",
                            paymentMethod === method
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <CreditCard className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">
                            {method === "card" ? "Kreditkarte" : method === "paypal" ? "PayPal" : "Rechnung"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        Ich akzeptiere die{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline">
                          AGB
                        </a>{" "}
                        und{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">
                          Datenschutzbestimmungen
                        </a>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === "confirmation" && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="pt-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-800 mb-2">Buchung erfolgreich!</h2>
                    <p className="text-emerald-700 mb-4">
                      Ihre Buchungsnummer: <span className="font-mono font-bold">{bookingNumber}</span>
                    </p>
                    <p className="text-muted-foreground mb-6">
                      Eine Bestätigung wurde an {passengerInfo[0]?.email} gesendet.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => navigate("/bookings")}>Meine Buchungen</Button>
                      <Button variant="outline" onClick={() => navigate("/")}>
                        Zur Startseite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Price Summary */}
            {currentStep !== "confirmation" && (
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-2 border-primary/20">
                  <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                    <CardTitle>Preisübersicht</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{participants}x Reisepreis</span>
                        <span>{(pricePerPerson * participants).toFixed(0)}€</span>
                      </div>
                      {pickupSurcharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>{participants}x Zustiegsaufpreis</span>
                          <span>+{(pickupSurcharge * participants).toFixed(0)}€</span>
                        </div>
                      )}
                      {addonsTotal > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Zusatzgepäck</span>
                          <span>+{addonsTotal.toFixed(0)}€</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground">Gesamtpreis</span>
                      <span className="text-2xl font-bold text-primary">{totalPrice.toFixed(0)}€</span>
                    </div>

                    {/* CTA */}
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleNextStep}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Wird gebucht...
                        </>
                      ) : currentStep === "payment" ? (
                        "Jetzt kostenpflichtig buchen"
                      ) : (
                        "Weiter"
                      )}
                    </Button>

                    {currentStep !== "summary" && (
                      <Button variant="ghost" size="sm" className="w-full" onClick={handlePrevStep}>
                        Zurück
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      ✓ Sichere Zahlung • ✓ Sofortige Bestätigung
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TourCheckoutPage;
