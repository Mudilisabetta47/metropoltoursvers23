import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Map, { Marker, NavigationControl } from "@vis.gl/react-mapbox";
import { ArrowLeft, Bus, Clock, MapPin, Gauge, Loader2, ShieldAlert, Navigation2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format, differenceInMinutes, differenceInHours } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

interface BookingData {
  id: string;
  ticket_number: string;
  trip_id: string;
  status: string;
  trip: {
    departure_date: string;
    departure_time: string;
    arrival_time: string;
    route: { name: string };
  };
  origin_stop: { name: string; city: string };
  destination_stop: { name: string; city: string };
  seat: { seat_number: string };
}

interface Position {
  lat: number;
  lng: number;
  heading: number | null;
  speed_kmh: number | null;
  delay_minutes: number | null;
  status: string;
  updated_at: string;
}

const TRACKING_WINDOW_BEFORE_HOURS = 12;
const TRACKING_WINDOW_AFTER_HOURS = 12;

const TrackBookingPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { token: mapboxToken } = useMapboxToken();
  const mapRef = useRef<any>(null);

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // tick every 30s for ETA / "last update" labels
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Guard route: require login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/track/${bookingId}`);
    }
  }, [user, authLoading, bookingId, navigate]);

  // Load booking + initial position
  useEffect(() => {
    if (!user || !bookingId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id, ticket_number, trip_id, status,
            trip:trips(departure_date, departure_time, arrival_time, route:routes(name)),
            origin_stop:stops!bookings_origin_stop_id_fkey(name, city),
            destination_stop:stops!bookings_destination_stop_id_fkey(name, city),
            seat:seats(seat_number)
          `)
          .eq("id", bookingId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError("Buchung nicht gefunden oder kein Zugriff.");
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setBooking(data as unknown as BookingData);

        // Initial position
        const { data: pos } = await supabase
          .from("bus_positions_live")
          .select("lat, lng, heading, speed_kmh, delay_minutes, status, updated_at")
          .eq("trip_id", (data as any).trip_id)
          .maybeSingle();

        if (mounted && pos) setPosition(pos as Position);
      } catch (e: any) {
        if (mounted) setError(e.message || "Fehler beim Laden");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, bookingId]);

  // Realtime subscription
  useEffect(() => {
    if (!booking?.trip_id) return;
    const channel = supabase
      .channel(`track-${booking.trip_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_positions_live", filter: `trip_id=eq.${booking.trip_id}` },
        (payload) => {
          const p = (payload.new || payload.old) as any;
          if (p?.lat && p?.lng) setPosition(p as Position);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.trip_id]);

  // Recenter map when position arrives
  useEffect(() => {
    if (position && mapRef.current?.getMap) {
      try {
        mapRef.current.getMap().easeTo({ center: [position.lng, position.lat], zoom: 11, duration: 1200 });
      } catch {}
    }
  }, [position?.lat, position?.lng]);

  const trackingWindow = useMemo(() => {
    if (!booking) return null;
    const dep = new Date(`${booking.trip.departure_date}T${booking.trip.departure_time || "00:00"}`);
    const arr = new Date(`${booking.trip.departure_date}T${booking.trip.arrival_time || "23:59"}`);
    const opens = new Date(dep.getTime() - TRACKING_WINDOW_BEFORE_HOURS * 60 * 60 * 1000);
    const closes = new Date(arr.getTime() + TRACKING_WINDOW_AFTER_HOURS * 60 * 60 * 1000);
    return { dep, arr, opens, closes, isOpen: now >= opens && now <= closes };
  }, [booking, now]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center px-4">
          <div className="max-w-md text-center bg-card border border-border rounded-2xl p-8">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Kein Zugriff</h1>
            <p className="text-muted-foreground mb-6">{error || "Buchung nicht gefunden."}</p>
            <Button asChild>
              <Link to="/bookings">Zurück zu Meine Reisen</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColor = (s?: string) => {
    switch (s) {
      case "on_route":
      case "on_time":
        return "bg-emerald-500";
      case "delayed":
        return "bg-amber-500";
      case "stopped":
        return "bg-blue-500";
      case "incident":
        return "bg-red-500";
      default:
        return "bg-zinc-500";
    }
  };

  const delayMins = position?.delay_minutes ?? 0;
  const isLate = delayMins > 5;
  const isLive = !!position && differenceInMinutes(now, new Date(position.updated_at)) < 5;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Top bar */}
        <section className="border-b border-border bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/bookings">
                <ArrowLeft className="w-4 h-4" />
                Meine Reisen
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", isLive ? "bg-emerald-500" : "bg-zinc-400")} />
              <span className="text-sm font-medium">
                {isLive ? "Live" : position ? "Letzte Position" : "Noch keine Daten"}
              </span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Map */}
            <div className="relative h-[60vh] lg:h-[70vh] rounded-2xl overflow-hidden border border-border bg-zinc-900">
              {!trackingWindow?.isOpen ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-secondary/40 to-background">
                  <Clock className="w-14 h-14 text-primary mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Tracking noch nicht aktiv</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Die Live-Verfolgung öffnet {TRACKING_WINDOW_BEFORE_HOURS} Stunden vor Abfahrt.
                  </p>
                  {trackingWindow && (
                    <Badge variant="outline" className="mt-4">
                      Verfügbar ab {format(trackingWindow.opens, "dd.MM.yyyy HH:mm", { locale: de })}
                    </Badge>
                  )}
                </div>
              ) : !mapboxToken ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : !position ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <Bus className="w-14 h-14 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-bold mb-2">Bus ist noch nicht unterwegs</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Sobald der Fahrer die Fahrt startet, erscheint die Position hier in Echtzeit.
                  </p>
                </div>
              ) : (
                <Map
                  ref={mapRef}
                  mapboxAccessToken={mapboxToken}
                  initialViewState={{ latitude: position.lat, longitude: position.lng, zoom: 10 }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                >
                  <NavigationControl position="top-right" />
                  <Marker latitude={position.lat} longitude={position.lng} anchor="center" rotation={position.heading || 0}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative"
                    >
                      <div className={cn("absolute inset-0 rounded-full animate-ping opacity-60", statusColor(position.status))} style={{ width: 48, height: 48, top: -24, left: -24 }} />
                      <div
                        className={cn(
                          "relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-[3px] border-white",
                          statusColor(position.status)
                        )}
                      >
                        <Bus className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  </Marker>
                </Map>
              )}
            </div>

            {/* Side panel */}
            <aside className="space-y-4">
              {/* Trip card */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs font-mono">{booking.ticket_number}</Badge>
                  <span className="text-xs text-muted-foreground">Sitz {booking.seat.seat_number}</span>
                </div>
                <h2 className="text-lg font-bold mb-1">{booking.trip.route.name}</h2>
                <div className="text-sm text-muted-foreground mb-4">
                  {format(new Date(booking.trip.departure_date), "EEEE, dd. MMMM yyyy", { locale: de })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xl font-bold">{booking.trip.departure_time?.substring(0, 5)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.origin_stop.city}</div>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex-1 text-right">
                    <div className="text-xl font-bold">{booking.trip.arrival_time?.substring(0, 5)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><MapPin className="w-3 h-3" />{booking.destination_stop.city}</div>
                  </div>
                </div>
              </div>

              {/* Live status */}
              {position && trackingWindow?.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl p-5 border",
                    isLate ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {isLate ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    <h3 className="font-bold">
                      {isLate ? `${delayMins} Min Verspätung` : "Im Zeitplan"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span>{Math.round(position.speed_kmh || 0)} km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation2 className="w-4 h-4 text-muted-foreground" />
                      <span>{position.heading != null ? `${Math.round(position.heading)}°` : "—"}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Aktualisiert {formatDistanceToNow(new Date(position.updated_at), { locale: de, addSuffix: true })}
                  </div>
                </motion.div>
              )}

              {/* Privacy notice */}
              <div className="bg-muted/50 border border-border rounded-2xl p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Datenschutz</p>
                Live-Position ist nur für Reisende mit gültiger Buchung dieser Fahrt sichtbar.
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackBookingPage;
