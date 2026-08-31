import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Armchair,
  Bus,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Lock,
  Luggage,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { nativeHaptic } from "@/mobile/lib/native";
import {
  AnimatedPrice,
  Expand,
  FadeIn,
  Pressable,
  Shimmer,
  Stagger,
  StaggerItem,
  StepSlide,
  SuccessCheck,
} from "@/mobile/components/motion";
import {
  createTripBooking,
  getPaymentConfig,
  money,
  type AppExtra,
  type PassengerInput,
} from "@/mobile/lib/appBooking";
import {
  TRIP_CATEGORY_LABEL,
  useBookableTrips,
  useRouteStops,
  useTripSeats,
} from "@/mobile/hooks/useTripBooking";

type Step = "reise" | "sitzplatz" | "reisende" | "extras" | "pruefen";

const STEPS: { key: Step; label: string }[] = [
  { key: "reise", label: "Reise" },
  { key: "sitzplatz", label: "Sitzplatz" },
  { key: "reisende", label: "Reisende" },
  { key: "extras", label: "Extras" },
  { key: "pruefen", label: "Prüfen" },
];

const FALLBACK_EXTRAS: AppExtra[] = [
  { id: "extra_luggage", label: "Zusätzliches Gepäckstück", price: 12, perPassenger: true },
  { id: "oversize_luggage", label: "Sperrgepäck (Ski, Rad, Kinderwagen)", price: 19, perPassenger: false },
  { id: "priority", label: "Priority Boarding", price: 6.9, perPassenger: true },
  { id: "premium_seat", label: "Premium-Sitzplatz (extra Beinfreiheit)", price: 9.9, perPassenger: true },
  { id: "flex", label: "Flex-Option (kostenlose Umbuchung)", price: 14.9, perPassenger: true },
];

const EXTRA_ICON: Record<string, typeof Luggage> = {
  extra_luggage: Luggage,
  oversize_luggage: Luggage,
  priority: Zap,
  premium_seat: Armchair,
  flex: Sparkles,
};

