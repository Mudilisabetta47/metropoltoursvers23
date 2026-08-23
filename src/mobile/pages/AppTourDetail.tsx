import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isTourBookable,
  TOUR_NOT_BOOKABLE_TEXT,
  TOUR_NOT_BOOKABLE_TITLE,
} from "@/lib/tourAvailability";
import { useMobileTour, seatsLeft } from "@/mobile/hooks/useMobileTours";
import { money } from "@/mobile/components/TourCardMobile";

export default function AppTourDetail() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useMobileTour(tourId);
  const [dateId, setDateId] = useState<string | null>(null);

  const dates = tour?.tour_dates ?? [];
  const selected = useMemo(
    () => dates.find((d) => d.id === dateId) ?? dates[0] ?? null,
    [dates, dateId],
  );
  const left = seatsLeft(selected);
  const bookable = tour ? isTourBookable(tour) : false;

  if (isLoading) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Diese Reise wurde nicht gefunden.</p>
        <Button className="mt-4" onClick={() => navigate("/app/reisen")}>
          Zu den Reisen
        </Button>
      </div>
    );
  }

  const gallery = [tour.hero_image_url, ...(tour.gallery_images ?? []), tour.image_url].filter(
    Boolean,
  ) as string[];

  const startCheckout = () => {
    // Bestehende, serverseitig abgesicherte Buchungsstrecke wiederverwenden.
    const search = new URLSearchParams({ tourId: tour.id });
    if (selected) search.set("dateId", selected.id);
    navigate(`/tour-checkout?${search.toString()}`);
  };

  return (
    <div className="pb-28">
      {/* Hero-Galerie */}
      <div className="relative">
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(gallery.length ? gallery : ["/brand/metropol-logo.png"]).map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`${tour.destination} – Eindruck ${i + 1} der Busreise`}
              className="h-[46vh] min-h-[300px] w-full shrink-0 snap-center object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <button
          onClick={() => navigate(-1)}
          aria-label="Zurück"
          className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="-mt-8 space-y-6 px-5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            {tour.category ? <Badge variant="secondary">{tour.category}</Badge> : null}
            {!bookable && <Badge variant="outline">Demnächst buchbar</Badge>}
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight">
            {tour.destination}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[tour.location, tour.country].filter(Boolean).join(", ") || "Europa"}
          </p>
        </motion.div>

        {/* Eckdaten */}
        <div className="grid grid-cols-3 gap-2">
          <Fact icon={Clock} label="Dauer" value={tour.duration_days ? `${tour.duration_days} Tage` : "–"} />
          <Fact
            icon={Users}
            label="Plätze"
            value={left != null ? `${left} frei` : "auf Anfrage"}
          />
          <Fact
            icon={CalendarDays}
            label="Nächster Start"
            value={
              selected ? format(parseISO(selected.departure_date), "dd.MM.yy", { locale: de }) : "–"
            }
          />
        </div>

        {/* Termine */}
        {dates.length > 0 && (
          <Block title="Reisetermine">
            <div className="space-y-2">
              {dates.map((d) => {
                const active = selected?.id === d.id;
                const free = seatsLeft(d);
                return (
                  <button
                    key={d.id}
                    onClick={() => setDateId(d.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {format(parseISO(d.departure_date), "dd. MMM yyyy", { locale: de })}
                        {d.return_date
                          ? ` – ${format(parseISO(d.return_date), "dd. MMM yyyy", { locale: de })}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {free != null ? `${free} Plätze frei` : "Verfügbarkeit auf Anfrage"}
                        {d.status ? ` · ${d.status}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {money(d.price_basic ?? tour.price_from)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Block>
        )}

        {(tour.short_description || tour.description) && (
          <Block title="Über diese Reise">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {tour.short_description || tour.description}
            </p>
          </Block>
        )}

        {tour.hotel_name && (
          <Block title="Unterkunft">
            <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4">
              <BedDouble className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">{tour.hotel_name}</p>
                {tour.hotel_address && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{tour.hotel_address}</p>
                )}
              </div>
            </div>
          </Block>
        )}

        {tour.pickups?.length > 0 && (
          <Block title="Abfahrtsorte">
            <div className="space-y-2">
              {tour.pickups.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.city}
                      {p.location_name ? ` · ${p.location_name}` : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.departure_time ? `Abfahrt ${String(p.departure_time).slice(0, 5)} Uhr` : ""}
                      {p.meeting_point ? ` · ${p.meeting_point}` : ""}
                    </p>
                  </div>
                  {Number(p.surcharge) > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      +{money(Number(p.surcharge))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Block>
        )}

        {(tour.inclusions?.length > 0 || (tour.included_services ?? []).length > 0) && (
          <Block title="Enthaltene Leistungen">
            <ul className="space-y-2">
              {tour.inclusions?.map((i: any) => (
                <li key={i.id} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium">{i.title}</span>
                    {i.description && (
                      <span className="block text-xs text-muted-foreground">{i.description}</span>
                    )}
                  </span>
                </li>
              ))}
              {(tour.included_services ?? []).map((s: string) => (
                <li key={s} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {tour.extras?.length > 0 && (
          <Block title="Zusatzleistungen">
            <div className="space-y-2">
              {tour.extras.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      {e.description && (
                        <p className="truncate text-xs text-muted-foreground">{e.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{money(Number(e.price))}</span>
                </div>
              ))}
            </div>
          </Block>
        )}

        {(tour.documents_required || tour.insurance_info) && (
          <Block title="Wichtige Hinweise">
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/40 p-4">
              {tour.documents_required && (
                <p className="flex gap-2.5 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {tour.documents_required}
                </p>
              )}
              {tour.insurance_info && (
                <p className="flex gap-2.5 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {tour.insurance_info}
                </p>
              )}
            </div>
          </Block>
        )}

        {!bookable && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">{TOUR_NOT_BOOKABLE_TITLE}</p>
            <p className="mt-1 text-xs text-muted-foreground">{TOUR_NOT_BOOKABLE_TEXT}</p>
          </div>
        )}
      </div>

      {/* Sticky Buchungsleiste */}
      <div
        className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">ab pro Person</p>
            <p className="text-lg font-bold leading-tight">
              {money(selected?.price_basic ?? tour.price_from)}
            </p>
          </div>
          <Button
            className="ml-auto h-12 flex-1 rounded-2xl text-base"
            disabled={!bookable}
            onClick={startCheckout}
          >
            {bookable ? "Jetzt buchen" : "Nicht buchbar"}
            {bookable && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-base font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
