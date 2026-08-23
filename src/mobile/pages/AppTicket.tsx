import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, Download, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LogoLight } from "@/components/brand/Logo";
import { useMyTrips } from "@/mobile/hooks/useMyTrips";
import { deviceStore, APP_STORE_KEYS } from "@/mobile/lib/native";

export default function AppTicket() {
  const { bookingNumber } = useParams();
  const navigate = useNavigate();
  const { trips, loading } = useMyTrips();
  const [qr, setQr] = useState<string | null>(null);

  const trip = useMemo(
    () => trips.find((t) => t.booking_number === bookingNumber),
    [trips, bookingNumber],
  );

  useEffect(() => {
    if (!bookingNumber) return;
    const key = `${APP_STORE_KEYS.offlineTickets}:qr:${bookingNumber}`;
    let cancelled = false;
    (async () => {
      const cached = await deviceStore.get(key);
      if (cached && !cancelled) {
        setQr(cached);
        return;
      }
      try {
        const url = await QRCode.toDataURL(bookingNumber, {
          margin: 1,
          width: 640,
          errorCorrectionLevel: "M",
        });
        if (cancelled) return;
        setQr(url);
        await deviceStore.set(key, url);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingNumber]);

  return (
    <div className="min-h-[100dvh] bg-secondary pb-8 text-secondary-foreground">
      <div
        className="flex items-center gap-3 px-5 pb-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
      >
        <button
          onClick={() => navigate("/app/meine-reisen")}
          aria-label="Zurück"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Dein Ticket</h1>
      </div>

      <div className="px-5">
        <div className="overflow-hidden rounded-2xl border border-secondary-foreground/10 bg-background text-foreground shadow-elevated">
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <LogoLight size="sm" className="mb-3" />
            <p className="text-[11px] uppercase opacity-80">Digitales Reiseticket</p>
            <p className="text-lg font-bold leading-tight">
              {trip?.tour?.destination ?? "Busreise"}
            </p>
          </div>

          <div className="flex flex-col items-center px-5 py-6">
            {qr ? (
              <img
                src={qr}
                alt={`QR-Code für Buchung ${bookingNumber}`}
                className="h-56 w-56 rounded-xl bg-background p-2"
              />
            ) : (
              <Skeleton className="h-56 w-56 rounded-2xl" />
            )}
            <p className="mt-4 font-mono text-lg font-bold tracking-wider">{bookingNumber}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Beim Einstieg vorzeigen – funktioniert auch ohne Internet.
            </p>
          </div>

          <div className="border-t border-dashed border-border px-5 py-4">
            {loading && !trip ? (
              <Skeleton className="h-20" />
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Row
                  label="Abfahrt"
                  value={
                    trip?.tour_date?.departure_date
                      ? format(parseISO(trip.tour_date.departure_date), "dd.MM.yyyy", { locale: de })
                      : "–"
                  }
                />
                <Row
                  label="Rückreise"
                  value={
                    trip?.tour_date?.return_date
                      ? format(parseISO(trip.tour_date.return_date), "dd.MM.yyyy", { locale: de })
                      : "–"
                  }
                />
                <Row
                  label="Reisende"
                  value={`${trip?.participants ?? 1}`}
                  icon={<Users className="h-3.5 w-3.5" />}
                />
                <Row
                  label="Name"
                  value={
                    [trip?.contact_first_name, trip?.contact_last_name].filter(Boolean).join(" ") ||
                    "–"
                  }
                />
              </dl>
            )}
            {trip?.status && (
              <Badge className="mt-4" variant={trip.status === "cancelled" ? "destructive" : "default"}>
                {trip.status === "cancelled" ? "Storniert – nicht gültig" : "Gültiges Ticket"}
              </Badge>
            )}
          </div>
        </div>

        {(trip?.invoices ?? []).length > 0 && (
          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold">Dokumente</h2>
            {trip!.invoices.map((inv) => (
              <div
                key={inv.invoice_number}
                className="flex items-center justify-between rounded-2xl bg-white/5 p-3.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  {inv.invoice_number}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/meine-buchungen?booking=${trip!.booking_number}`)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Öffnen
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
