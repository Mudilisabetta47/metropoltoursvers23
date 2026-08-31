import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Armchair,
  BedDouble,
  Bus,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Info,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [tariffId, setTariffId] = useState<string | null>(null);
  const [participants, setParticipants] = useState(2);

  const dates = tour?.tour_dates ?? [];
  const selected = useMemo(
    () => dates.find((d) => d.id === dateId) ?? dates[0] ?? null,
    [dates, dateId],
  );
  const left = seatsLeft(selected);
  const bookable = tour ? isTourBookable(tour) : false;
  const tariffs = tour?.tariffs ?? [];
  const selectedTariff = tariffs.find((tariff: any) => tariff.id === tariffId) ?? tariffs.find((tariff: any) => tariff.is_recommended) ?? tariffs[0] ?? null;
  const pricePerPerson = (selected?.price_basic ?? tour?.price_from ?? 0) + Number(selectedTariff?.price_modifier ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-64 rounded-2xl" />
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
    // Vollständig interner App-Checkout – kein Wechsel auf die Website.
    const search = new URLSearchParams({ tour: tour.id, pax: participants.toString() });
    if (selected) search.set("date", selected.id);
    if (selectedTariff) search.set("tariff", selectedTariff.id);
    navigate(`/app/tour-checkout?${search.toString()}`);
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

      <div className="-mt-8 space-y-7 px-5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Pauschalreise</Badge>
            {tour.category ? <Badge variant="secondary">{tour.category}</Badge> : null}
            <span className="flex items-center gap-1 text-sm font-semibold text-accent"><Star className="h-4 w-4 fill-current" /> 4.8</span>
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

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3">
          <Trust icon={ShieldCheck} title="Reisesicherung" detail="Insolvenzschutz inkl." />
          <Trust icon={Lock} title="Zahlung per Rechnung" detail="Bequem nach der Buchung" />
          <Trust icon={Zap} title="Sofortbestätigung" detail="Direkt per E-Mail" />
          <Trust icon={Check} title="Bestpreis" detail="Keine versteckten Kosten" />
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
                      "flex min-h-16 w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors",
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

        {(tour.highlights ?? tour.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(tour.highlights ?? tour.tags ?? []).map((highlight: string) => <Badge key={highlight} variant="secondary">#{highlight.replace(/^#/, "")}</Badge>)}
          </div>
        )}

        {(tour.itinerary ?? []).length > 0 && (
          <Block title="Reiseverlauf">
            <div className="space-y-2">
              {(tour.itinerary ?? []).map((day) => <div key={`${day.day}-${day.title}`} className="flex gap-3 rounded-xl bg-muted/50 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{day.day}</span><div><p className="text-sm font-semibold">{day.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{day.description}</p></div></div>)}
            </div>
          </Block>
        )}

        {tour.hotel_name && (
          <Block title="Unterkunft">
            <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
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
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5"
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

        <Block title="Reisekomfort">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Comfort icon={Wifi} label="WLAN" /><Comfort icon={Zap} label="Steckdosen" /><Comfort icon={Armchair} label="Komfortsitze" /><Comfort icon={Bus} label="Premium-Reisebus" />
          </div>
        </Block>

        {tariffs.length > 0 && (
          <Block title="Dein Angebot">
            <div className="space-y-4 rounded-xl border border-primary/20 bg-card p-4">
              <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">Tarif</p><Select value={selectedTariff?.id ?? ""} onValueChange={setTariffId}><SelectTrigger className="h-12 rounded-lg"><SelectValue placeholder="Tarif wählen" /></SelectTrigger><SelectContent>{tariffs.map((tariff: any) => <SelectItem key={tariff.id} value={tariff.id}>{tariff.name}{tariff.is_recommended ? " · Empfohlen" : ""}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex min-h-12 items-center gap-3"><Users className="h-5 w-5 text-primary" /><span className="flex-1 text-sm font-semibold">{participants} Reisende</span><Button size="icon" variant="outline" className="h-10 w-10" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1}><Minus className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="h-10 w-10" onClick={() => setParticipants(Math.min(left ?? 20, participants + 1))} disabled={left != null && participants >= left}><Plus className="h-4 w-4" /></Button></div>
            </div>
          </Block>
        )}

        {tour.extras?.length > 0 && (
          <Block title="Zusatzleistungen">
            <div className="space-y-2">
              {tour.extras.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5"
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
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
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
          <div className="rounded-xl border border-border bg-muted/40 p-4">
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
               {money(pricePerPerson)}
            </p>
          </div>
          <Button
             className="ml-auto h-12 flex-1 rounded-xl text-base"
             disabled={!bookable || !selected || (tariffs.length > 0 && !selectedTariff)}
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
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}

function Trust({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return <div className="flex min-w-0 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></span><span className="min-w-0"><span className="block text-xs font-semibold leading-tight">{title}</span><span className="block text-[10px] leading-tight text-muted-foreground">{detail}</span></span></div>;
}

function Comfort({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return <span className="flex min-h-10 items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary" />{label}</span>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-base font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
