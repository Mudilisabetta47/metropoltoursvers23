import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Map, { Marker, NavigationControl } from "@vis.gl/react-mapbox";
import { Bus, Clock, MapPin, Share2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/brand/Logo";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STOP_TYPE_LABELS } from "@/lib/charterTrips";
import BoardingSchedule, { platformOf } from "@/components/schedule/BoardingSchedule";
import "mapbox-gl/dist/mapbox-gl.css";

interface Props {
  tripId: string;
  registry: any;
}

/** Öffentliche Verfolgungsansicht für individuelle Fahrten (Charter, Gruppen, Sonderfahrten). */
export default function CharterTripTracker({ tripId, registry }: Props) {
  const { token } = useMapboxToken();
  const { toast } = useToast();
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [liveStops, setLiveStops] = useState<any[]>([]);
  const [liveRegistry, setLiveRegistry] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  // Karte folgt der echten Busposition
  useEffect(() => {
    if (!position || !mapRef.current) return;
    const map = mapRef.current.getMap?.() ?? mapRef.current;
    map?.easeTo?.({ center: [Number(position.lng), Number(position.lat)], duration: 1200 });
  }, [position?.lat, position?.lng]);

  // Live-Halte (inkl. außerplanmäßiger Halte) & aktuelle Verspätung regelmäßig laden
  useEffect(() => {
    let active = true;
    const loadLive = async () => {
      const [ls, reg] = await Promise.all([
        (supabase as any).rpc("get_public_trip_live_stops", { p_trip_id: tripId }),
        supabase.from("trip_registry").select("current_delay_min, delay_reason, delay_updated_at, status").eq("source_id", tripId).maybeSingle(),
      ]);
      if (!active) return;
      setLiveStops((ls?.data as any[]) || []);
      if (reg.data) setLiveRegistry(reg.data);
    };
    loadLive();
    const t = setInterval(loadLive, 30000);
    return () => { active = false; clearInterval(t); };
  }, [tripId]);

  useEffect(() => {
    (async () => {
      const [t, s, p] = await Promise.all([
        supabase.from("trips").select("id, title, departure_date, departure_time, arrival_date, arrival_time, status, trip_category").eq("id", tripId).maybeSingle(),
        supabase.from("trip_schedule_stops").select("*").eq("trip_id", tripId).order("sort_order"),
        supabase.from("bus_positions_live").select("*").eq("trip_id", tripId).maybeSingle(),
      ]);
      setTrip(t.data);
      setStops(s.data || []);
      setPosition(p.data);
      setLoading(false);
    })();
  }, [tripId]);

  useEffect(() => {
    const ch = supabase.channel(`charter-track-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_positions_live", filter: `trip_id=eq.${tripId}` }, (p: any) => setPosition(p.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` }, (p: any) => setTrip((t: any) => ({ ...t, ...p.new })))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId]);


  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: "Fahrt verfolgen", url }); return; } catch { /* ignore */ } }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link kopiert" });
  };

  if (loading) return <div className="min-h-screen bg-white"><div className="h-2 bg-emerald-500" /><div className="p-8"><Skeleton className="h-96 w-full" /></div></div>;

  if (!trip) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-2 bg-emerald-500" />
        <div className="p-12 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Fahrt nicht gefunden</h1>
          <Link to="/"><Button className="mt-6 bg-emerald-500 hover:bg-emerald-600">Zur Startseite</Button></Link>
        </div>
      </div>
    );
  }

  const positionAgeMs = position?.updated_at ? now - new Date(position.updated_at).getTime() : null;
  const liveActive = positionAgeMs != null && positionAgeMs < 5 * 60 * 1000;
  const positionAgeLabel =
    positionAgeMs == null
      ? "—"
      : positionAgeMs < 60000
        ? "gerade eben"
        : positionAgeMs < 3600000
          ? `vor ${Math.round(positionAgeMs / 60000)} Min.`
          : `am ${format(new Date(position.updated_at), "dd.MM. HH:mm")} Uhr`;

  const delay = Number(liveRegistry?.current_delay_min ?? registry?.current_delay_min ?? 0) || 0;
  const delayReason = liveRegistry?.delay_reason ?? registry?.delay_reason ?? null;
  const unscheduledStops = liveStops.filter((s: any) => s.stop_type === "unscheduled");

  const departAt = new Date(`${trip.departure_date}T${trip.departure_time || "00:00:00"}`);
  const arriveAt = trip.arrival_date ? new Date(`${trip.arrival_date}T${trip.arrival_time || "00:00:00"}`) : null;
  const beforeDeparture = now < departAt.getTime();
  const running = trip.status === "running" || (!beforeDeparture && trip.status !== "completed" && (!arriveAt || now < arriveAt.getTime()));
  const arrived = trip.status === "completed" || (!!arriveAt && now >= arriveAt.getTime() && trip.status !== "running");

  const statusLabel = beforeDeparture ? "Geplant" : running ? "Unterwegs" : arrived ? "Angekommen" : "Geplant";
  const statusClass = beforeDeparture ? "bg-blue-500" : running ? "bg-emerald-500" : "bg-zinc-500";

  const diff = departAt.getTime() - now;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const countdown = d > 0 ? `${d} Tag${d === 1 ? "" : "e"}, ${h} Std.` : h > 0 ? `${h} Std. ${m} Min.` : `${Math.max(m, 0)} Min.`;

  return (
    <div className="min-h-screen bg-white">
      <div className="h-2 bg-emerald-500" />
      <header className="border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo className="h-8" /></Link>
          <Button variant="outline" size="sm" onClick={share}><Share2 className="w-4 h-4 mr-1" />Teilen</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">{trip.title || "Ihre Fahrt"}</h1>
            <Badge className={statusClass}>{statusLabel}</Badge>
            {delay > 0 && <Badge className="bg-amber-500">+{delay} Min. Verspätung</Badge>}
          </div>
          <p className="text-zinc-500 mt-1 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Abfahrt {format(departAt, "EEEE, dd.MM.yyyy", { locale: de })} · {trip.departure_time?.slice(0, 5)} Uhr
            {arriveAt && <> · Ankunft {format(arriveAt, "dd.MM.yyyy", { locale: de })} · {trip.arrival_time?.slice(0, 5)} Uhr</>}
          </p>
          {registry?.trip_uid && <p className="text-xs font-mono text-zinc-400 mt-1">{registry.trip_uid}</p>}
          <Link to="/fahrplan" className="inline-block mt-2 text-sm font-medium text-emerald-700 underline">Kompletten Fahrplan & alle Zustiegsorte ansehen</Link>
        </div>

        {beforeDeparture && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm text-emerald-800">Die Fahrt hat noch nicht begonnen.</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">Abfahrt in {countdown}</p>
            <p className="text-xs text-emerald-700 mt-1">Die Live-Ortung wird automatisch aktiv, sobald der Bus losfährt.</p>
          </div>
        )}


        <div className="rounded-2xl overflow-hidden border border-zinc-200">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-zinc-100 bg-white">
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${liveActive && !beforeDeparture ? "text-emerald-600" : "text-zinc-500"}`}>
              <span className={`w-2 h-2 rounded-full ${liveActive && !beforeDeparture ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              {beforeDeparture
                ? `Live-GPS ab ${trip.departure_time?.slice(0, 5) ?? "Abfahrt"} Uhr`
                : liveActive ? "Live-GPS vom Fahrer" : position ? "Letzte bekannte Position" : "Noch kein GPS-Signal"}
            </span>
            {position && !beforeDeparture && (
              <span className="text-xs text-zinc-500">
                Aktualisiert {positionAgeLabel}
                {position.speed_kmh != null && ` · ${Math.round(Number(position.speed_kmh))} km/h`}
              </span>
            )}
          </div>
          <div className="h-[320px]">
            {token && position && !beforeDeparture ? (
              <Map
                ref={mapRef}
                mapboxAccessToken={token}
                initialViewState={{ longitude: position.lng, latitude: position.lat, zoom: 9 }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
              >
                <NavigationControl position="top-right" />
                {stops.filter((s: any) => s.lat != null && s.lng != null).map((s: any) => (
                  <Marker key={s.id} longitude={Number(s.lng)} latitude={Number(s.lat)}>
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-emerald-600 shadow" title={s.label} />
                  </Marker>
                ))}
                {unscheduledStops.filter((s: any) => s.lat != null && s.lng != null).map((s: any) => (
                  <Marker key={`u-${s.id}`} longitude={Number(s.lng)} latitude={Number(s.lat)}>
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" title={`Außerplanmäßiger Halt: ${s.name}`} />
                  </Marker>
                ))}
                <Marker longitude={position.lng} latitude={position.lat}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-4 transition-transform ${liveActive ? "bg-emerald-500 ring-emerald-500/30" : "bg-zinc-400 ring-zinc-400/30"}`}
                    style={position.heading != null ? { transform: `rotate(${Number(position.heading)}deg)` } : undefined}
                  >
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                </Marker>
              </Map>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 bg-zinc-50 px-6 text-center">
                <Radio className="w-6 h-6" />
                <p className="text-sm">
                  {beforeDeparture
                    ? `Die Live-Ortung wird ab ${trip.departure_time?.slice(0, 5) ?? ""} Uhr am Abfahrtstag freigeschaltet.`
                    : "Die Live-Ortung startet, sobald der Fahrer seinen Standort teilt."}
                </p>
              </div>
            )}
          </div>
        </div>


        {delay > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Aktuelle Verspätung: +{delay} Minuten
            </p>
            {delayReason && <p className="text-sm text-amber-800 mt-1">Grund: {delayReason}</p>}
            <p className="text-xs text-amber-700 mt-1">Vom Fahrer gemeldet – die Ankunftszeiten verschieben sich entsprechend.</p>
          </div>
        )}

        {unscheduledStops.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-white px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">Außerplanmäßige Halte</h2>
            <ul className="space-y-2">
              {unscheduledStops.map((s: any) => (
                <li key={s.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-900">{s.name}</p>
                    <p className="text-zinc-500 text-xs">
                      {s.actual_arrival
                        ? `Halt seit ${format(new Date(s.actual_arrival), "dd.MM. HH:mm")} Uhr`
                        : "Halt angekündigt"}
                      {s.actual_departure && ` · weiter ab ${format(new Date(s.actual_departure), "HH:mm")} Uhr`}
                    </p>
                    {s.notes && <p className="text-zinc-600 text-xs mt-0.5">{s.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <BoardingSchedule stops={stops} />


        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Reiseplan</h2>
          {stops.length === 0 ? (
            <p className="text-sm text-zinc-500">Für diese Fahrt ist noch kein Fahrplan hinterlegt.</p>
          ) : (
            <ol className="relative border-l-2 border-emerald-200 ml-3 space-y-5">
              {stops.map(s => (
                <li key={s.id} className="ml-5">
                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900">{s.label}</span>
                    <Badge variant="outline" className="text-xs">{STOP_TYPE_LABELS[s.stop_type] || s.stop_type}</Badge>
                    {platformOf(s) && <Badge className="text-xs bg-emerald-600 hover:bg-emerald-600">{platformOf(s)}</Badge>}
                  </div>
                  <div className="text-sm text-zinc-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {s.planned_arrival && <>an {format(new Date(s.planned_arrival), "dd.MM. HH:mm")}</>}
                    {s.planned_arrival && s.planned_departure && " · "}
                    {s.planned_departure && <>ab {format(new Date(s.planned_departure), "dd.MM. HH:mm")}</>}
                    {!s.planned_arrival && !s.planned_departure && "Zeit folgt"}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
