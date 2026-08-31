import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Bus, CalendarDays, Coffee, Hotel, MapPin, Star, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { isTourBookable } from "@/lib/tourAvailability";
import { MobileTour, seatsLeft } from "@/mobile/hooks/useMobileTours";

const PLACEHOLDER = "/brand/metropol-logo.png";

export const money = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
    : "auf Anfrage";

function Pill({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "brand" | "dark" | "alert";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
        tone === "light" && "bg-white/85 text-secondary backdrop-blur-md",
        tone === "brand" && "bg-primary text-primary-foreground",
        tone === "dark" && "bg-secondary/85 text-white backdrop-blur-md",
        tone === "alert" && "bg-destructive text-destructive-foreground",
      )}
    >
      {children}
    </span>
  );
}

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
  const price = money(tour.price_from ?? next?.price_basic);

  if (variant === "hero") {
    return (
      <motion.article
        whileTap={{ scale: 0.975 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="app-card-hero w-[86vw] max-w-[352px] shrink-0 snap-start overflow-hidden p-3"
      >
        <Link to={href} className="block">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[24px]">
            <img
              src={img}
              alt={`Busreise nach ${tour.destination}${tour.country ? `, ${tour.country}` : ""}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/75 via-secondary/5 to-transparent" />
            <div className="absolute left-3 top-3 flex gap-1.5">
              {tour.is_featured && <Pill tone="brand">Bestseller</Pill>}
              {!!tour.discount_percent && tour.discount_percent > 0 && (
                <Pill tone="alert">−{tour.discount_percent}%</Pill>
              )}
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/80">
                  <MapPin className="h-3 w-3" />
                  {tour.country || tour.location}
                </p>
                <h3 className="truncate text-[22px] font-extrabold leading-tight text-white">
                  {tour.destination}
                </h3>
              </div>
              {left != null && left <= 10 && left > 0 && <Pill tone="light">Nur {left} frei</Pill>}
            </div>
          </div>

          <div className="px-2 pb-1 pt-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-muted-foreground">
              <span>{tour.duration_days ? `${tour.duration_days} Tage` : "Reise"}</span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" /> 4.8
              </span>
              <span className="text-border">•</span>
              <span>{tour.category || "Busreise"}</span>
            </div>

            {tour.short_description && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {tour.short_description}
              </p>
            )}

            <div className="mt-3 flex gap-3 text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hotel className="h-3.5 w-3.5 text-primary" />
                Hotel
              </span>
              <span className="flex items-center gap-1">
                <Coffee className="h-3.5 w-3.5 text-primary" />
                Frühstück
              </span>
              <span className="flex items-center gap-1">
                <Bus className="h-3.5 w-3.5 text-primary" />
                Reisebus
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-3.5">
              <div>
                <p className="app-eyebrow">
                  {next
                    ? `Ab ${format(parseISO(next.departure_date), "dd. MMM", { locale: de })}`
                    : "Auf Anfrage"}
                </p>
                <p className="text-[22px] font-extrabold leading-none tracking-tight text-foreground">
                  {price}
                </p>
              </div>
              <span className="flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 text-[13px] font-bold text-primary-foreground">
                Ansehen <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <Link to={href} className="app-card block overflow-hidden p-3">
        <div className="flex gap-3.5">
          <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-[22px]">
            <img
              src={img}
              alt={`Reise nach ${tour.destination}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {!!tour.discount_percent && tour.discount_percent > 0 && (
              <span className="absolute left-1.5 top-1.5">
                <Pill tone="alert">−{tour.discount_percent}%</Pill>
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-[17px] font-extrabold leading-tight tracking-tight">
                  {tour.destination}
                </h3>
                {!bookable && <Pill tone="dark">Demnächst</Pill>}
              </div>
              <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="truncate">{tour.location || tour.country || "Europa"}</span>
              </p>
              {next && (
                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                  <CalendarDays className="h-3 w-3 text-primary" />
                  {format(parseISO(next.departure_date), "dd. MMM yyyy", { locale: de })}
                  {tour.duration_days ? ` · ${tour.duration_days} Tage` : ""}
                </p>
              )}
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="app-eyebrow">ab</p>
                <span className="text-[17px] font-extrabold leading-none tracking-tight text-foreground">
                  {price}
                </span>
              </div>
              {left != null && left <= 10 ? (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    left <= 3
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Users className="h-3 w-3" />
                  {left === 0 ? "ausgebucht" : `${left} frei`}
                </span>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
