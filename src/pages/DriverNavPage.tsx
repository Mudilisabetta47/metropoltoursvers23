import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import Map, { Marker, Source, Layer } from "@vis.gl/react-mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Navigation, Check, X, Play, Coffee, Flag, AlertTriangle, Volume2, VolumeX,
  MessageSquare, Send, Loader2, MapPin, Gauge, Clock, WifiOff, ArrowUp,
  CornerUpLeft, CornerUpRight, RotateCcw, ListOrdered, Coins, Timer, Hourglass, Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { supabase } from "@/integrations/supabase/client";
import {
  DispatchOrder, useDispatchMessages, useDriverOrders, updateOrderStatus,
} from "@/hooks/useFleet";
import { OrderStop, saveRouteTolls, useOrderStops } from "@/hooks/useOrderStops";
import { useTripManifest } from "@/hooks/useTripManifest";
import { useDrivingTime } from "@/hooks/useDrivingTime";
import { formatHm } from "@/lib/driving/euDrivingRules";
import StopsPanel from "@/components/driver/StopsPanel";
import ManifestPanel from "@/components/driver/ManifestPanel";
import TollPanel from "@/components/driver/TollPanel";
import DelaySheet from "@/components/driver/DelaySheet";
import EventSheet, { DriverEventType } from "@/components/driver/EventSheet";
import DrivingTimePanel from "@/components/driver/DrivingTimePanel";
import {
  RouteResult, buildVehicleProfile, distanceToRouteMeters, etaFrom, formatDuration,
  formatKm, haversineMeters, requestRoute, speak, vehicleProfileWarnings,
} from "@/lib/navigation/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const db = supabase as any;
const ROUTE_CACHE_KEY = "metours_driver_route_cache";

type SheetTab = "stops" | "tolls" | "delay" | "event" | "duty" | "manifest";

const maneuverIcon = (type: string, modifier?: string) => {
  if (type === "arrive") return Flag;
  if (modifier?.includes("left")) return CornerUpLeft;
  if (modifier?.includes("right")) return CornerUpRight;
  if (type === "roundabout" || type === "rotary") return RotateCcw;
  return ArrowUp;
};