export default function AppCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { trips, loading } = useBookableTrips();

  const [step, setStep] = useState<Step>("reise");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [tripId, setTripId] = useState<string | null>(params.get("trip"));
  const [originId, setOriginId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [pax, setPax] = useState(1);
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [lastSeat, setLastSeat] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<PassengerInput[]>([{ firstName: "", lastName: "" }]);
  const [openPassenger, setOpenPassenger] = useState(0);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [extrasCatalog, setExtrasCatalog] = useState<AppExtra[]>(FALLBACK_EXTRAS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ bookingNumber: string; total: number; unitPrice: number } | null>(null);
  const [done, setDone] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session?.user.email) setContactEmail((prev) => prev || data.session!.user.email!);
    });
  }, []);

  useEffect(() => {
    getPaymentConfig()
      .then((c) => c.extras?.length && setExtrasCatalog(c.extras))
      .catch(() => undefined);
  }, []);

  const trip = useMemo(() => trips.find((t) => t.id === tripId) ?? null, [trips, tripId]);
  const stops = useRouteStops(trip?.route_id);
  const origin = stops.find((s) => s.id === originId) ?? null;
  const destination = stops.find((s) => s.id === destinationId) ?? null;
  const { seats, loading: seatsLoading, reload: reloadSeats } = useTripSeats(
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

  /* ------------------------------------------------------------- Preise */
  const farePerSeat = useMemo(() => {
    if (!origin || !destination) return 0;
    return Math.max(10, Number(destination.price_from_start) - Number(origin.price_from_start));
  }, [origin, destination]);
  const fareTotal = farePerSeat * pax;
  const extrasTotal = useMemo(
    () =>
      selectedExtras.reduce((sum, id) => {
        const e = extrasCatalog.find((x) => x.id === id);
        if (!e) return sum;
        return sum + e.price * (e.perPassenger ? pax : 1);
      }, 0),
    [selectedExtras, extrasCatalog, pax],
  );
  const grandTotal = Number((fareTotal + extrasTotal).toFixed(2));

  /* ---------------------------------------------------------- Navigation */
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const go = (next: Step) => {
    const nextIndex = STEPS.findIndex((s) => s.key === next);
    setDirection(nextIndex >= stepIndex ? 1 : -1);
    setStep(next);
    void nativeHaptic();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    if (stepIndex > 0) go(STEPS[stepIndex - 1].key);
    else navigate(-1);
  };

  const seatsRequired = seats.length > 0;
  const stepValid: Record<Step, boolean> = {
    reise: !!tripId && !!originId && !!destinationId,
    sitzplatz: !seatsRequired || seatIds.length === pax,
    reisende:
      contactEmail.includes("@") &&
      passengers.every((p) => p.firstName.trim() && p.lastName.trim() && p.dateOfBirth),
    extras: true,
    pruefen: true,
  };

  const toggleSeat = (seatId: string) => {
    void nativeHaptic();
    setSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= pax) return [...prev.slice(1), seatId];
      return [...prev, seatId];
    });
    setLastSeat(seatId);
    setTimeout(() => setLastSeat(null), 700);
  };

  /* ------------------------------------------------------------- Buchung */
  const submitBooking = async () => {
    if (!tripId || !originId || !destinationId) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createTripBooking({
        tripId,
        originStopId: originId,
        destinationStopId: destinationId,
        seatIds,
        passengers,
        contactEmail,
        contactPhone,
        extras: selectedExtras,
      });
      setBooking({ bookingNumber: result.bookingNumber, total: result.total, unitPrice: result.unitPrice });
      void nativeHaptic();
      finish();
    } catch (e: any) {
      const msg: string = e?.message ?? "Buchung fehlgeschlagen";
      setError(msg);
      if (/Sitzplatz/i.test(msg)) {
        reloadSeats();
        go("sitzplatz");
      }
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    void nativeHaptic();
  };

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/app/meine-reisen"), 9000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  /* ------------------------------------------------------- Sonderzustände */
  if (authed === false) {
    return (
      <FadeIn className="px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/12">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Sitzung abgelaufen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Damit deine Tickets sicher in „Meine Tickets“ landen, melde dich bitte wieder an.
        </p>
        <Button className="mt-6 h-12 w-full" onClick={() => navigate("/auth?redirect=/app/checkout")}>
          Anmelden
        </Button>
      </FadeIn>
    );
  }

  if (done && booking) {
    return <SuccessScreen booking={booking} trip={trip} origin={origin?.name} destination={destination?.name} onOpenTicket={() => navigate("/app/tickets")} onHome={() => navigate("/app")} />;
  }

  const seatLabels = seats.filter((s) => seatIds.includes(s.id)).map((s) => s.seat_number);

  return (
    <div className="pb-40">
      {/* -------------------------------------------------------- Kopf */}
      <header
        className="sticky top-0 z-40 border-b border-border/50 bg-background/85 px-5 pb-3 backdrop-blur-xl"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
      >
        <div className="flex items-center gap-3">
          <Pressable
            ariaLabel="Zurück"
            onClick={back}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Pressable>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">Buchung</h1>
            <p className="text-xs text-muted-foreground">
              Schritt {stepIndex + 1} von {STEPS.length} · {STEPS[stepIndex].label}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>
      </header>

      <div className="px-5 pt-5">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <StepSlide stepKey={step} direction={direction}>
          {/* =============================================== 1 – Reise */}
          {step === "reise" && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Deine Reise</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fahrt, Strecke und Reisende wählen.</p>
              </div>

              {loading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Shimmer key={i} className="h-24" />
                  ))}
                </div>
              )}

              {!loading && trips.length === 0 && (
                <EmptyState
                  icon={<Bus className="h-6 w-6 text-primary" />}
                  title="Keine Fahrten verfügbar"
                  text="Aktuell sind keine Fahrten buchbar. Schau bald wieder vorbei oder kontaktiere unseren Service."
                />
              )}

              <Stagger className="space-y-3">
                {trips.map((t) => {
                  const active = tripId === t.id;
                  return (
                    <StaggerItem key={t.id}>
                      <Pressable
                        onClick={() => {
                          setTripId(t.id);
                          setOriginId(null);
                          setDestinationId(null);
                          setSeatIds([]);
                          void nativeHaptic();
                        }}
                        className={cn(
                          "w-full overflow-hidden rounded-3xl border p-4 text-left transition-colors",
                          active
                            ? "border-primary/60 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent shadow-[0_10px_30px_-16px_hsl(var(--primary)/0.6)]"
                            : "border-border bg-card",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{t.title || t.route_name}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(parseISO(t.departure_date), "EEE, dd.MM.yyyy", { locale: de })}
                              {t.departure_time ? (
                                <>
                                  <Clock className="ml-1 h-3.5 w-3.5" />
                                  {t.departure_time.slice(0, 5)} Uhr
                                </>
                              ) : null}
                            </p>
                          </div>
                          <Badge variant={active ? "default" : "secondary"} className="shrink-0">
                            {TRIP_CATEGORY_LABEL[t.trip_category] ?? "Fahrt"}
                          </Badge>
                        </div>
                      </Pressable>
                    </StaggerItem>
                  );
                })}
              </Stagger>

              <Expand open={!!tripId}>
                <div className="space-y-4 rounded-3xl border border-border bg-card p-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Einstieg</Label>
                    <Select value={originId ?? ""} onValueChange={setOriginId}>
                      <SelectTrigger className="mt-1 h-12 rounded-xl">
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
                    <Label className="text-xs text-muted-foreground">Ausstieg</Label>
                    <Select value={destinationId ?? ""} onValueChange={setDestinationId}>
                      <SelectTrigger className="mt-1 h-12 rounded-xl">
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
                    <Label className="text-xs text-muted-foreground">Reisende</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <Pressable
                        onClick={() => setPax((p) => Math.max(1, p - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-lg"
                      >
                        −
                      </Pressable>
                      <motion.span
                        key={pax}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-10 text-center text-lg font-bold"
                      >
                        {pax}
                      </motion.span>
                      <Pressable
                        onClick={() => setPax((p) => Math.min(10, p + 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-lg"
                      >
                        +
                      </Pressable>
                      <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {farePerSeat > 0 ? `${money(farePerSeat)} p. P.` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Expand>

              {trip && origin && destination && (
                <JourneyCard
                  trip={trip}
                  origin={origin.name}
                  destination={destination.name}
                  pax={pax}
                  seats={seatLabels}
                />
              )}
            </section>
          )}

          {/* ============================================ 2 – Sitzplatz */}
          {step === "sitzplatz" && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Sitzplatz wählen</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {seatIds.length}/{pax} Plätze gewählt
                </p>
              </div>

              {seatsLoading && <Shimmer className="h-72" />}

              {!seatsLoading && seats.length === 0 && (
                <EmptyState
                  icon={<Armchair className="h-6 w-6 text-primary" />}
                  title="Freie Platzwahl"
                  text="Für diese Fahrt ist keine feste Sitzplatzwahl hinterlegt – wir setzen die Plätze automatisch für dich."
                />
              )}

              {seats.length > 0 && (
                <FadeIn className="rounded-3xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Bus className="h-4 w-4" /> Fahrtrichtung
                    </span>
                    <div className="flex items-center gap-3">
                      <Legend className="border-border bg-card" label="frei" />
                      <Legend className="border-primary bg-primary" label="gewählt" />
                      <Legend className="border-border bg-muted" label="belegt" />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {seats.map((s, i) => {
                      const selected = seatIds.includes(s.id);
                      return (
                        <motion.button
                          key={s.id}
                          disabled={!s.available}
                          onClick={() => toggleSeat(s.id)}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(i * 0.012, 0.35), duration: 0.28 }}
                          whileTap={s.available ? { scale: 0.9 } : undefined}
                          className={cn(
                            "relative flex h-12 items-center justify-center rounded-xl border text-[13px] font-semibold transition-colors",
                            !s.available &&
                              "cursor-not-allowed border-border bg-muted text-muted-foreground/50 line-through",
                            s.available && !selected && "border-border bg-card hover:border-primary/50",
                            selected && "border-primary bg-primary text-primary-foreground",
                          )}
                        >
                          {s.seat_number}
                          <AnimatePresence>
                            {lastSeat === s.id && selected && (
                              <motion.span
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2.1, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className="pointer-events-none absolute inset-0 rounded-xl bg-primary/40"
                              />
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {seatLabels.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary"
                      >
                        <Check className="h-4 w-4" /> Platz {seatLabels.join(", ")} reserviert
                      </motion.p>
                    )}
                  </AnimatePresence>
                </FadeIn>
              )}
            </section>
          )}

          {/* ============================================ 3 – Reisende */}
          {step === "reisende" && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Reisende</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bitte genau wie im Ausweis – für Grenzkontrollen erforderlich.
                </p>
              </div>

              <Stagger className="space-y-3">
                {passengers.map((p, i) => {
                  const complete = !!(p.firstName.trim() && p.lastName.trim() && p.dateOfBirth);
                  const open = openPassenger === i;
                  return (
                    <StaggerItem key={i}>
                      <div className="overflow-hidden rounded-3xl border border-border bg-card">
                        <button
                          onClick={() => setOpenPassenger(open ? -1 : i)}
                          className="flex w-full items-center gap-3 p-4 text-left"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                              complete ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            {complete ? <Check className="h-4 w-4" /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                              {p.firstName || p.lastName ? `${p.firstName} ${p.lastName}`.trim() : `Reisende:r ${i + 1}`}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {seatLabels[i] ? `Sitzplatz ${seatLabels[i]}` : "Platz wird zugewiesen"}
                            </span>
                          </span>
                          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.25 }}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </motion.span>
                        </button>
                        <Expand open={open}>
                          <div className="space-y-3 px-4 pb-4">
                            <div className="grid grid-cols-2 gap-3">
                              <Field
                                label="Vorname"
                                value={p.firstName}
                                onChange={(v) => updatePassenger(setPassengers, i, { firstName: v })}
                              />
                              <Field
                                label="Nachname"
                                value={p.lastName}
                                onChange={(v) => updatePassenger(setPassengers, i, { lastName: v })}
                              />
                            </div>
                            <Field
                              label="Geburtsdatum"
                              type="date"
                              value={p.dateOfBirth ?? ""}
                              onChange={(v) => updatePassenger(setPassengers, i, { dateOfBirth: v })}
                            />
                            {!complete && (
                              <p className="text-xs text-muted-foreground">
                                Name und Geburtsdatum sind für das Ticket verpflichtend.
                              </p>
                            )}
                          </div>
                        </Expand>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>

              <div className="space-y-3 rounded-3xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Kontakt für Ticket & Bestätigung</p>
                <Field label="E-Mail" type="email" value={contactEmail} onChange={setContactEmail} />
                <Field label="Telefon (optional)" type="tel" value={contactPhone} onChange={setContactPhone} />
              </div>
            </section>
          )}

          {/* ============================================== 4 – Extras */}
          {step === "extras" && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Extras</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optional – jederzeit abwählbar. Der Preis aktualisiert sich sofort.
                </p>
              </div>

              {extrasCatalog.length === 0 && (
                <EmptyState
                  icon={<Sparkles className="h-6 w-6 text-primary" />}
                  title="Keine Extras verfügbar"
                  text="Für diese Fahrt sind derzeit keine Zusatzleistungen buchbar."
                />
              )}

              <Stagger className="space-y-3">
                {extrasCatalog.map((e) => {
                  const active = selectedExtras.includes(e.id);
                  const Icon = EXTRA_ICON[e.id] ?? Sparkles;
                  const price = e.price * (e.perPassenger ? pax : 1);
                  return (
                    <StaggerItem key={e.id}>
                      <Pressable
                        onClick={() => {
                          void nativeHaptic();
                          setSelectedExtras((prev) =>
                            prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id],
                          );
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-colors",
                          active ? "border-primary/60 bg-primary/8" : "border-border bg-card",
                        )}
                      >
                        <motion.span
                          animate={active ? { rotate: [0, -8, 8, 0], scale: 1.05 } : { scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl",
                            active ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{e.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {e.perPassenger ? `${money(e.price)} pro Person` : "einmalig"}
                          </span>
                        </span>
                        <span className="text-sm font-semibold">{money(price)}</span>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border",
                            active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                          )}
                        >
                          <AnimatePresence>
                            {active && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Check className="h-3.5 w-3.5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      </Pressable>
                    </StaggerItem>
                  );
                })}
              </Stagger>

              <PriceBreakdown fare={fareTotal} extras={extrasTotal} total={grandTotal} pax={pax} />
            </section>
          )}

          {/* ============================================== 6 – Prüfen */}
          {step === "pruefen" && trip && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Bestellung prüfen</h2>
                <p className="mt-1 text-sm text-muted-foreground">Bitte kontrolliere alle Angaben.</p>
              </div>

              <JourneyCard
                trip={trip}
                origin={origin?.name ?? "–"}
                destination={destination?.name ?? "–"}
                pax={pax}
                seats={seatLabels}
              />

              <div className="space-y-2 rounded-3xl border border-border bg-card p-4 text-sm">
                <p className="mb-1 font-semibold">Reisende</p>
                {passengers.map((p, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>
                      {p.firstName} {p.lastName}
                    </span>
                    <span>{seatLabels[i] ? `Platz ${seatLabels[i]}` : "Platz automatisch"}</span>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground">
                  Ticket & Bestätigung an <span className="font-medium text-foreground">{contactEmail}</span>
                </p>
              </div>

              {selectedExtras.length > 0 && (
                <div className="space-y-1.5 rounded-3xl border border-border bg-card p-4 text-sm">
                  <p className="mb-1 font-semibold">Extras</p>
                  {selectedExtras.map((id) => {
                    const e = extrasCatalog.find((x) => x.id === id);
                    if (!e) return null;
                    return (
                      <div key={id} className="flex justify-between text-muted-foreground">
                        <span>{e.label}</span>
                        <span>{money(e.price * (e.perPassenger ? pax : 1))}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-3xl border border-border bg-card p-4 text-sm">
                <p className="mb-2 font-semibold">Zahlungsart</p>
                <RadioGroup value="invoice" aria-label="Zahlungsart">
                  <label htmlFor="app-payment-invoice" className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-primary/60 bg-primary/8 p-3.5">
                    <RadioGroupItem id="app-payment-invoice" value="invoice" className="mt-0.5 shrink-0" />
                    <span>
                      <span className="block font-semibold">Rechnung</span>
                      <span className="block text-xs text-muted-foreground">Zahlung bequem auf Rechnung nach der Buchung</span>
                    </span>
                  </label>
                </RadioGroup>
              </div>


              <PriceBreakdown fare={fareTotal} extras={extrasTotal} total={grandTotal} pax={pax} />

              <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                Mit „Zahlungspflichtig buchen“ akzeptierst du unsere{" "}
                <a href="/agb" className="underline">
                  AGB
                </a>{" "}
                und{" "}
                <a href="/datenschutz" className="underline">
                  Datenschutzhinweise
                </a>
                . Stornierungen sind gemäß unseren Stornobedingungen möglich. Der endgültige Preis wird
                serverseitig verbindlich berechnet.
              </p>
              <TrustRow />
            </section>
          )}
        </StepSlide>
      </div>

      {/* -------------------------------------------- Sticky Checkout-Bar */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/92 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.9rem)" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Gesamt</p>
            <AnimatedPrice value={grandTotal} className="block text-xl font-bold leading-tight" />
          </div>
          <Button
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            disabled={!stepValid[step] || creating}
            onClick={() => (step === "pruefen" ? submitBooking() : go(STEPS[stepIndex + 1].key))}
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {step === "pruefen" ? "Zahlungspflichtig buchen" : "Weiter"}
            {step !== "pruefen" && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </motion.div>

    </div>
  );
}

/* ------------------------------------------------------------ Bausteine */

function updatePassenger(
  set: React.Dispatch<React.SetStateAction<PassengerInput[]>>,
  index: number,
  patch: Partial<PassengerInput>,
) {
  set((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <motion.div animate={{ scale: focus ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
        <Input
          type={type}
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-12 rounded-xl"
        />
      </motion.div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-3 w-3 rounded border", className)} />
      {label}
    </span>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <FadeIn className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/12">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </FadeIn>
  );
}

function JourneyCard({
  trip,
  origin,
  destination,
  pax,
  seats,
}: {
  trip: { title: string | null; route_name: string; departure_date: string; departure_time: string | null; arrival_time: string | null; trip_category: string };
  origin: string;
  destination: string;
  pax: number;
  seats: string[];
}) {
  return (
    <FadeIn className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/12 via-card to-card p-5">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{TRIP_CATEGORY_LABEL[trip.trip_category] ?? "Fahrt"}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(parseISO(trip.departure_date), "dd.MM.yyyy", { locale: de })}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-tight">{origin}</p>
          <p className="text-xs text-muted-foreground">
            {trip.departure_time ? `${trip.departure_time.slice(0, 5)} Uhr` : "Abfahrt"}
          </p>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-px w-16 origin-left bg-border"
        >
          <Bus className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 text-primary" />
        </motion.div>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-lg font-bold leading-tight">{destination}</p>
          <p className="text-xs text-muted-foreground">
            {trip.arrival_time ? `${trip.arrival_time.slice(0, 5)} Uhr` : "Ankunft"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
        <Meta icon={<Users className="h-3.5 w-3.5" />} label="Reisende" value={`${pax}`} />
        <Meta icon={<Armchair className="h-3.5 w-3.5" />} label="Plätze" value={seats.length ? seats.join(", ") : "auto"} />
        <Meta icon={<MapPin className="h-3.5 w-3.5" />} label="Linie" value={trip.title || trip.route_name} />
      </div>
    </FadeIn>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}

function PriceBreakdown({
  fare,
  extras,
  total,
  pax,
}: {
  fare: number;
  extras: number;
  total: number;
  pax: number;
}) {
  return (
    <FadeIn className="rounded-3xl border border-border bg-card p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Fahrpreis ({pax} × Ticket)</span>
        <AnimatedPrice value={fare} />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-muted-foreground">Extras</span>
        <AnimatedPrice value={extras} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-bold">
        <span>Gesamt</span>
        <AnimatedPrice value={total} className="text-lg" />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Inkl. MwSt. · Der finale Betrag wird beim Buchen serverseitig verbindlich berechnet.
      </p>
    </FadeIn>
  );
}

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl bg-muted/40 px-4 py-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Sichere Buchungsübertragung
      </span>
      <a href="tel:+4951180781106" className="flex items-center gap-1.5 underline-offset-2 hover:underline">
        <Phone className="h-3.5 w-3.5" /> +49 511 80781106
      </a>
    </div>
  );
}

/* ---------------------------------------------------------- Success-Flow */

function SuccessScreen({
  booking,
  trip,
  origin,
  destination,
  onOpenTicket,
  onHome,
}: {
  booking: { bookingNumber: string; total: number };
  trip: { title: string | null; route_name: string; departure_date: string; departure_time: string | null } | null;
  origin?: string;
  destination?: string;
  onOpenTicket: () => void;
  onHome: () => void;
}) {
  const qr = `https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(booking.bookingNumber)}`;
  return (
    <div className="px-5 pb-24" style={{ paddingTop: "calc(env(safe-area-inset-top) + 3rem)" }}>
      <SuccessCheck />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-center text-2xl font-bold tracking-tight"
      >
        Buchung erfolgreich
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-2 text-center text-sm text-muted-foreground"
      >
        Die Zahlungsinformationen erhältst du per E-Mail.
      </motion.p>

      {/* Ticket fährt ins Interface */}
      <motion.div
        initial={{ y: 120, opacity: 0, rotate: -3 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 190, damping: 22 }}
        className="mt-7 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-card"
      >
        <div className="p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Buchungsnummer</p>
          <p className="font-mono text-xl font-bold">{booking.bookingNumber}</p>
          {trip && (
            <p className="mt-3 text-sm font-semibold">
              {origin ?? trip.route_name} → {destination ?? ""}
            </p>
          )}
          {trip && (
            <p className="text-xs text-muted-foreground">
              {format(parseISO(trip.departure_date), "EEEE, dd.MM.yyyy", { locale: de })}
              {trip.departure_time ? ` · ${trip.departure_time.slice(0, 5)} Uhr` : ""}
            </p>
          )}
          <div className="mt-4 space-y-1.5 border-t border-border/60 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zu zahlen</span>
              <span className="font-bold">{money(booking.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zahlungsart</span>
              <span className="font-semibold">Rechnung</span>
            </div>
          </div>
        </div>
        <div className="relative border-t border-dashed border-border/70">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.95, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-2 p-5"
          >
            <img src={qr} alt={`QR-Code zur Buchung ${booking.bookingNumber}`} className="h-40 w-40 rounded-xl bg-white p-2" loading="lazy" />
            <p className="text-xs text-muted-foreground">Beim Einstieg scannen lassen</p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15 }}
        className="mt-6 space-y-2"
      >
        <Button className="h-12 w-full rounded-2xl" onClick={onOpenTicket}>
          <TicketIcon className="mr-2 h-4 w-4" /> Ticket öffnen
        </Button>
        <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={onHome}>
          Zum Start
        </Button>
        <p className="pt-1 text-center text-[11px] text-muted-foreground">
          Du wirst gleich automatisch zu „Meine Reisen“ weitergeleitet.
        </p>
      </motion.div>
    </div>
  );
}
