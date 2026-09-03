import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Bus, Download, FileText, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoLight } from "@/components/brand/Logo";
import { useMyTrips } from "@/mobile/hooks/useMyTrips";
import { deviceStore, APP_STORE_KEYS, openNativeUrl, shareNative } from "@/mobile/lib/native";
import { WalletPassButton } from "@/components/bookings/WalletPassButton";
import { EASE } from "@/mobile/components/motion";

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

  const cancelled = trip?.status === "cancelled";
  const departure = trip?.tour_date?.departure_date;
  const ret = trip?.tour_date?.return_date;

  return (
    <div className="min-h-[100dvh] bg-secondary pb-10 text-white">
      <div
        className="flex items-center gap-3 px-5 pb-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/app/meine-reisen")}
          aria-label="Zurück"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
            Boarding Pass
          </p>
          <h1 className="text-[20px] font-extrabold leading-none">Dein Ticket</h1>
        </div>
      </div>

      {/* ------------------------------------------------- BOARDING PASS */}
      <div className="px-5 [perspective:1400px]">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 14 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-[32px] bg-background text-foreground shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* Kopf */}
          <div className="relative bg-secondary px-5 pb-5 pt-5 text-white">
            <div className="flex items-start justify-between">
              <LogoLight size="sm" />
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                  cancelled ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
                }`}
              >
                {cancelled ? "Storniert" : "Gültig"}
              </span>
            </div>

            {/* Route */}
            <div className="mt-5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  Abfahrt
                </p>
                <p className="truncate text-[22px] font-extrabold leading-tight">
                  {trip?.origin ?? "Hannover"}
                </p>
                <p className="text-[12px] font-semibold text-white/60">
                  {departure ? format(parseISO(departure), "dd.MM.yyyy", { locale: de }) : "–"}
                </p>
              </div>

              <div className="flex flex-1 flex-col items-center pb-2">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
                  className="flex w-full items-center gap-1 origin-left"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="app-divider-dashed flex-1 opacity-40" />
                  <Bus className="h-4 w-4 text-primary" />
                  <span className="app-divider-dashed flex-1 opacity-40" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </motion.span>
              </div>

              <div className="min-w-0 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  Ziel
                </p>
                <p className="truncate text-[22px] font-extrabold leading-tight">
                  {trip?.tour?.destination ?? "Busreise"}
                </p>
                <p className="text-[12px] font-semibold text-white/60">
                  {ret ? format(parseISO(ret), "dd.MM.yyyy", { locale: de }) : "Einfache Fahrt"}
                </p>
              </div>
            </div>
          </div>

          {/* Perforation */}
          <div className="relative flex items-center bg-secondary">
            <span className="-ml-4 h-8 w-8 rounded-full bg-secondary ring-8 ring-background" />
            <span className="app-divider-dashed flex-1 opacity-60" />
            <span className="-mr-4 h-8 w-8 rounded-full bg-secondary ring-8 ring-background" />
          </div>

          {/* QR */}
          <div className="flex flex-col items-center bg-background px-5 pb-6 pt-7">
            {qr ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
                src={qr}
                alt={`QR-Code für Buchung ${bookingNumber}`}
                className={`h-56 w-56 rounded-[24px] border border-border/60 bg-white p-3 ${
                  cancelled ? "opacity-30 grayscale" : ""
                }`}
              />
            ) : (
              <Skeleton className="h-56 w-56 rounded-[24px]" />
            )}
            <p className="mt-5 font-mono text-[19px] font-extrabold tracking-[0.18em]">
              {bookingNumber}
            </p>
            <p className="mt-1.5 max-w-[30ch] text-center text-[12px] leading-relaxed text-muted-foreground">
              Beim Einstieg vorzeigen – funktioniert auch ohne Internetverbindung.
            </p>
          </div>

          {/* Details */}
          <div className="border-t border-border/70 bg-muted/40 px-5 py-5">
            {loading && !trip ? (
              <Skeleton className="h-20" />
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Row label="Reisende" value={`${trip?.participants ?? 1}`} icon={<Users className="h-3 w-3" />} />
                <Row
                  label="Name"
                  value={
                    [trip?.contact_first_name, trip?.contact_last_name].filter(Boolean).join(" ") ||
                    "–"
                  }
                />
                <Row
                  label="Abfahrt"
                  value={departure ? format(parseISO(departure), "dd.MM.yyyy", { locale: de }) : "–"}
                />
                <Row
                  label="Rückreise"
                  value={ret ? format(parseISO(ret), "dd.MM.yyyy", { locale: de }) : "–"}
                />
              </dl>
            )}

            {trip && (
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <WalletPassButton
                  bookingId={trip.id}
                  ticketNumber={trip.booking_number}
                  customerEmail={trip.contact_email ?? undefined}
                  bookingType="tour"
                  className="h-12 w-full rounded-2xl"
                />
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl font-bold"
                  onClick={() =>
                    void shareNative(
                      "METROPOL TOURS Ticket",
                      `Buchung ${trip.booking_number}`,
                      `${window.location.origin}/app/ticket/${trip.booking_number}`,
                    )
                  }
                >
                  <Share2 className="mr-1.5 h-4 w-4" /> Teilen
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {(trip?.invoices ?? []).length > 0 && (
          <div className="mt-6 space-y-2.5">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              Dokumente
            </h2>
            {trip?.invoices.map((inv) => (
              <button
                key={inv.invoice_number}
                onClick={() =>
                  trip &&
                  void openNativeUrl(
                    `https://app.metours.de/meine-buchungen?booking=${encodeURIComponent(trip.booking_number)}`,
                  )
                }
                className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/5 p-4 text-left transition-transform active:scale-[0.985]"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  {inv.invoice_number}
                </span>
                <span className="flex items-center gap-1 text-[12px] font-bold text-primary">
                  <Download className="h-3.5 w-3.5" /> Öffnen
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/app/meine-reisen")}
          className="mt-7 flex w-full items-center justify-center gap-1.5 text-[13px] font-bold text-white/60"
        >
          Alle Buchungen ansehen <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-bold">{value}</dd>
    </div>
  );
}
