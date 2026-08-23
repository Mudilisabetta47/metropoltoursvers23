import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bus, CalendarDays, Coffee, Hotel, MapPin, Star, Users } from "lucide-react";
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
      <motion.article whileTap={{ scale: 0.985 }} className="w-[84vw] max-w-[350px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Link to={href} className="block">
          <div className="relative aspect-[16/11] overflow-hidden">
            <img
              src={img}
              alt={`Busreise nach ${tour.destination}${tour.country ? `, ${tour.country}` : ""}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {tour.is_featured && <Badge className="text-[10px] uppercase">★ Bestseller</Badge>}
              {!!tour.discount_percent && tour.discount_percent > 0 && <Badge variant="destructive" className="text-[10px]">−{tour.discount_percent}%</Badge>}
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-xs font-medium text-primary-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tour.country || tour.location}</span>
              {left != null && left <= 10 && left > 0 && <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">Nur noch {left}</span>}
            </div>
          </div>
          <div className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
              <span>{tour.location || tour.country}</span><span>·</span><span>{tour.duration_days ? `${tour.duration_days} Tage` : "Reise"}</span><span>·</span><span className="flex items-center text-accent"><Star className="h-3 w-3 fill-current" /> 4.8</span>
            </p>
            <h3 className="mt-2 text-xl font-bold leading-tight">{tour.destination}</h3>
            {tour.short_description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tour.short_description}</p>}
            <div className="mt-3 flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Hotel className="h-3.5 w-3.5 text-primary" />Hotel</span><span className="flex items-center gap-1"><Coffee className="h-3.5 w-3.5 text-primary" />Frühstück</span><span className="flex items-center gap-1"><Bus className="h-3.5 w-3.5 text-primary" />Reisebus</span></div>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <div><p className="text-[10px] uppercase text-muted-foreground">{next ? `Ab ${format(parseISO(next.departure_date), "dd. MMM", { locale: de })}` : "Auf Anfrage"}</p><p className="text-lg font-bold text-primary">ab {money(tour.price_from ?? next?.price_basic)}</p></div>
              <span className="text-sm font-semibold text-primary">Details ansehen</span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article whileTap={{ scale: 0.985 }}>
      <Link
        to={href}
        className="block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      >
        <div className="flex gap-3 p-3">
          <img src={img} alt={`Reise nach ${tour.destination}`} className="h-28 w-28 shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="min-w-0 flex-1 py-0.5">
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
           <div className="mt-3 flex items-end justify-between">
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
                {left === 0 ? "ausgebucht" : `${left} frei`}
              </span>
            )}
           </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
