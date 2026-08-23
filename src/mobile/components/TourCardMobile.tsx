import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isTourBookable } from "@/lib/tourAvailability";
import { MobileTour, seatsLeft } from "@/mobile/hooks/useMobileTours";

const PLACEHOLDER = "/brand/metropol-logo.png";

export const money = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
    : "auf Anfrage";

export function TourCardMobile({
  tour,
  variant = "list",
}: {
  tour: MobileTour;
  variant?: "list" | "hero";
}) {
  const next = tour.tour_dates?.[0];
  const left = seatsLeft(next);
  const img = tour.hero_image_url || tour.image_url || PLACEHOLDER;
  const bookable = isTourBookable(tour);
  const href = `/app/reisen/${tour.slug || tour.id}`;

  if (variant === "hero") {
    return (
      <motion.div whileTap={{ scale: 0.97 }} className="w-[78vw] max-w-[320px] shrink-0">
        <Link to={href} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
            <img
              src={img}
              alt={`Busreise nach ${tour.destination}${tour.country ? `, ${tour.country}` : ""}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              {tour.category && (
                <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
                  {tour.category}
                </span>
              )}
              <h3 className="text-xl font-bold leading-tight">{tour.destination}</h3>
              <p className="mt-0.5 text-xs text-white/80">
                {tour.duration_days ? `${tour.duration_days} Tage` : ""}
                {tour.country ? ` · ${tour.country}` : ""}
              </p>
              <p className="mt-2 text-sm font-semibold">
                ab {money(tour.price_from ?? next?.price_basic)}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        to={href}
        className="flex gap-3 rounded-3xl border border-border/60 bg-card p-3 shadow-[0_6px_24px_-16px_rgba(0,0,0,0.35)]"
      >
        <img
          src={img}
          alt={`Reise nach ${tour.destination}`}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold leading-tight">{tour.destination}</h3>
            {!bookable && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Demnächst
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{tour.location || tour.country || "Europa"}</span>
          </p>
          {next && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {format(parseISO(next.departure_date), "dd. MMM yyyy", { locale: de })}
              {tour.duration_days ? ` · ${tour.duration_days} Tage` : ""}
            </p>
          )}
          <div className="mt-2 flex items-end justify-between">
            <span className="text-sm font-bold text-primary">
              ab {money(tour.price_from ?? next?.price_basic)}
            </span>
            {left != null && left <= 10 && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium",
                  left <= 3 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <Users className="h-3 w-3" />
                {left} frei
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