const DriverNavPage = () => {
  const location = useLocation();
  const { user, isDriver, isAdmin, isOffice, isLoading: authLoading } = useAuth();
  const { token } = useMapboxToken();
  const { orders, reload } = useDriverOrders(user?.id);
  const { messages, send } = useDispatchMessages(user?.id);

  const [pos, setPos] = useState<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [voice, setVoice] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [bus, setBus] = useState<any>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab | null>(null);
  const [manualTarget, setManualTarget] = useState<{ lat: number; lng: number } | null>(null);
  const lastSpoken = useRef<string>("");
  const lastPush = useRef<number>(0);
  const lastDutySpoken = useRef<string>("");
  const mapRef = useRef<any>(null);

  const activeOrder: DispatchOrder | undefined = useMemo(
    () => orders.find((o) => ["accepted", "en_route", "paused"].includes(o.status)) ?? orders.find((o) => o.status === "sent"),
    [orders],
  );
  const incoming = activeOrder?.status === "sent" ? activeOrder : undefined;

  const {
    stops, tolls, nextStop, markArrival, markDeparture, reload: reloadStops,
    addUnscheduledStop, removeUnscheduledStop,
  } = useOrderStops(activeOrder?.id);

  const { compliance, today: dutyToday, startDriving, stopDriving, setMultiDriver } =
    useDrivingTime(user?.id);
  const delayMinutes = activeOrder?.delay_minutes ?? 0;

  // Zustiegsliste: Fahrt des Tages (Auftragsdatum oder heute), live synchronisiert
  const manifestDate = useMemo(
    () => (activeOrder?.departure_at ?? new Date().toISOString()).slice(0, 10),
    [activeOrder?.departure_at],
  );
  const manifest = useTripManifest(user?.id, manifestDate);


  // Online/Offline
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Fahrzeugprofil laden
  useEffect(() => {
    if (!activeOrder?.bus_id) { setBus(null); return; }
    db.from("buses").select("*").eq("id", activeOrder.bus_id).maybeSingle().then(({ data }: any) => setBus(data));
  }, [activeOrder?.bus_id]);

  // GPS-Watch + Realtime-Push in fleet_positions
  useEffect(() => {
    if (!user || !("geolocation" in navigator)) {
      setGpsError("Keine GPS-Unterstützung auf diesem Gerät");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (p) => {
        setGpsError(null);
        const next = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          speed: p.coords.speed != null && p.coords.speed >= 0 ? p.coords.speed * 3.6 : 0,
          heading: p.coords.heading ?? 0,
        };
        setPos(next);

        if (Date.now() - lastPush.current < 5000) return;
        lastPush.current = Date.now();
        const status = activeOrder
          ? activeOrder.status === "en_route" ? "en_route"
            : activeOrder.status === "paused" ? "break"
            : activeOrder.status === "arrived" ? "arrived" : "accepted"
          : "offline";
        await db.from("fleet_positions").upsert(
          {
            driver_user_id: user.id,
            bus_id: activeOrder?.bus_id ?? null,
            order_id: activeOrder?.id ?? null,
            latitude: next.lat,
            longitude: next.lng,
            heading: next.heading,
            speed_kmh: Math.round(next.speed),
            accuracy_m: p.coords.accuracy,
            status,
            source: "driver_app",
            is_demo: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "driver_user_id" },
        );
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, activeOrder?.id, activeOrder?.status, activeOrder?.bus_id]);

  // Routenberechnung (echte Mapbox Directions mit Traffic, inkl. Haltestellen und Maut)
  const computeRoute = useCallback(async () => {
    if (!token || !activeOrder?.destination_lat) return;
    const start = pos ?? (activeOrder.origin_lat != null ? { lat: Number(activeOrder.origin_lat), lng: Number(activeOrder.origin_lng), speed: 0, heading: 0 } : null);
    if (!start) return;
    try {
      // Offene Zwischenhalte werden als Wegpunkte in der geplanten Reihenfolge angefahren.
      const openStops = stops
        .filter((s) => !s.actual_departure && s.lat != null && s.lng != null)
        .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
      const legacyWaypoints = openStops.length
        ? []
        : (activeOrder.waypoints ?? []).map((w) => ({ lat: Number(w.lat), lng: Number(w.lng) }));

      const destination = { lat: Number(activeOrder.destination_lat), lng: Number(activeOrder.destination_lng) };
      const rawPoints = manualTarget
        ? [{ lat: start.lat, lng: start.lng }, manualTarget]
        : [
            { lat: start.lat, lng: start.lng },
            ...openStops,
            ...legacyWaypoints,
            destination,
          ];

      // Aufeinanderfolgende identische Koordinaten entfernen (z. B. Ziel-Halt + Zielpunkt),
      // sonst lehnt die Mapbox Directions API die Anfrage ab.
      const samePoint = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
        Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5;
      const points = rawPoints.filter(
        (p, i) => i === 0 || !samePoint(p, rawPoints[i - 1]),
      );


      const r = await requestRoute(token, points, { vehicleProfile: buildVehicleProfile(bus) });
      setRoute(r);
      setStepIndex(0);
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify({ orderId: activeOrder.id, route: r }));
      await db.from("dispatch_orders").update({
        distance_km: r.distanceKm,
        duration_min: r.durationMin,
        eta: new Date(Date.now() + r.durationMin * 60000).toISOString(),
      }).eq("id", activeOrder.id);
      try {
        await saveRouteTolls(activeOrder.id, r.tolls, r.tollCost, r.tollDataAvailable);
        reloadStops();
      } catch {
        /* Mautdaten sind optional – Navigation laeuft weiter */
      }
    } catch (e: any) {
      // Offline-Fallback: zuletzt berechnete Route aus dem Cache
      const cached = localStorage.getItem(ROUTE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.orderId === activeOrder.id) { setRoute(parsed.route); return; }
      }
      toast.error("Route konnte nicht berechnet werden");
    }
  }, [token, activeOrder, pos, bus, stops, manualTarget, reloadStops]);


  useEffect(() => {
    if (activeOrder && ["accepted", "en_route", "paused"].includes(activeOrder.status) && !route) computeRoute();
  }, [activeOrder?.id, activeOrder?.status, computeRoute, route]);

  // Routenänderung aus dem OPS Center: sichtbar + hörbar übernehmen
  const routeVersionRef = useRef<{ orderId: string; version: number } | null>(null);
  useEffect(() => {
    if (!activeOrder) return;
    const version = activeOrder.route_version ?? 1;
    const prev = routeVersionRef.current;
    routeVersionRef.current = { orderId: activeOrder.id, version };
    if (!prev || prev.orderId !== activeOrder.id || version <= prev.version) return;
    toast.info(activeOrder.route_note || "Neue Route vom OPS Center.", { duration: 8000 });
    speak("Neue Route vom OPS Center.", voice);
    setStepIndex(0);
    setRoute(null);
    computeRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrder?.id, activeOrder?.route_version]);


  // Fortschritt, Off-Route-Neuberechnung, Sprachführung
  useEffect(() => {
    if (!navigating || !route || !pos || !activeOrder) return;

    const off = distanceToRouteMeters(pos, route.geometry);
    if (off > 80 && online) {
      toast.info("Neuberechnung der Route …");
      computeRoute();
      return;
    }

    // naechsten Schritt bestimmen
    let idx = stepIndex;
    while (idx < route.steps.length - 1) {
      const s = route.steps[idx];
      const d = haversineMeters(pos, { lat: s.location[1], lng: s.location[0] });
      if (d < 40) idx += 1; else break;
    }
    if (idx !== stepIndex) setStepIndex(idx);

    const step = route.steps[idx];
    if (step) {
      const dist = haversineMeters(pos, { lat: step.location[1], lng: step.location[0] });
      const announcement = step.voiceInstruction ?? step.instruction;
      if (dist < 250 && announcement && lastSpoken.current !== announcement) {
        lastSpoken.current = announcement;
        speak(announcement, voice);
      }
    }

    const dest = { lat: Number(activeOrder.destination_lat), lng: Number(activeOrder.destination_lng) };
    const remaining = haversineMeters(pos, dest) / 1000;
    const progress = route.distanceKm > 0 ? Math.min(100, Math.round((1 - remaining / route.distanceKm) * 100)) : 0;
    if (progress >= 0 && progress % 5 === 0) {
      db.from("dispatch_orders").update({ progress_percent: Math.max(0, progress) }).eq("id", activeOrder.id);
    }
  }, [pos, navigating, route, stepIndex, voice, activeOrder, computeRoute, online]);

  const remainingKm = useMemo(() => {
    if (!route || !activeOrder?.destination_lat) return null;
    if (!pos) return route.distanceKm;
    return haversineMeters(pos, { lat: Number(activeOrder.destination_lat), lng: Number(activeOrder.destination_lng) }) / 1000;
  }, [route, pos, activeOrder]);

  const remainingMin = useMemo(() => {
    if (!route || remainingKm == null || route.distanceKm === 0) return route?.durationMin ?? null;
    return Math.round(route.durationMin * (remainingKm / route.distanceKm));
  }, [route, remainingKm]);

  const currentMaxspeed = useMemo(() => {
    if (!route?.maxspeeds?.length) return null;
    const i = Math.min(stepIndex * 3, route.maxspeeds.length - 1);
    return route.maxspeeds[i] ?? null;
  }, [route, stepIndex]);

  // Lenkzeit-Ansage (nur bei aktiver Navigation, jede Meldung nur einmal)
  useEffect(() => {
    if (!navigating || !compliance.announcement) return;
    if (lastDutySpoken.current === compliance.announcement) return;
    lastDutySpoken.current = compliance.announcement;
    speak(compliance.announcement, voice);
    toast.warning(compliance.announcement, { duration: 10000 });
  }, [compliance.announcement, navigating, voice]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); reload(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  /** Fahrtrelevantes Ereignis mit GPS-Stempel protokollieren. */
  const logEvent = useCallback(
    async (eventType: string, payload: { reason?: string; note?: string; delay?: number; stopId?: string } = {}) => {
      if (!user) return;
      await db.from("driver_events").insert({
        driver_user_id: user.id,
        order_id: activeOrder?.id ?? null,
        stop_id: payload.stopId ?? null,
        event_type: eventType,
        delay_minutes: payload.delay ?? null,
        reason: payload.reason ?? null,
        note: payload.note?.trim() || null,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        speed_kmh: pos ? Math.round(pos.speed) : null,
      });
    },
    [user, activeOrder?.id, pos],
  );

  const acceptOrder = () => activeOrder && act(async () => {
    await updateOrderStatus(activeOrder.id, "accepted");
    await logEvent("order_accepted");
    toast.success("Auftrag angenommen");
    speak("Auftrag angenommen", voice);
  });

  const rejectOrder = () => activeOrder && act(async () => {
    const reason = window.prompt("Grund für die Ablehnung?") ?? "";
    await updateOrderStatus(activeOrder.id, "rejected", { reject_reason: reason });
    toast.success("Auftrag abgelehnt");
  });

  const startNav = () => activeOrder && act(async () => {
    await updateOrderStatus(activeOrder.id, "en_route");
    await startDriving();
    await computeRoute();
    await logEvent("driving_start");
    setNavigating(true);
    speak("Navigation gestartet", voice);
  });

  const pauseNav = () => activeOrder && act(async () => {
    await updateOrderStatus(activeOrder.id, "paused");
    await stopDriving({ startBreak: true });
    await logEvent("break_start");
    setNavigating(false);
    speak("Pause gestartet", voice);
  });

  const arrived = () => activeOrder && act(async () => {
    await updateOrderStatus(activeOrder.id, "arrived");
    await stopDriving();
    await logEvent("arrived");
    setNavigating(false);
    setRoute(null);
    setManualTarget(null);
    speak("Ziel erreicht", voice);
    toast.success("Ankunft gemeldet");
  });

  /** Verspätung melden: Auftrag, Ereignisprotokoll und Zentrale in einem Schritt. */
  const submitDelay = (minutes: number, reason: string, note: string) =>
    activeOrder && user && act(async () => {
      await db.from("dispatch_orders")
        .update({ delay_minutes: minutes, delay_reason: minutes > 0 ? reason : null })
        .eq("id", activeOrder.id);
      await logEvent("delay", { delay: minutes, reason, note });
      await send(
        minutes > 0
          ? `⏱️ Verspätung ${minutes} min – ${reason}${note.trim() ? ` (${note.trim()})` : ""}`
          : "✅ Verspätung aufgeholt, wieder im Plan",
        user.id,
        "driver",
        activeOrder.id,
      );
      toast.success(minutes > 0 ? `Verspätung von ${minutes} min gemeldet` : "Als pünktlich gemeldet");
      setSheetTab(null);
    });

  const submitEvent = (type: DriverEventType, note: string) =>
    user && act(async () => {
      await logEvent(type, { note });
      if (activeOrder) {
        await send(`📍 Ereignis: ${type}${note.trim() ? ` – ${note.trim()}` : ""}`, user.id, "driver", activeOrder.id);
      }
      toast.success("Ereignis protokolliert");
      setSheetTab(null);
    });

  const stopArrive = (stopId: string) =>
    act(async () => {
      await markArrival(stopId);
      await logEvent("stop_arrival", { stopId });
    });

  const stopDepart = (stopId: string) =>
    act(async () => {
      await markDeparture(stopId);
      await logEvent("stop_departure", { stopId });
      setRoute(null);
    });

  /** Außerplanmäßigen Halt anlegen – inkl. GPS, Ereignisprotokoll und Meldung an die Zentrale. */
  const addUnscheduled = ({ name, notes, useGps }: { name: string; notes: string; useGps: boolean }) =>
    act(async () => {
      if (!activeOrder) throw new Error("Kein aktiver Fahrauftrag");
      const stop = await addUnscheduledStop({
        name,
        notes,
        lat: useGps ? pos?.lat ?? null : null,
        lng: useGps ? pos?.lng ?? null : null,
      });
      await logEvent("unscheduled_stop", { reason: name, note: notes, stopId: stop?.id });
      if (user) {
        await send(
          `🟠 Außerplanmäßiger Halt: ${name}${notes.trim() ? ` – ${notes.trim()}` : ""}`,
          user.id,
          "driver",
          activeOrder.id,
        );
      }
      speak(`Außerplanmäßiger Halt ${name} gemeldet`, voice);
      toast.success("Halt angelegt und an die Zentrale gemeldet");
    });

  const removeUnscheduled = (stopId: string) =>
    act(async () => {
      await removeUnscheduledStop(stopId);
      toast.success("Halt entfernt");
    });

  const navigateToStop = (stop: OrderStop) => {
    if (stop.lat == null || stop.lng == null) return;
    setManualTarget({ lat: Number(stop.lat), lng: Number(stop.lng) });
    setRoute(null);
    setSheetTab(null);
    toast.info(`Neues Zwischenziel: ${stop.name}`);
  };


  const reportProblem = () => activeOrder && user && act(async () => {
    const text = window.prompt("Was ist das Problem?") ?? "";
    if (!text.trim()) return;
    await logEvent("problem", { note: text });
    await send(`⚠️ PROBLEM: ${text}`, user.id, "driver", activeOrder.id);
    toast.success("Zentrale informiert");
  });


  const sendChat = async () => {
    if (!chatInput.trim() || !user) return;
    await send(chatInput, user.id, "driver", activeOrder?.id ?? null);
    setChatInput("");
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0a0d13] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isDriver && !isAdmin && !isOffice) return <Navigate to="/" replace />;

  const step = route?.steps[stepIndex];
  const StepIcon = step ? maneuverIcon(step.maneuver, step.modifier) : Navigation;
  const stepDistance = step && pos ? haversineMeters(pos, { lat: step.location[1], lng: step.location[0] }) : null;

  return (
    <div className="fixed inset-0 bg-[#0a0d13] flex flex-col">
      {/* Kopfzeile: Auftrag */}
      <div className="shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-zinc-400">{activeOrder ? activeOrder.order_number : "Fahrer-Navi"}</p>
          <p className="text-base font-semibold text-white truncate">
            {activeOrder ? activeOrder.title : "Kein aktiver Auftrag"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {delayMinutes > 0 && (
            <Badge className="bg-amber-500 text-black font-semibold">+{delayMinutes} min</Badge>
          )}
          {!online && <Badge className="bg-amber-500/20 text-amber-300"><WifiOff className="w-3 h-3 mr-1" />Offline</Badge>}
          <Button variant="ghost" size="icon" className="text-zinc-300 h-11 w-11" onClick={() => setVoice((v) => !v)}>
            {voice ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-300 h-11 w-11 relative" onClick={() => setChatOpen((c) => !c)}>
            <MessageSquare className="w-6 h-6" />
            {messages.some((m) => m.sender_role === "dispatcher" && !m.read_at) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </Button>
        </div>
      </div>

      {/* Nächster Halt inkl. erwarteter Ankunft */}
      {nextStop && (
        <button
          onClick={() => setSheetTab("stops")}
          className="shrink-0 w-full text-left bg-zinc-800/80 border-b border-zinc-700 px-4 py-2 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-400">Nächster Halt</p>
            <p className="text-sm font-semibold text-white truncate">{nextStop.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={cn("text-lg font-bold", delayMinutes > 0 ? "text-amber-300" : "text-emerald-400")}>
              {nextStop.planned_arrival
                ? new Date(new Date(nextStop.planned_arrival).getTime() + delayMinutes * 60000)
                    .toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
                : "–"}
            </p>
            <p className="text-[10px] text-zinc-400">
              {stops.filter((s) => !s.actual_departure).length} von {stops.length} offen
            </p>
          </div>
        </button>
      )}


      {/* Neuer Auftrag */}
      {incoming && (
        <div className="shrink-0 bg-emerald-600 px-4 py-4 animate-pulse-slow">
          <p className="text-sm text-white/90">Neuer Fahrauftrag von der Zentrale</p>
          <p className="text-lg font-bold text-white">{incoming.title}</p>
          <p className="text-sm text-white/90 truncate">{incoming.origin_address} → {incoming.destination_address}</p>
          {incoming.departure_at && (
            <p className="text-sm text-white/90">Abfahrt: {new Date(incoming.departure_at).toLocaleString("de-DE")}</p>
          )}
          <div className="flex gap-3 mt-3">
            <Button className="flex-1 h-14 text-base bg-white text-emerald-700 hover:bg-white/90" onClick={acceptOrder} disabled={busy}>
              <Check className="w-6 h-6 mr-2" /> Annehmen
            </Button>
            <Button variant="outline" className="flex-1 h-14 text-base border-white/60 text-white hover:bg-white/10" onClick={rejectOrder} disabled={busy}>
              <X className="w-6 h-6 mr-2" /> Ablehnen
            </Button>
          </div>
        </div>
      )}

      {/* Abbiegehinweis */}
      {navigating && step && (
        <div className="shrink-0 bg-emerald-700 px-4 py-3 flex items-center gap-4">
          <StepIcon className="w-12 h-12 text-white shrink-0" />
          <div className="min-w-0">
            {stepDistance != null && <p className="text-2xl font-bold text-white">{formatKm(stepDistance / 1000)}</p>}
            <p className="text-base text-white/95 truncate">{step.instruction}</p>
          </div>
        </div>
      )}

      {/* Karte */}
      <div className="flex-1 relative">
        {token ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={token}
            initialViewState={{ latitude: pos?.lat ?? 53.0793, longitude: pos?.lng ?? 8.8017, zoom: navigating ? 15 : 11 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/navigation-night-v1"
            attributionControl={false}
          >
            {route && (
              <Source id="nav-route" type="geojson" data={{ type: "Feature", geometry: route.geometry, properties: {} }}>
                <Layer id="nav-casing" type="line" paint={{ "line-color": "#064e3b", "line-width": 12 }} layout={{ "line-cap": "round", "line-join": "round" }} />
                <Layer id="nav-line" type="line" paint={{ "line-color": "#00CC36", "line-width": 7 }} layout={{ "line-cap": "round", "line-join": "round" }} />
              </Source>
            )}
            {stops
              .filter((s) => s.lat != null && s.lng != null && s.stop_type !== "destination")

              .map((s, i) => (
                <Marker key={s.id} latitude={Number(s.lat)} longitude={Number(s.lng)} anchor="bottom">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-zinc-900 shadow-lg",
                      s.actual_departure ? "bg-zinc-600 text-zinc-300" : "bg-emerald-500 text-black",
                    )}
                  >
                    {i + 1}
                  </div>
                </Marker>
              ))}
            {tolls
              .filter((t) => t.lat != null && t.lng != null)
              .map((t) => (
                <Marker key={t.id} latitude={Number(t.lat)} longitude={Number(t.lng)} anchor="center">
                  <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-zinc-900 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5 text-black" />
                  </div>
                </Marker>
              ))}
            {activeOrder?.destination_lat && (
              <Marker latitude={Number(activeOrder.destination_lat)} longitude={Number(activeOrder.destination_lng)} anchor="bottom">
                <MapPin className="w-9 h-9 text-red-500" fill="#ef4444" />
              </Marker>
            )}

            {pos && (
              <Marker latitude={pos.lat} longitude={pos.lng} anchor="center">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-lg" style={{ transform: `rotate(${pos.heading}deg)` }} />
              </Marker>
            )}
          </Map>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
        )}

        {gpsError && (
          <div className="absolute top-3 left-3 right-3 bg-red-500/90 text-white text-sm rounded-lg px-3 py-2">
            GPS: {gpsError}
          </div>
        )}

        {/* Tachometer / Tempolimit */}
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <div className="w-20 h-20 rounded-full bg-zinc-900/90 border-2 border-zinc-700 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{Math.round(pos?.speed ?? 0)}</span>
            <span className="text-[10px] text-zinc-400">km/h</span>
          </div>
          {currentMaxspeed && (
            <div className="w-16 h-16 rounded-full bg-white border-[5px] border-red-600 flex items-center justify-center">
              <span className="text-xl font-bold text-black">{currentMaxspeed}</span>
            </div>
          )}
        </div>

        {vehicleProfileWarnings(buildVehicleProfile(bus)).length > 0 && (
          <div className="absolute top-3 right-3 max-w-[240px] bg-amber-500/90 text-black text-xs rounded-lg px-3 py-2 space-y-1">
            {vehicleProfileWarnings(buildVehicleProfile(bus)).map((w, i) => (
              <p key={i} className="flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{w}</p>
            ))}
          </div>
        )}

        {/* Chat-Overlay */}
        {chatOpen && (
          <div className="absolute inset-0 bg-black/80 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <span className="text-white font-semibold">Zentrale</span>
              <Button variant="ghost" size="icon" className="text-white h-11 w-11" onClick={() => setChatOpen(false)}><X className="w-6 h-6" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={cn("max-w-[80%] p-3 rounded-xl text-sm", m.sender_role === "driver" ? "ml-auto bg-emerald-600 text-white" : "bg-zinc-800 text-white")}>
                  {m.body}
                  <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString("de-DE")}</div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-zinc-500 text-sm py-8">Noch keine Nachrichten</p>}
            </div>
            <div className="p-3 flex gap-2 border-t border-zinc-800">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Nachricht …" className="h-12 bg-white text-black" />
              <Button className="h-12 w-14" onClick={sendChat}><Send className="w-5 h-5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Kennzahlen */}
      <div className="shrink-0 grid grid-cols-4 gap-px bg-zinc-800">
        <div className="bg-zinc-900 p-2.5 text-center">
          <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1"><Gauge className="w-3 h-3" />Rest</p>
          <p className="text-lg font-bold text-white">{remainingKm != null ? formatKm(remainingKm) : "–"}</p>
        </div>
        <div className="bg-zinc-900 p-2.5 text-center">
          <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />Fahrzeit</p>
          <p className="text-lg font-bold text-white">{remainingMin != null ? formatDuration(remainingMin) : "–"}</p>
        </div>
        <div className="bg-zinc-900 p-2.5 text-center">
          <p className="text-[10px] text-zinc-400">Ankunft</p>
          <p className="text-lg font-bold text-emerald-400">
            {remainingMin != null ? etaFrom(remainingMin + delayMinutes) : "–"}
          </p>
        </div>
        <button className="bg-zinc-900 p-2.5 text-center" onClick={() => setSheetTab("duty")}>
          <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1"><Hourglass className="w-3 h-3" />Bis Pause</p>
          <p className={cn(
            "text-lg font-bold",
            compliance.level === "critical" ? "text-red-400" : compliance.level === "warn" ? "text-amber-300" : "text-white",
          )}>
            {compliance.state === "break" ? formatHm(compliance.currentBreakSeconds) : formatHm(compliance.secondsToBreak)}
          </p>
        </button>
      </div>

      {/* Schnellzugriffe */}
      <div className="shrink-0 grid grid-cols-5 gap-2 px-3 pt-3 bg-zinc-900">
        <Button variant="outline" className="h-12 flex-col gap-0.5 text-[11px]" onClick={() => setSheetTab("stops")}>
          <ListOrdered className="w-4 h-4" /> Halte
        </Button>
        <Button
          variant="outline"
          className={cn("h-12 flex-col gap-0.5 text-[11px] relative", manifest.totalPassengers > 0 && "border-emerald-600 text-emerald-300")}
          onClick={() => setSheetTab("manifest")}
        >
          <Users className="w-4 h-4" /> Zustieg
          {manifest.totalPassengers > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
              {manifest.totalPassengers}
            </span>
          )}
        </Button>
        <Button variant="outline" className="h-12 flex-col gap-0.5 text-[11px]" onClick={() => setSheetTab("tolls")}>
          <Coins className="w-4 h-4" /> Maut
        </Button>
        <Button
          variant="outline"
          className={cn("h-12 flex-col gap-0.5 text-[11px]", delayMinutes > 0 && "border-amber-500 text-amber-300")}
          onClick={() => setSheetTab("delay")}
        >
          <Timer className="w-4 h-4" /> Verspätung
        </Button>
        <Button variant="outline" className="h-12 flex-col gap-0.5 text-[11px]" onClick={() => setSheetTab("event")}>
          <AlertTriangle className="w-4 h-4" /> Ereignis
        </Button>
      </div>

      {/* Aktionsleiste */}
      <div className="shrink-0 grid grid-cols-4 gap-2 p-3 bg-zinc-900 border-t border-zinc-800">
        <Button className="h-16 flex-col gap-1 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={startNav} disabled={!activeOrder || busy || activeOrder.status === "sent"}>
          <Play className="w-6 h-6" /> Navigation
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1 text-xs" onClick={pauseNav} disabled={!activeOrder || busy}>
          <Coffee className="w-6 h-6" /> Pause
        </Button>
        <Button variant="outline" className="h-16 flex-col gap-1 text-xs" onClick={arrived} disabled={!activeOrder || busy}>
          <Flag className="w-6 h-6" /> Angekommen
        </Button>
        <Button variant="destructive" className="h-16 flex-col gap-1 text-xs" onClick={reportProblem} disabled={!activeOrder || busy}>
          <AlertTriangle className="w-6 h-6" /> Problem
        </Button>
      </div>

      {/* Halte, Maut, Verspätung, Ereignisse und Lenkzeiten */}
      <Sheet open={sheetTab !== null} onOpenChange={(o) => !o && setSheetTab(null)}>
        <SheetContent side="bottom" className="bg-[#0f1218] border-zinc-800 h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-white">Fahrtinformationen</SheetTitle>
          </SheetHeader>
          <Tabs value={sheetTab ?? "stops"} onValueChange={(v) => setSheetTab(v as SheetTab)} className="mt-3">
            <TabsList className="grid grid-cols-6 bg-zinc-900 h-auto">
              <TabsTrigger value="stops" className="text-xs py-2">Halte</TabsTrigger>
              <TabsTrigger value="manifest" className="text-xs py-2">Zustieg</TabsTrigger>
              <TabsTrigger value="tolls" className="text-xs py-2">Maut</TabsTrigger>
              <TabsTrigger value="delay" className="text-xs py-2">Verspätung</TabsTrigger>
              <TabsTrigger value="event" className="text-xs py-2">Ereignis</TabsTrigger>
              <TabsTrigger value="duty" className="text-xs py-2">Lenkzeit</TabsTrigger>
            </TabsList>
            <TabsContent value="stops" className="mt-4">
              <StopsPanel
                stops={stops}
                delayMinutes={delayMinutes}
                onArrive={stopArrive}
                onDepart={stopDepart}
                onNavigate={navigateToStop}
                onAddUnscheduled={addUnscheduled}
                onRemoveUnscheduled={removeUnscheduled}
                canEdit={!!activeOrder}
                hasGps={!!pos}
                busy={busy}
              />

            </TabsContent>
            <TabsContent value="manifest" className="mt-4">
              <ManifestPanel
                trip={manifest.trip}
                stops={manifest.stops}
                totalPassengers={manifest.totalPassengers}
                totalBoarded={manifest.totalBoarded}
                isLoading={manifest.isLoading}
              />
            </TabsContent>
            <TabsContent value="tolls" className="mt-4">
              <TollPanel tolls={tolls} dataAvailable={activeOrder?.toll_data_available ?? null} />
            </TabsContent>
            <TabsContent value="delay" className="mt-4">
              <DelaySheet currentDelay={delayMinutes} onSubmit={submitDelay} busy={busy} />
            </TabsContent>
            <TabsContent value="event" className="mt-4">
              <EventSheet onSubmit={submitEvent} busy={busy} />
            </TabsContent>
            <TabsContent value="duty" className="mt-4">
              <DrivingTimePanel
                compliance={compliance}
                multiDriver={!!dutyToday?.multi_driver}
                onToggleMultiDriver={(v) => setMultiDriver(v)}
                onStartBreak={() => act(async () => { await stopDriving({ startBreak: true }); await logEvent("break_start"); })}
                onEndBreak={() => act(async () => { await startDriving(); await logEvent("break_end"); })}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <div className="shrink-0 bg-zinc-950 px-3 py-1.5 text-center">
        <Link to="/admin/driver" className="text-[11px] text-zinc-500">← Zurück zum Fahrer-Cockpit (FIS)</Link>
      </div>

    </div>
  );
};

export default DriverNavPage;
