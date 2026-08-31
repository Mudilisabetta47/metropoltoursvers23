import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { nativeHaptic } from "@/mobile/lib/native";
import { createTourBooking, money, type PassengerInput } from "@/mobile/lib/appBooking";

type Step = "details" | "passengers" | "summary" | "done";

const STEPS: Step[] = ["details", "passengers", "summary"];

export default function AppTourCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tourId = params.get("tour") ?? "";

  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<any>(null);
  const [dates, setDates] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);

  const [dateId, setDateId] = useState(params.get("date") ?? "");
  const [tariffId, setTariffId] = useState(params.get("tariff") ?? "");
  const [pickupId, setPickupId] = useState("");
  const [pax, setPax] = useState(Math.max(1, Number(params.get("pax")) || 1));
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { firstName: "", lastName: "", dateOfBirth: "" },
  ]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [creating, setCreating] = useState(false);
  const [booking, setBooking] = useState<{ bookingNumber: string; total: number } | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session?.user.email) setContactEmail((p) => p || data.session!.user.email!);
    });
  }, []);

  useEffect(() => {
    if (!tourId) return;
    (async () => {
      const [t, d, ta, pu] = await Promise.all([
        supabase.from("package_tours").select("id, destination, country, hero_image_url").eq("id", tourId).maybeSingle(),
        supabase
          .from("tour_dates")
          .select("id, departure_date, return_date, price_basic, price_smart, price_flex, price_business, status")
          .eq("tour_id", tourId)
          .order("departure_date"),
        supabase.from("tour_tariffs").select("id, name, slug, price_modifier").eq("tour_id", tourId),
        supabase
          .from("tour_routes")
          .select("id, tour_pickup_stops(id, location_name, city, surcharge, is_active)")
          .eq("tour_id", tourId)
          .eq("is_active", true),
      ]);
      setTour(t.data);
      setDates(d.data ?? []);
      setTariffs(ta.data ?? []);
      setPickups(
        ((pu.data ?? []) as any[])
          .flatMap((r) => r.tour_pickup_stops ?? [])
          .filter((s: any) => s.is_active)
          .map((s: any) => ({ ...s, name: s.location_name ?? s.city })),
      );
      setLoading(false);
    })();
  }, [tourId]);

  useEffect(() => {
    setPassengers((prev) => {
      const next = [...prev];
      while (next.length < pax) next.push({ firstName: "", lastName: "", dateOfBirth: "" });
      return next.slice(0, pax);
    });
  }, [pax]);

  const selectedDate = useMemo(() => dates.find((d) => d.id === dateId) ?? null, [dates, dateId]);
  const selectedTariff = useMemo(() => tariffs.find((t) => t.id === tariffId) ?? null, [tariffs, tariffId]);
  const selectedPickup = useMemo(() => pickups.find((p) => p.id === pickupId) ?? null, [pickups, pickupId]);

  const perPerson = useMemo(() => {
    if (!selectedDate) return 0;
    const base =
      selectedTariff?.slug === "smart"
        ? selectedDate.price_smart ?? selectedDate.price_basic
        : selectedTariff?.slug === "flex"
          ? selectedDate.price_flex ?? selectedDate.price_basic
          : selectedTariff?.slug === "business"
            ? selectedDate.price_business ?? selectedDate.price_basic
            : selectedDate.price_basic;
    return Number(base ?? 0) + Number(selectedTariff?.price_modifier ?? 0) + Number(selectedPickup?.surcharge ?? 0);
  }, [selectedDate, selectedTariff, selectedPickup]);

  const submit = async () => {
    setCreating(true);
    try {
      const result = await createTourBooking({
        tourId,
        tourDateId: dateId,
        tariffId,
        pickupStopId: pickupId || null,
        participants: pax,
        passengers,
        contactEmail,
        contactPhone,
      });
      setBooking({ bookingNumber: result.bookingNumber, total: result.total });
      void nativeHaptic();
      setStep("done");
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
        <Button className="mt-6" onClick={() => navigate("/auth?redirect=/app/tour-checkout")}>
          Anmelden
        </Button>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="pb-32">
      <header
        className="sticky top-0 z-40 border-b border-border/50 bg-background/90 px-5 pb-3 backdrop-blur-xl"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => (stepIndex > 0 && step !== "done" ? setStep(STEPS[stepIndex - 1]) : navigate(-1))}
            aria-label="Zurück"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Reise buchen</h1>
            <p className="truncate text-xs text-muted-foreground">{tour?.destination ?? ""}</p>
          </div>
        </div>
        {step !== "done" && (
          <div className="mt-3 flex gap-1">
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        )}
      </header>

      <div className="space-y-5 px-5 pt-5">
        {loading && <Skeleton className="h-40 rounded-2xl" />}

        {!loading && step === "details" && (
          <section className="space-y-4">
            <div>
              <Label className="text-xs">Reisetermin</Label>
              <Select value={dateId} onValueChange={setDateId}>
                <SelectTrigger className="mt-1 h-12">
                  <SelectValue placeholder="Termin wählen" />
                </SelectTrigger>
                <SelectContent>
                  {dates
                    .filter((d) => !["soldout", "cancelled"].includes(d.status))
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {format(parseISO(d.departure_date), "dd.MM.yyyy", { locale: de })}
                        {d.return_date ? ` – ${format(parseISO(d.return_date), "dd.MM.yyyy", { locale: de })}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {tariffs.length > 0 && (
              <div>
                <Label className="text-xs">Tarif</Label>
                <Select value={tariffId} onValueChange={setTariffId}>
                  <SelectTrigger className="mt-1 h-12">
                    <SelectValue placeholder="Tarif wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {pickups.length > 0 && (
              <div>
                <Label className="text-xs">Zustieg</Label>
                <Select value={pickupId} onValueChange={setPickupId}>
                  <SelectTrigger className="mt-1 h-12">
                    <SelectValue placeholder="Zustiegsort wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickups.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {Number(p.surcharge) > 0 ? ` (+${money(Number(p.surcharge))})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs">Reisende</Label>
              <div className="mt-1 flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setPax((p) => Math.max(1, p - 1))}>
                  −
                </Button>
                <span className="w-10 text-center text-lg font-semibold">{pax}</span>
                <Button variant="outline" size="icon" onClick={() => setPax((p) => Math.min(20, p + 1))}>
                  +
                </Button>
                {perPerson > 0 && (
                  <span className="ml-auto text-sm text-muted-foreground">{money(perPerson)} p. P.</span>
                )}
              </div>
            </div>

            <Button className="h-12 w-full" disabled={!dateId || !tariffId} onClick={() => setStep("passengers")}>
              Weiter
            </Button>
          </section>
        )}

        {step === "passengers" && (
          <section className="space-y-5">
            <h2 className="text-base font-semibold">Reisende</h2>
            {passengers.map((p, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">Reisender {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Vorname"
                    value={p.firstName}
                    onChange={(e) =>
                      setPassengers((prev) => prev.map((x, idx) => (idx === i ? { ...x, firstName: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="Nachname"
                    value={p.lastName}
                    onChange={(e) =>
                      setPassengers((prev) => prev.map((x, idx) => (idx === i ? { ...x, lastName: e.target.value } : x)))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Geburtsdatum (Pflicht)</Label>
                  <Input
                    type="date"
                    value={p.dateOfBirth ?? ""}
                    onChange={(e) =>
                      setPassengers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, dateOfBirth: e.target.value } : x)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold">Kontaktdaten</p>
              <Input type="email" placeholder="E-Mail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <Input type="tel" placeholder="Telefon (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <Button
              className="h-12 w-full"
              disabled={
                !contactEmail.includes("@") ||
                passengers.some((p) => !p.firstName.trim() || !p.lastName.trim() || !p.dateOfBirth)
              }
              onClick={() => setStep("summary")}
            >
              Weiter zur Übersicht
            </Button>
          </section>
        )}

        {step === "summary" && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Zusammenfassung</h2>
            <div className="space-y-2 rounded-2xl border border-border p-4 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Reise
                </span>
                <span className="font-medium">{tour?.destination}</span>
              </div>
              {selectedDate && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> Termin
                  </span>
                  <span className="font-medium">
                    {format(parseISO(selectedDate.departure_date), "dd.MM.yyyy", { locale: de })}
                    {selectedDate.return_date
                      ? ` – ${format(parseISO(selectedDate.return_date), "dd.MM.yyyy", { locale: de })}`
                      : ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" /> Reisende
                </span>
                <span className="font-medium">{passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Gesamt</span>
                <span>{money(perPerson * pax)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-4 text-sm">
              <p className="mb-2 font-semibold">Zahlungsart</p>
              <div className="flex items-start gap-3 rounded-xl border-2 border-primary/60 bg-primary/10 p-3">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">Rechnung</span>
                  <span className="block text-xs text-muted-foreground">
                    Zahlung bequem auf Rechnung nach der Buchung
                  </span>
                </span>
              </div>
            </div>

            <Button className="h-12 w-full" disabled={creating} onClick={submit}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbindlich buchen
            </Button>
          </section>
        )}

        {step === "done" && booking && (
          <section className="space-y-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h2 className="text-xl font-bold">Buchung bestätigt</h2>
            <p className="text-sm text-muted-foreground">
              Die Rechnung mit allen Zahlungsdetails erhältst du per E-Mail.
            </p>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Buchungsnummer</p>
              <p className="font-mono text-lg font-bold">{booking.bookingNumber}</p>
            </div>
            <Button className="h-12 w-full" onClick={() => navigate("/app/meine-reisen")}>
              Zu meinen Buchungen
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
