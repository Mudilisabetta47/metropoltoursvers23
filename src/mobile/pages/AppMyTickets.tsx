import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Armchair,
  CalendarDays,
  MapPin,
  Navigation,
  RefreshCw,
  Ticket as TicketIcon,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/mobile/MobileAppShell";
import { WalletPassButton } from "@/components/bookings/WalletPassButton";
import { useMyTickets, ticketStatusMeta, type MyTicket } from "@/mobile/hooks/useMyTickets";
import { money } from "@/mobile/lib/appBooking";

export default function AppMyTickets() {
  const { tickets, loading, authed, reload } = useMyTickets();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const map = new Map<string, MyTicket[]>();
    tickets.forEach((t) => {
      const key = t.booking_number ?? t.ticket_number;
      map.set(key, [...(map.get(key) ?? []), t]);
    });
    return [...map.entries()];
  }, [tickets]);

  return (
    <div className="pb-8">
      <MobileHeader
        title="Meine Tickets"
        subtitle={tickets.length ? `${tickets.length} Ticket(s)` : "Alle Fahrscheine an einem Ort"}
        right={
          <Button variant="ghost" size="icon" aria-label="Aktualisieren" onClick={() => reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <div className="space-y-5 px-5 pt-5">
        {loading && <Skeleton className="h-40 rounded-2xl" />}

        {!loading && authed === false && (
          <div className="app-card p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10">
              <TicketIcon className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-4 text-[17px] font-extrabold tracking-tight">Bitte anmelden</p>
            <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
              Melde dich an, damit deine Tickets sicher und offline verfügbar sind.
            </p>
            <Button
              className="mt-5 h-12 w-full rounded-2xl font-bold"
              onClick={() => navigate("/auth?redirect=/app/tickets")}
            >
              Anmelden
            </Button>
          </div>
        )}

        {!loading && authed && grouped.length === 0 && (
          <div className="app-card p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-muted">
              <TicketIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-[17px] font-extrabold tracking-tight">Noch keine Tickets</p>
            <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
              Sobald du gebucht hast, erscheint dein digitaler Boarding Pass hier.
            </p>
            <Button
              className="mt-5 h-12 w-full rounded-2xl font-bold"
              onClick={() => navigate("/app/checkout")}
            >
              Fahrt buchen
            </Button>
          </div>
        )}

        {grouped.map(([bookingNumber, group]) => (
          <section key={bookingNumber} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="font-mono text-xs text-muted-foreground">{bookingNumber}</p>
              {group.length > 1 && (
                <span className="text-xs text-muted-foreground">{group.length} Tickets</span>
              )}
            </div>
            {group.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: MyTicket }) {
  const [qr, setQr] = useState<string | null>(null);
  const status = ticketStatusMeta(ticket.status, ticket.payment_status);

  useEffect(() => {
    QRCode.toDataURL(ticket.ticket_number, { margin: 1, width: 512, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => undefined);
  }, [ticket.ticket_number]);

  return (
    <motion.article whileTap={{ scale: 0.99 }} className="app-card overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.className)}>
              {status.label}
            </span>
          </div>
          <h3 className="truncate text-[17px] font-extrabold tracking-tight">{ticket.trip_title}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            {ticket.passenger_name || "Fahrgast"}
            {ticket.seat_number && (
              <>
                <Armchair className="ml-2 h-3.5 w-3.5" /> Platz {ticket.seat_number}
              </>
            )}
          </p>
          {(ticket.origin || ticket.destination) && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {ticket.origin ?? "–"} → {ticket.destination ?? "–"}
            </p>
          )}
          {ticket.departure_date && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Abfahrt {format(parseISO(ticket.departure_date), "dd.MM.yyyy", { locale: de })}
              {ticket.departure_time ? ` · ${ticket.departure_time.slice(0, 5)} Uhr` : ""}
            </p>
          )}
          {ticket.return_date && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Rückreise {format(parseISO(ticket.return_date), "dd.MM.yyyy", { locale: de })}
            </p>
          )}
          <p className="pt-1 font-mono text-[11px] text-muted-foreground">{ticket.ticket_number}</p>
        </div>

        <div className="shrink-0 rounded-[20px] border border-border/60 bg-white p-2.5">
          {qr ? (
            <img src={qr} alt={`QR-Code Ticket ${ticket.ticket_number}`} className="h-24 w-24" />
          ) : (
            <Skeleton className="h-24 w-24" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border bg-muted/40 px-4 py-3">
        <WalletPassButton
          bookingId={ticket.id}
          ticketNumber={ticket.ticket_number}
          variant="outline"
          size="sm"
          bookingType="bus"
        />
        {ticket.trip_id && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/verfolge?trip=${ticket.trip_id}`}>
              <Navigation className="mr-1.5 h-3.5 w-3.5" /> Fahrt verfolgen
            </Link>
          </Button>
        )}
        {ticket.price_paid != null && (
          <span className="ml-auto text-sm font-semibold">{money(Number(ticket.price_paid))}</span>
        )}
      </div>
    </motion.article>
  );
}
