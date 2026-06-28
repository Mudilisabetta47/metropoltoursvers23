import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Map, { Marker, Source, Layer, NavigationControl } from "@vis.gl/react-mapbox";
import { ArrowLeft, Calendar, MapPin, Share2, ChevronRight, Flag, Wifi, WifiOff, XCircle, ChevronDown, ChevronUp, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import "mapbox-gl/dist/mapbox-gl.css";

export default function TrackTripPage() {
  const { tripNumber } = useParams<{ tripNumber: string }>();
  const isVerified = (() => {
    try {
      return !!tripNumber && sessionStorage.getItem(`verfolge:verified:${tripNumber}`) === "1";
    } catch {
      return false;
    }
  })();
  if (!isVerified) {
    return <Navigate to="/verfolge" replace />;
  }
  const { token } = useMapboxToken();
  const { toast } = useToast();
  const [trip, setTrip] = useState<any>(null);
  const [line, setLine] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [tripStops, setTripStops] = useState<any[]>([]);
  const [livePos, setLivePos] = useState<any>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!tripNumber) return;
    const { data: t } = await supabase.from("line_trips").select("*").eq("trip_number", tripNumber).maybeSingle();
    if (!t) { setLoading(false); return; }
    setTrip(t);
    const [l, s, ts, lp] = await Promise.all([
      supabase.from("bus_lines").select("*").eq("id", t.line_id).maybeSingle(),
      supabase.from("line_stops").select("*").eq("line_id", t.line_id).order("stop_order"),
      supabase.from("line_trip_stops").select("*").eq("trip_id", t.id),
      supabase.from("bus_positions_live").select("*").eq("trip_id", t.id).maybeSingle(),
    ]);
    setLine(l.data);
    setStops(s.data || []);
    setTripStops(ts.data || []);
    setLivePos(lp.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tripNumber]);

  // Realtime live position
  useEffect(() => {
    if (!trip?.id) return;
    const channel = supabase.channel(`trip-${trip.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_positions_live", filter: `trip_id=eq.${trip.id}` },
        (payload) => setLivePos(payload.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "line_trips", filter: `id=eq.${trip.id}` },
        (payload) => setTrip(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [trip?.id]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: `Fahrt ${tripNumber}`, url }); return; } catch {} }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link kopiert" });
  };

  if (loading) {
    return <div className="min-h-screen bg-white"><div className="h-2 bg-emerald-500" /><div className="p-8"><Skeleton className="h-96 w-full" /></div></div>;
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-2 bg-emerald-500" />
        <div className="p-12 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Fahrt nicht gefunden</h1>
          <p className="text-zinc-500 mt-2">Trip-Nummer {tripNumber} existiert nicht.</p>
          <Link to="/"><Button className="mt-6 bg-emerald-500 hover:bg-emerald-600">Zur Startseite</Button></Link>
        </div>
      </div>
    );
  }

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const routeName = `${firstStop?.city || "?"} → ${lastStop?.city || "?"}`;
  const arrivalDelayed = trip.delay_minutes > 0;
  const plannedArr = format(new Date(trip.planned_arrival), "HH:mm");
  const actualArr = format(new Date(new Date(trip.planned_arrival).getTime() + trip.delay_minutes * 60000), "HH:mm");
  const plannedDep = format(new Date(trip.planned_departure), "HH:mm");
  const actualDep = format(new Date(new Date(trip.planned_departure).getTime() + trip.delay_minutes * 60000), "HH:mm");

  // Compute bounds
  const lngs = stops.map(s => parseFloat(s.lng));
  const lats = stops.map(s => parseFloat(s.lat));
  const center: [number, number] = lngs.length ? [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2] : [10, 51];

  const routeGeoJSON: any = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: stops.map(s => [parseFloat(s.lng), parseFloat(s.lat)]) },
  };

  const statusBadge = arrivalDelayed
    ? <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-900 text-sm font-medium"><Flag className="w-4 h-4" />Um {actualArr} angekommen</div>
    : <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-900 text-sm font-medium"><Flag className="w-4 h-4" />Pünktlich um {plannedArr}</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top accent bar */}
      <div className="h-2 bg-emerald-500" />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left content */}
        <div className="w-full lg:w-[560px] p-6 lg:p-8 overflow-y-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <Link to="/" className="hover:text-zinc-900">Startseite</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/service" className="hover:text-zinc-900">Service</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="hover:text-zinc-900">Verfolge Deine Fahrt</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-emerald-600 border-b-2 border-emerald-500 font-medium">{trip.trip_number}</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link to="/"><Button variant="ghost" size="icon" className="text-zinc-700"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <span className="text-xl font-bold text-zinc-900">{trip.trip_number}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={share} className="text-zinc-700"><Share2 className="w-4 h-4 mr-1.5" />Teilen</Button>
          </div>

          {/* Route */}
          <h1 className="text-3xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
            {firstStop?.city} <span className="text-emerald-500">→</span> {lastStop?.city}
          </h1>

          {/* Date card */}
          <div className="border border-zinc-200 rounded-xl p-4 mb-3 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-zinc-600" />
            <span className="text-zinc-900 font-medium">{format(new Date(trip.service_date), "EEE, d. MMM", { locale: de })}</span>
          </div>

          {/* Boarding card */}
          <button className="w-full border border-zinc-200 rounded-xl p-4 mb-3 flex items-center gap-3 hover:bg-zinc-50 text-left">
            <MapPin className="w-5 h-5 text-zinc-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-zinc-500">Einstiegsort finden</div>
              <div className="text-zinc-900 font-medium">{firstStop?.name}{firstStop?.platform && ` (Bus stop ${firstStop.platform})`}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>

          {/* Status card */}
          <div className="border border-zinc-200 rounded-xl p-5 mb-3">
            <div className="mb-4">{statusBadge}</div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  {arrivalDelayed && <span className="text-zinc-400 line-through text-base">{plannedDep}</span>}
                  <span className="text-2xl font-bold text-zinc-900">{actualDep}</span>
                </div>
                <div className="text-sm text-zinc-600 mt-1">{firstStop?.name}{firstStop?.platform && ` (Bus stop ${firstStop.platform})`}</div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  {arrivalDelayed && <span className="text-zinc-400 line-through text-base">{plannedArr}</span>}
                  <span className="text-2xl font-bold text-zinc-900">{actualArr}</span>
                </div>
                <div className="text-sm text-zinc-600 mt-1">{lastStop?.name}</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5"><Bus className="w-4 h-4" />{line?.name?.split("·")[0] || "Bus"} • Bus {line?.code}</div>
                <div className="text-sm text-zinc-500">Richtung {lastStop?.name}</div>
              </div>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5">Reiseroute ansehen<ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>

          {/* Status legend collapsible */}
          <div className="border border-zinc-200 rounded-xl">
            <button onClick={() => setLegendOpen(!legendOpen)} className="w-full p-4 flex items-center justify-between text-left">
              <span className="text-zinc-900 font-medium">Was bedeutet der Status einer Fahrt?</span>
              {legendOpen ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            <div className="flex gap-3 px-4 pb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Wifi className="w-5 h-5 text-emerald-600" /></div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><WifiOff className="w-5 h-5 text-red-600" /></div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"><Flag className="w-5 h-5 text-zinc-700" /></div>
            </div>
            {legendOpen && (
              <div className="px-4 pb-4 space-y-2 text-sm text-zinc-600 border-t border-zinc-100 pt-3">
                <div><b className="text-emerald-700">Live verfolgbar</b> – Fahrzeug sendet aktuelle Position.</div>
                <div><b className="text-red-700">Offline</b> – Position wird gerade nicht empfangen.</div>
                <div><b className="text-red-700">Ausgefallen</b> – Fahrt wurde abgesagt.</div>
                <div><b className="text-zinc-700">Angekommen</b> – Fahrt erfolgreich beendet.</div>
              </div>
            )}
          </div>

          <div className="mt-6 text-xs text-zinc-400 flex items-center gap-2">
            <Logo className="h-5 w-auto" />
            <span>METROPOL TOURS · Live-Tracking</span>
          </div>
        </div>

        {/* Right map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 bg-zinc-100 relative">
          {token && stops.length > 0 ? (
            <Map
              mapboxAccessToken={token}
              initialViewState={{ longitude: center[0], latitude: center[1], zoom: 6 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
            >
              <NavigationControl position="top-right" />
              <Source id="route" type="geojson" data={routeGeoJSON}>
                <Layer id="route-line" type="line" paint={{ "line-color": "#00CC36", "line-width": 4, "line-dasharray": [2, 1.5] }} />
              </Source>

              {stops.map((s, i) => (
                <Marker key={s.id} longitude={parseFloat(s.lng)} latitude={parseFloat(s.lat)} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md mb-0.5">{s.city}</div>
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-lg">
                      <Flag className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </Marker>
              ))}

              {livePos && (
                <Marker longitude={parseFloat(livePos.lng)} latitude={parseFloat(livePos.lat)} anchor="center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 border-4 border-white shadow-xl flex items-center justify-center text-lg">🚌</div>
                </Marker>
              )}
            </Map>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400">Karte wird geladen…</div>
          )}
        </div>
      </div>
    </div>
  );
}
