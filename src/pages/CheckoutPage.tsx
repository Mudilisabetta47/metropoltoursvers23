import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, ArrowLeft, Bus, Clock, User, Mail, Phone, CreditCard, Check, Briefcase, PawPrint, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SeatMap from "@/components/booking/SeatMap";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSessionId } from "@/hooks/useSessionId";

type CheckoutStep = "seats" | "details" | "extras" | "payment" | "confirmation";

interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  seatId: string;
  seatNumber: string;
}

interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  selected: boolean;
}

interface TripDetails {
  id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  bus_id: string;
  route: { name: string };
  bus: { name: string; total_seats: number };
}

interface StopDetails {
  id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const tripId = searchParams.get("tripId") || "";
  const fromStopId = searchParams.get("fromStopId") || "";
  const toStopId = searchParams.get("toStopId") || "";
  const passengers = parseInt(searchParams.get("passengers") || "1");
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("seats");
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [originStop, setOriginStop] = useState<StopDetails | null>(null);
  const [destinationStop, setDestinationStop] = useState<StopDetails | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo[]>(
    Array(passengers).fill(null).map(() => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      seatId: "",
      seatNumber: "",
    }))
  );

  const [extras, setExtras] = useState<Extra[]>([
    { id: "luggage", name: "Zusatzgepäck", description: "Ein weiteres Gepäckstück (max. 20kg)", price: 9.99, icon: <Briefcase className="w-5 h-5" />, selected: false },
    { id: "pet", name: "Haustier", description: "Kleine Haustiere in Transportbox", price: 14.99, icon: <PawPrint className="w-5 h-5" />, selected: false },
    { id: "insurance", name: "Reiseversicherung", description: "Stornierung & Gepäckschutz", price: 7.99, icon: <Shield className="w-5 h-5" />, selected: false },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "sofort">("card");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingNumbers, setBookingNumbers] = useState<string[]>([]);

  useEffect(() => {
    if (tripId && fromStopId && toStopId) {
      loadTripData();
    }
  }, [tripId, fromStopId, toStopId]);

  const loadTripData = async () => {
    setIsLoading(true);
    try {
      // Load trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Load stops
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .in('id', [fromStopId, toStopId]);

      if (stopsError) throw stopsError;

      const origin = stopsData?.find(s => s.id === fromStopId);
      const destination = stopsData?.find(s => s.id === toStopId);
      setOriginStop(origin || null);
      setDestinationStop(destination || null);

      // Calculate price
      const { data: priceData, error: priceError } = await supabase
        .rpc('calculate_trip_price', {
          p_trip_id: tripId,
          p_origin_stop_id: fromStopId,
          p_destination_stop_id: toStopId
        });

      if (!priceError && priceData !== null) {
        setPrice(priceData);
      } else if (origin && destination) {
        setPrice(destination.price_from_start - origin.price_from_start);
      }

    } catch (error) {
      console.error('Error loading trip data:', error);
      toast.error('Fehler beim Laden der Reisedaten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatSelect = (seatId: string, seatNumber: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        // Remove seat
        const updated = prev.filter(id => id !== seatId);
        // Update passenger info
        setPassengerInfo(info => info.map(p => 
          p.seatId === seatId ? { ...p, seatId: "", seatNumber: "" } : p
        ));
        return updated;
      } else {
        // Add seat
        const updated = [...prev, seatId];
        // Assign to first passenger without a seat
        setPassengerInfo(info => {
          const firstWithoutSeat = info.findIndex(p => !p.seatId);
          if (firstWithoutSeat !== -1) {
            const newInfo = [...info];
            newInfo[firstWithoutSeat] = { ...newInfo[firstWithoutSeat], seatId, seatNumber };
            return newInfo;
          }
          return info;
        });
        return updated;
      }
    });
  };

  const basePrice = price * passengers;
  const extrasPrice = extras.filter(e => e.selected).reduce((sum, e) => sum + e.price * passengers, 0);
  const totalPrice = basePrice + extrasPrice;

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "seats", label: "Sitzplatz" },
    { key: "details", label: "Reisedaten" },
    { key: "extras", label: "Extras" },
    { key: "payment", label: "Zahlung" },
    { key: "confirmation", label: "Bestätigung" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleNextStep = async () => {
    if (currentStep === "seats") {
      if (selectedSeats.length !== passengers) {
        toast.error(`Bitte wählen Sie ${passengers} Sitzplätze aus`);
        return;
      }
      setCurrentStep("details");
    } else if (currentStep === "details") {
      const isValid = passengerInfo.every(p => p.firstName && p.lastName && p.email);
      if (!isValid) {
        toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
        return;
      }
      setCurrentStep("extras");
    } else if (currentStep === "extras") {
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      if (!agreeTerms) {
        toast.error("Bitte akzeptieren Sie die AGB.");
        return;
      }
      
      await processBooking();
    }
  };

  const processBooking = async () => {
    setIsProcessing(true);
    const sessionId = getSessionId();
    const generatedNumbers: string[] = [];

    try {
      for (let i = 0; i < passengerInfo.length; i++) {
        const passenger = passengerInfo[i];
        
        // Generate ticket number
        const { data: ticketNumber, error: ticketError } = await supabase
          .rpc('generate_ticket_number');

        if (ticketError) throw ticketError;

        // Create booking
        const selectedExtras = extras.filter(e => e.selected).map(e => ({
          id: e.id,
          name: e.name,
          price: e.price
        }));

        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            ticket_number: ticketNumber,
            user_id: user?.id || null,
            trip_id: tripId,
            origin_stop_id: fromStopId,
            destination_stop_id: toStopId,
            seat_id: passenger.seatId,
            passenger_first_name: passenger.firstName,
            passenger_last_name: passenger.lastName,
            passenger_email: passenger.email,
            passenger_phone: passenger.phone || null,
            price_paid: price + extras.filter(e => e.selected).reduce((sum, e) => sum + e.price, 0),
            status: 'confirmed',
            extras: selectedExtras
          });

        if (bookingError) throw bookingError;

        generatedNumbers.push(ticketNumber);

        // Delete the seat hold
        await supabase
          .from('seat_holds')
          .delete()
          .eq('trip_id', tripId)
          .eq('seat_id', passenger.seatId)
          .eq('session_id', sessionId);
      }

      setBookingNumbers(generatedNumbers);

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            email: passengerInfo[0].email,
            firstName: passengerInfo[0].firstName,
            lastName: passengerInfo[0].lastName,
            bookingNumber: generatedNumbers[0],
            from: originStop?.name || '',
            to: destinationStop?.name || '',
            departureDate: trip ? format(new Date(trip.departure_date), "dd.MM.yyyy", { locale: de }) : '',
            departureTime: trip?.departure_time?.substring(0, 5) || '',
            arrivalTime: trip?.arrival_time?.substring(0, 5) || '',
            passengers,
            totalPrice,
            extras: extras.filter(e => e.selected).map(e => e.name),
            seatNumbers: passengerInfo.map(p => p.seatNumber).join(', ')
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      setCurrentStep("confirmation");
      toast.success("Buchung erfolgreich abgeschlossen!");
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Fehler bei der Buchung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === "details") setCurrentStep("seats");
    else if (currentStep === "extras") setCurrentStep("details");
    else if (currentStep === "payment") setCurrentStep("extras");
  };

  const toggleExtra = (id: string) => {
    setExtras(extras.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerInfo];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerInfo(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trip || !originStop || !destinationStop) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex flex-col items-center justify-center text-center px-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Reise nicht gefunden</h2>
          <p className="text-muted-foreground mb-6">Die gewünschte Verbindung konnte nicht geladen werden.</p>
          <Button onClick={() => navigate('/search')}>
            Zurück zur Suche
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const departureDate = new Date(trip.departure_date);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-8">
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
                    <span className={cn(
                      "text-[10px] sm:text-xs mt-2 hidden sm:block text-center",
                      index <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-1 w-6 sm:w-16 lg:w-24 mx-1 sm:mx-2",
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Seat Selection */}
              {currentStep === "seats" && (
                <SeatMap
                  tripId={tripId}
                  busId={trip.bus_id}
                  originStopId={fromStopId}
                  destinationStopId={toStopId}
                  originStopOrder={originStop.stop_order}
                  destinationStopOrder={destinationStop.stop_order}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSeats={passengers}
                />
              )}

              {/* Step 2: Passenger Details */}
              {currentStep === "details" && (
                <div className="bg-card rounded-xl shadow-card p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Reisende</h2>
                  
                  {passengerInfo.map((passenger, index) => (
                    <div key={index} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Reisender {index + 1} – Sitz {passenger.seatNumber}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`firstName-${index}`}>Vorname *</Label>
                          <Input
                            id={`firstName-${index}`}
                            value={passenger.firstName}
                            onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                            placeholder="Max"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`lastName-${index}`}>Nachname *</Label>
                          <Input
                            id={`lastName-${index}`}
                            value={passenger.lastName}
                            onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                            placeholder="Mustermann"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email-${index}`}>E-Mail *</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id={`email-${index}`}
                              type="email"
                              value={passenger.email}
                              onChange={(e) => updatePassenger(index, "email", e.target.value)}
                              placeholder="max@beispiel.de"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`phone-${index}`}>Telefon</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id={`phone-${index}`}
                              type="tel"
                              value={passenger.phone}
                              onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                              placeholder="+49 123 456789"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Extras */}
              {currentStep === "extras" && (
                <div className="bg-card rounded-xl shadow-card p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Zusatzleistungen</h2>
                  
                  <div className="space-y-4">
                    {extras.map((extra) => (
                      <div
                        key={extra.id}
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all",
                          extra.selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            extra.selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {extra.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{extra.name}</h3>
                            <p className="text-sm text-muted-foreground">{extra.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">+€{extra.price.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">pro Person</div>
                          </div>
                          <Checkbox checked={extra.selected} className="w-6 h-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === "payment" && (
                <div className="bg-card rounded-xl shadow-card p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Zahlungsmethode</h2>
                  
                  <div className="space-y-4 mb-8">
                    {[
                      { id: "card", label: "Kredit-/Debitkarte", icon: <CreditCard className="w-5 h-5" /> },
                      { id: "paypal", label: "PayPal", icon: <span className="text-sm font-bold">PP</span> },
                      { id: "sofort", label: "Sofortüberweisung", icon: <span className="text-sm font-bold">S</span> },
                    ].map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4",
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          paymentMethod === method.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {method.icon}
                        </div>
                        <span className="font-medium text-foreground">{method.label}</span>
                      </div>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                      <div>
                        <Label>Kartennummer</Label>
                        <Input placeholder="1234 5678 9012 3456" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Gültig bis</Label>
                          <Input placeholder="MM/YY" className="mt-1" />
                        </div>
                        <div>
                          <Label>CVV</Label>
                          <Input placeholder="123" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                      Ich akzeptiere die <a href="/terms" className="text-primary hover:underline">AGB</a> und die{" "}
                      <a href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</a>.
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === "confirmation" && (
                <div className="bg-card rounded-xl shadow-card p-6 lg:p-8 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Buchung bestätigt!</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Ihre Buchung wurde erfolgreich abgeschlossen. Eine Bestätigungs-E-Mail wurde an {passengerInfo[0].email} gesendet.
                  </p>
                  
                  <div className="bg-muted/50 rounded-xl p-6 text-left mb-8">
                    <h3 className="font-semibold text-foreground mb-4">Buchungsdetails</h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ticketnummer(n):</span>
                        <div className="font-semibold text-foreground">
                          {bookingNumbers.map((num, i) => (
                            <div key={i}>{num}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Datum:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {format(departureDate, "dd.MM.yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Strecke:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {originStop.name} → {destinationStop.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sitzplätze:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {passengerInfo.map(p => p.seatNumber).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reisende:</span>
                        <span className="font-semibold text-foreground ml-2">{passengers}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gesamtpreis:</span>
                        <span className="font-semibold text-primary ml-2">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate("/bookings")}>
                      Meine Buchungen
                    </Button>
                    <Button onClick={() => navigate("/")}>
                      Zurück zur Startseite
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep !== "confirmation" && (
                <div className="flex justify-between mt-6">
                  {currentStep !== "seats" ? (
                    <Button variant="ghost" onClick={handlePrevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Zurück
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Zur Suche
                    </Button>
                  )}
                  <Button variant="accent" size="lg" onClick={handleNextStep} disabled={isProcessing}>
                    {isProcessing ? "Wird verarbeitet..." : currentStep === "payment" ? "Jetzt buchen" : "Weiter"}
                    {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar - Trip Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-card p-6 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4">Ihre Reise</h3>
                
                {/* Trip Info */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {originStop.name} → {destinationStop.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(departureDate, "dd. MMM", { locale: de })} • {trip.departure_time.substring(0, 5)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Ankunft: {trip.arrival_time.substring(0, 5)}</span>
                </div>

                {/* Selected Seats */}
                {selectedSeats.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <div className="text-sm text-muted-foreground mb-2">Gewählte Sitzplätze:</div>
                    <div className="flex flex-wrap gap-2">
                      {passengerInfo.filter(p => p.seatNumber).map((p, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                          Sitz {p.seatNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{passengers}x Ticket</span>
                    <span className="text-foreground">€{basePrice.toFixed(2)}</span>
                  </div>
                  {extras.filter(e => e.selected).map((extra) => (
                    <div key={extra.id} className="flex justify-between">
                      <span className="text-muted-foreground">{passengers}x {extra.name}</span>
                      <span className="text-foreground">€{(extra.price * passengers).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Gesamt</span>
                    <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Preis kann bei hoher Auslastung steigen. Der angezeigte Preis ist garantiert nach Buchungsabschluss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
