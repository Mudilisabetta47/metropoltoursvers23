import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  Armchair,
  Bus,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { nativeHaptic } from "@/mobile/lib/native";
import { InAppPayment } from "@/mobile/components/InAppPayment";
import {
  createTripBooking,
  money,
  type PassengerInput,
} from "@/mobile/lib/appBooking";
import {
  TRIP_CATEGORY_LABEL,
  useBookableTrips,
  useRouteStops,
  useTripSeats,
} from "@/mobile/hooks/useTripBooking";

type Step = "trip" | "route" | "seats" | "passengers" | "summary" | "payment" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "trip", label: "Fahrt" },
  { key: "route", label: "Strecke" },
  { key: "seats", label: "Plätze" },
  { key: "passengers", label: "Fahrgäste" },
  { key: "summary", label: "Übersicht" },
  { key: "payment", label: "Zahlung" },
];

export default function AppCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { trips, loading } = useBookableTrips();

  const [step, setStep] = useState<Step>("trip");
  const [tripId, setTripId] = useState<string | null>(params.get("trip"));
  const [originId, setOriginId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [pax, setPax] = useState(1);
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<PassengerInput[]>([{ firstName: "", lastName: "" }]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">("card");
  const [creating, setCreating] = useState(false);
  const [booking, setBooking] = useState<{ bookingNumber: string; total: number; unitPrice: number } | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session?.user.email) setContactEmail((prev) => prev || data.session!.user.email!);
    });
  }, []);

  const trip = useMemo(() => trips.find((t) => t.id === tripId) ?? null, [trips, tripId]);
  const stops = useRouteStops(trip?.route_id);
  const origin = stops.find((s) => s.id === originId) ?? null;
  const destination = stops.find((s) => s.id === destinationId) ?? null;
  const { seats, loading: seatsLoading } = useTripSeats(
    tripId,
    trip?.bus_id,
    origin?.stop_order,
    destination?.stop_order,
  );

  useEffect(() => {
    setPassengers((prev) => {
      const next = [...prev];
      while (next.length < pax) next.push({ firstName: "", lastName: "" });
      return next.slice(0, pax);
    });
    setSeatIds((prev) => prev.slice(0, pax));
  }, [pax]);

  const estPerSeat = useMemo(() => {
    if (!origin || !destination) return 0;
    return Math.max(10, Number(destination.price_from_start) - Number(origin.price_from_start));
  }, [origin, destination]);
  const estTotal = estPerSeat * pax;

  const toggleSeat = (seatId: string) => {
    void nativeHaptic();
    setSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : prev.length >= pax
          ? prev
          : [...prev, seatId],
    );
  };

  const submitBooking = async () => {
    if (!tripId || !originId || !destinationId) return;
    setCreating(true);
    try {
      const result = await createTripBooking({
        tripId,
        originStopId: originId,
        destinationStopId: destinationId,
        seatIds,
        passengers,
        contactEmail,
        contactPhone,
        paymentMethod,
      });
      setBooking({ bookingNumber: result.bookingNumber, total: result.total, unitPrice: result.unitPrice });
      if (paymentMethod === "invoice") setStep("done");
      else setStep("payment");
    } catch (e: any) {
      toast.error(e?.message ?? "Buchung fehlgeschlagen");
    } finally {
      setCreating(false);
    }
  };

  if (authed === false) {
    return (
      <div className="px-5 py-16 text-center">
        <TicketIcon className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-bold">Anmelden zum Buchen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Damit deine Tickets sicher in „Meine Tickets“ landen, melde dich bitte an.
        </p>
        <Button className="mt-6" onClick={() => navigate("/auth?redirect=/app/checkout")}>
          Anmelden
        </Button>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="pb-32">
      <header
        className="sticky top-0 z-40 border-b border-border/50 bg-background/90 px-5 pb-3 backdrop-blur-xl"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => (stepIndex > 0 && step !== "done" ? setStep(STEPS[stepIndex - 1].key) : navigate(-1))}
            aria-label="Zurück"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Buchung</h1>
            <p className="text-xs text-muted-foreground">
              {step === "done" ? "Abgeschlossen" : `Schritt ${stepIndex + 1} von ${STEPS.length}`}
            </p>
          </div>
        </div>
        {step !== "done" && (
          <div className="mt-3 flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
        )}
      </header>

      <div className="space-y-5 px-5 pt-5">
        {/* 1 – Fahrt wählen */}
        {step === "trip" && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Fahrt & Reisedatum wählen</h2>
            {loading && <Skeleton className="h-24 rounded-2xl" />}
            {!loading && trips.length === 0 && (
              <p className="text-sm text-muted-foreground">Aktuell sind keine Fahrten buchbar.</p>
            )}
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTripId(t.id);
                  setOriginId(null);
                  setDestinationId(null);
                  setSeatIds([]);
                  setStep("route");
                }}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-colors",
                  tripId === t.id ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.title || t.route_name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(parseISO(t.departure_date), "EEEE, dd.MM.yyyy", { locale: de })}
                      {t.departure_time ? ` · ${t.departure_time.slice(0, 5)} Uhr` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{TRIP_CATEGORY_LABEL[t.trip_category] ?? "Fahrt"}</Badge>
                </div>
              </button>
            ))}
          </section>
        )}

        {/* 2 – Strecke & Personen */}
        {step === "route" && trip && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Strecke & Fahrgastanzahl</h2>
            <div>
              <Label className="text-xs">Einstieg</Label>
              <Select value={originId ?? ""} onValueChange={setOriginId}>
                <SelectTrigger className="mt-1 h-12">
                  <SelectValue placeholder="Haltestelle wählen" />
                </SelectTrigger>
                <SelectContent>
                  {stops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.city ? `, ${s.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ausstieg</Label>
              <Select value={destinationId ?? ""} onValueChange={setDestinationId}>
                <SelectTrigger className="mt-1 h-12">
                  <SelectValue placeholder="Haltestelle wählen" />
                </SelectTrigger>
                <SelectContent>
                  {stops
                    .filter((s) => !origin || s.stop_order > origin.stop_order)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.city ? `, ${s.city}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Anzahl Fahrgäste</Label>
              <div className="mt-1 flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setPax((p) => Math.max(1, p - 1))}>
                  −
                </Button>
                <span className="w-10 text-center text-lg font-semibold">{pax}</span>
                <Button variant="outline" size="icon" onClick={() => setPax((p) => Math.min(10, p + 1))}>
                  +
                </Button>
                <span className="ml-auto text-sm text-muted-foreground">
                  <Users className="mr-1 inline h-4 w-4" />
                  {estPerSeat > 0 ? `ca. ${money(estPerSeat)} p. P.` : ""}
                </span>
              </div>
            </div>
            <Button
              className="h-12 w-full"
              disabled={!originId || !destinationId}
              onClick={() => setStep("seats")}
            >
              Weiter zur Sitzplatzwahl
            </Button>
          </section>
        )}

        {/* 3 – Sitzplätze */}
        {step === "seats" && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold">
              Sitzplätze wählen ({seatIds.length}/{pax})
            </h2>
            {seatsLoading && <Skeleton className="h-52 rounded-2xl" />}
            {!seatsLoading && seats.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Für diese Fahrt ist keine Sitzplatzwahl hinterlegt – wir setzen die Plätze automatisch.
              </p>
            )}
            {seats.length > 0 && (
              <div className="rounded-2xl border border-border p-4">
                <div className="grid grid-cols-4 gap-2">
                  {seats.map((s) => {
                    const selected = seatIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        disabled={!s.available}
                        onClick={() => toggleSeat(s.id)}
                        className={cn(
                          "flex h-11 items-center justify-center rounded-lg border text-sm font-medium",
                          !s.available && "cursor-not-allowed border-border bg-muted text-muted-foreground/50 line-through",
                          s.available && !selected && "border-border",
                          selected && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        <Armchair className="mr-1 h-3.5 w-3.5" />
                        {s.seat_number}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button
              className="h-12 w-full"
              disabled={seats.length > 0 && seatIds.length !== pax}
              onClick={() => setStep("passengers")}
            >
              Weiter zu den Fahrgastdaten
            </Button>
          </section>
        )}

        {/* 4 – Fahrgastdaten */}
        {step === "passengers" && (
          <section className="space-y-5">
            <h2 className="text-base font-semibold">Fahrgastdaten</h2>
            {passengers.map((p, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">Fahrgast {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Vorname"
                    value={p.firstName}
                    onChange={(e) =>
                      setPassengers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, firstName: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    placeholder="Nachname"
                    value={p.lastName}
                    onChange={(e) =>
                      setPassengers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, lastName: e.target.value } : x)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold">Kontakt für Ticket & Bestätigung</p>
              <Input
                type="email"
                placeholder="E-Mail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Telefon (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <Button
              className="h-12 w-full"
              disabled={
                !contactEmail.includes("@") ||
                passengers.some((p) => !p.firstName.trim() || !p.lastName.trim())
              }
              onClick={() => setStep("summary")}
            >
              Weiter zur Übersicht
            </Button>
          </section>
        )}

        {/* 5 – Zusammenfassung & Zahlungsart */}
        {step === "summary" && trip && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Zusammenfassung</h2>
            <div className="space-y-2 rounded-2xl border border-border p-4 text-sm">
              <Row icon={<Bus className="h-4 w-4" />} label="Fahrt" value={trip.title || trip.route_name} />
              <Row
                icon={<CalendarDays className="h-4 w-4" />}
                label="Datum"
                value={format(parseISO(trip.departure_date), "dd.MM.yyyy", { locale: de })}
              />
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Strecke"
                value={`${origin?.name ?? "–"} → ${destination?.name ?? "–"}`}
              />
              <Row
                icon={<Users className="h-4 w-4" />}
                label="Fahrgäste"
                value={passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
              />
              {seatIds.length > 0 && (
                <Row
                  icon={<Armchair className="h-4 w-4" />}
                  label="Sitzplätze"
                  value={seats
                    .filter((s) => seatIds.includes(s.id))
                    .map((s) => s.seat_number)
                    .join(", ")}
                />
              )}
            </div>

            <div className="rounded-2xl border border-border p-4 text-sm">
              <p className="mb-2 font-semibold">Preisübersicht</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {pax} × Fahrschein {estPerSeat ? `à ${money(estPerSeat)}` : ""}
                </span>
                <span>{money(estTotal)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Gesamt</span>
                <span>{money(estTotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Der finale Preis wird beim Buchen serverseitig verbindlich berechnet.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Zahlungsart</p>
              <PayOption
                active={paymentMethod === "card"}
                onClick={() => setPaymentMethod("card")}
                icon={<CreditCard className="h-4 w-4" />}
                title="Karte / Apple Pay"
                subtitle="Direkt in der App bezahlen"
              />
              <PayOption
                active={paymentMethod === "invoice"}
                onClick={() => setPaymentMethod("invoice")}
                icon={<FileText className="h-4 w-4" />}
                title="Rechnung / Überweisung"
                subtitle="Buchung bleibt offen bis zum Zahlungseingang"
              />
            </div>

            <Button className="h-12 w-full" disabled={creating} onClick={submitBooking}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zahlungspflichtig buchen
            </Button>
          </section>
        )}

        {/* 6 – Zahlung in der App */}
        {step === "payment" && booking && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Zahlung</h2>
            <div className="rounded-2xl border border-border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buchungsnummer</span>
                <span className="font-mono font-semibold">{booking.bookingNumber}</span>
              </div>
              <div className="mt-1 flex justify-between text-base font-bold">
                <span>Zu zahlen</span>
                <span>{money(booking.total)}</span>
              </div>
            </div>
            <InAppPayment
              bookingNumber={booking.bookingNumber}
              amount={booking.total}
              onPaid={() => {
                void nativeHaptic();
                setStep("done");
              }}
              onFailed={(m) => toast.error(m)}
            />
          </section>
        )}

        {/* 7 – Bestätigung */}
        {step === "done" && booking && (
          <section className="space-y-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <div>
              <h2 className="text-xl font-bold">
                {paymentMethod === "invoice" ? "Buchung erfasst" : "Buchung bestätigt"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {paymentMethod === "invoice"
                  ? "Deine Buchung ist offen – die Tickets werden nach Zahlungseingang gültig."
                  : "Deine Tickets stehen sofort in der App bereit."}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Buchungsnummer</p>
              <p className="font-mono text-lg font-bold">{booking.bookingNumber}</p>
            </div>
            <div className="space-y-2">
              <Button className="h-12 w-full" onClick={() => navigate("/app/tickets")}>
                <TicketIcon className="mr-2 h-4 w-4" /> Zu meinen Tickets
              </Button>
              <Button variant="outline" className="h-12 w-full" onClick={() => navigate("/app")}>
                Zur Startseite
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left",
        active ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      {active && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}
