import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays, ChevronRight, CreditCard, MailCheck, RefreshCw, Ticket, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MobileHeader } from "@/mobile/MobileAppShell";
import { useMyTrips, requestGuestAccess, MyTrip } from "@/mobile/hooks/useMyTrips";
import { nativeHaptic } from "@/mobile/lib/native";

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Bestätigt", variant: "default" },
  paid: { label: "Bezahlt", variant: "default" },
  pending: { label: "In Bearbeitung", variant: "secondary" },
  cancelled: { label: "Storniert", variant: "destructive" },
  completed: { label: "Abgeschlossen", variant: "outline" },
};

export default function AppMyTrips() {
  const { trips, loading, error, offline, reload } = useMyTrips();
  const [mail, setMail] = useState("");
  const [sending, setSending] = useState(false);

  const sendLink = async () => {
    if (!mail.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setSending(true);
    try {
      await requestGuestAccess(mail);
      toast.success("Zugangslink gesendet – prüfe dein Postfach.");
    } catch (e: any) {
      toast.error(e?.message ?? "Der Zugangslink konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-6">
      <MobileHeader
        title="Meine Reisen"
        subtitle={offline ? "Offline gespeicherte Tickets" : "Buchungen, Tickets & Rechnungen"}
        right={
          <button onClick={() => { void nativeHaptic("light"); void reload(); }} aria-label="Aktualisieren" className="p-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5" />
          </button>
        }
      />

      {offline && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-[22px] border border-border/60 bg-muted/50 p-3.5 text-xs font-medium text-muted-foreground">
          <WifiOff className="h-4 w-4" /> Offline-Modus – es werden gespeicherte Ticketdaten angezeigt.
        </div>
      )}

      <div className="space-y-3 px-5 pt-4">
        {loading && [0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}

        {!loading && error && trips.length > 0 && (
          <div className="rounded-[22px] border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
            {error}
          </div>
        )}

        {!loading && error && trips.length === 0 && (
          <div className="app-card p-6 text-center">
            <h2 className="text-[17px] font-extrabold tracking-tight">Buchungen konnten nicht geladen werden</h2>
            <p className="mt-1 break-words text-sm text-destructive">{error}</p>
            <Button onClick={() => void reload()} className="mt-4 h-12 w-full rounded-2xl">
              <RefreshCw className="mr-2 h-4 w-4" /> Erneut versuchen
            </Button>
          </div>
        )}


        {!loading && trips.length === 0 && (
          <div className="app-card p-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10"><Ticket className="h-7 w-7 text-primary" /></div>
            <h2 className="mt-4 text-[17px] font-extrabold tracking-tight">Noch keine Buchung hinterlegt</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Du hast ohne Konto gebucht? Wir senden dir einen sicheren Zugangslink per E-Mail.
            </p>
            <div className="mt-4 space-y-2 text-left">
              <Input
                type="email"
                inputMode="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                placeholder="E-Mail aus der Buchung"
                className="h-12 rounded-2xl"
              />
              <Button onClick={sendLink} disabled={sending} className="h-12 w-full rounded-2xl">
                <MailCheck className="mr-2 h-4 w-4" />
                {sending ? "Wird gesendet…" : "Zugangslink senden"}
              </Button>
            </div>
            {error && <p className="mt-3 text-xs text-muted-foreground">{error}</p>}
          </div>
        )}

        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip }: { trip: MyTrip }) {
  const s = statusLabel[trip.status] ?? { label: trip.status, variant: "secondary" as const };
  return (
    <Link
      to={`/app/ticket/${trip.booking_number}`}
      className="block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
    >
      {trip.tour?.hero_image_url && (
        <img
          src={trip.tour.hero_image_url}
          alt={`Reise nach ${trip.tour.destination}`}
          className="h-28 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">
            {trip.tour?.destination ?? "Buchung"}
          </h3>
          <Badge variant={s.variant} className="shrink-0">
            {s.label}
          </Badge>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {trip.tour_date?.departure_date
            ? format(parseISO(trip.tour_date.departure_date), "dd. MMM yyyy", { locale: de })
            : "Termin folgt"}
          {trip.tour_date?.return_date
            ? ` – ${format(parseISO(trip.tour_date.return_date), "dd. MMM yyyy", { locale: de })}`
            : ""}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2.5 text-xs"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" />{trip.participants} Reisende</span><span className="flex items-center justify-end gap-1.5 font-semibold"><CreditCard className="h-3.5 w-3.5 text-primary" />{trip.total_price.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span></div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="font-mono text-xs text-muted-foreground">{trip.booking_number}</span>
          <span className="flex items-center text-sm font-medium text-primary">
            Ticket öffnen <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
