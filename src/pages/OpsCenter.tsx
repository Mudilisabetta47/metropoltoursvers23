import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, Bus as BusIcon, ChevronRight, Layers, Loader2, MapPin, MessageSquare,
  Navigation, Plus, Radio, Route as RouteIcon, Send, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import {
  DispatchOrder, FLEET_STATUS_COLOR, FLEET_STATUS_LABEL, ORDER_STATUS_LABEL,
  useDispatchMessages, useFleetOverview,
} from "@/hooks/useFleet";
import { useOpsHazards } from "@/hooks/useOpsHazards";
import { BLOCKING_TYPES, DEFAULT_LAYERS, HAZARD_META, OPS_LAYERS, OpsLayerKey } from "@/lib/ops/hazards";
import { GPS_HEALTH_COLOR, GPS_HEALTH_LABEL, gpsHealth, relativeAge } from "@/lib/ops/gps";
import { distanceToRouteMeters, formatKm, haversineMeters } from "@/lib/navigation/routing";
import OpsMap from "@/components/ops/OpsMap";
import RerouteDialog from "@/components/ops/RerouteDialog";
import HazardDialog from "@/components/ops/HazardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const timeFmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";

const OpsCenter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { token } = useMapboxToken();
  const { drivers, buses, positions, orders, isLoading } = useFleetOverview();
  const { hazards, createHazard } = useOpsHazards();

  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<OpsLayerKey, boolean>>(DEFAULT_LAYERS);
  const [layerOpen, setLayerOpen] = useState(false);
  const [rerouteOpen, setRerouteOpen] = useState(false);
  const [hazardOpen, setHazardOpen] = useState(false);
  const [pickPoint, setPickPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const { messages, send } = useDispatchMessages(selected ?? undefined);

  // Ticker fuer GPS-Alter
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const labels = useMemo(() => {
    const busById = new Map(buses.map((b: any) => [b.id, b]));
    const driverById = new Map(drivers.map((d) => [d.user_id, d]));
    const out: Record<string, { driver: string; bus: string }> = {};
    positions.forEach((p) => {
      const bus: any = p.bus_id ? busById.get(p.bus_id) : null;
      out[p.driver_user_id] = {
        driver: driverById.get(p.driver_user_id)?.name ?? "Fahrer",
        bus: bus?.bus_number ?? bus?.name ?? "Bus",
      };
    });
    return out;
  }, [positions, buses, drivers]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ["sent", "accepted", "en_route", "paused"].includes(o.status)),
    [orders],
  );

  const orderByDriver = useMemo(() => {
    const map: Record<string, DispatchOrder | undefined> = {};
    positions.forEach((p) => {
      map[p.driver_user_id] =
        activeOrders.find((o) => o.id === p.order_id) ??
        activeOrders.find((o) => o.driver_user_id === p.driver_user_id);
    });
    return map;
  }, [positions, activeOrders]);

  const selectedPos = positions.find((p) => p.driver_user_id === selected) ?? null;
  const selectedOrder = selected ? orderByDriver[selected] ?? null : null;
  const selectedBus = useMemo(
    () => buses.find((b: any) => b.id === (selectedPos?.bus_id ?? selectedOrder?.bus_id)) ?? null,
    [buses, selectedPos, selectedOrder],
  );

  // Hindernisse auf Routen
  const routeHazards = useMemo(() => {
    const out: { driverId: string; hazardId: string; label: string; icon: string; bus: string; distanceKm: number }[] = [];
    positions.forEach((p) => {
      const order = orderByDriver[p.driver_user_id];
      if (!order?.route_geometry) return;
      hazards
        .filter((h) => BLOCKING_TYPES.includes(h.hazard_type))
        .forEach((h) => {
          const onRoute = distanceToRouteMeters({ lat: h.latitude, lng: h.longitude }, order.route_geometry!);
          if (onRoute > (h.radius_m || 300)) return;
          const dist = haversineMeters({ lat: p.latitude, lng: p.longitude }, { lat: h.latitude, lng: h.longitude }) / 1000;
          out.push({
            driverId: p.driver_user_id,
            hazardId: h.id,
            label: h.title,
            icon: HAZARD_META[h.hazard_type]?.icon ?? "⚠️",
            bus: labels[p.driver_user_id]?.bus ?? "Bus",
            distanceKm: dist,
          });
        });
    });
    return out.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [positions, orderByDriver, hazards, labels]);

  const kpi = useMemo(() => {
    const health = positions.map((p) => gpsHealth(p.updated_at));
    return {
      total: positions.length,
      enRoute: positions.filter((p, i) => health[i] !== "offline" && p.status === "en_route").length,
      pause: positions.filter((p, i) => health[i] !== "offline" && p.status === "break").length,
      offline: health.filter((h) => h === "offline").length,
      gpsLost: health.filter((h) => h === "lost").length,
      orders: activeOrders.length,
      delayed: activeOrders.filter((o) => o.eta && new Date(o.eta).getTime() < Date.now()).length,
      hazards: hazards.length,
    };
  }, [positions, activeOrders, hazards]);

  const delayMinutes = (o: DispatchOrder | null) => {
    if (!o?.eta || !o.departure_at) return 0;
    const planned = o.duration_min ? new Date(new Date(o.departure_at).getTime() + o.duration_min * 60000) : null;
    if (!planned) return 0;
    return Math.round((new Date(o.eta).getTime() - planned.getTime()) / 60000);
  };



  const remainingKm =
    selectedPos && selectedOrder?.destination_lat
      ? haversineMeters(
          { lat: selectedPos.latitude, lng: selectedPos.longitude },
          { lat: Number(selectedOrder.destination_lat), lng: Number(selectedOrder.destination_lng) },
        ) / 1000
      : null;

  const health = selectedPos ? gpsHealth(selectedPos.updated_at) : null;
  const delay = delayMinutes(selectedOrder);

  return (
    <AdminLayout title="OPS Center" subtitle="Live-Leitstelle: Flotte, Routen, Verkehr und Fahrer-Kommunikation">
    <div className="h-[calc(100vh-11rem)] min-h-[560px] rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0d13] flex flex-col">
      {/* Kopf: Live-Kennzahlen */}
      <header className="shrink-0 border-b border-zinc-800 bg-[#0f1218] px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 mr-2">
          <Radio className="w-5 h-5 text-primary" />
          <span className="font-semibold text-white">OPS Center</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 uppercase tracking-wide">Flotte</span>
          <Badge className="bg-zinc-800 text-white">{kpi.total} Busse</Badge>
          <Badge className="bg-emerald-500/15 text-emerald-400">🟢 {kpi.enRoute} unterwegs</Badge>
          <Badge className="bg-amber-500/15 text-amber-400">🟡 {kpi.pause} Pause</Badge>
          <Badge className="bg-red-500/15 text-red-400">🔴 {kpi.offline} offline</Badge>
          {kpi.gpsLost > 0 && <Badge className="bg-orange-500/15 text-orange-400">⚠️ {kpi.gpsLost} GPS verloren</Badge>}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 uppercase tracking-wide">Aufträge</span>
          <Badge className="bg-zinc-800 text-white">{kpi.orders} aktiv</Badge>
          <Badge className="bg-orange-500/15 text-orange-400">{kpi.delayed} verspätet</Badge>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 uppercase tracking-wide">Verkehr</span>
          <Badge className="bg-zinc-800 text-white">{kpi.hazards} Störungen</Badge>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => setHazardOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Verkehrsmeldung
          </Button>
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => navigate("/admin/leitstelle")}>
            Leitstelle
          </Button>
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => navigate("/admin/live-betrieb")}>
            Klassische Ansicht
          </Button>
        </div>
      </header>

      <div className="flex-1 relative">
        {token ? (
          <OpsMap
            token={token}
            positions={positions}
            labels={labels}
            orderByDriver={orderByDriver}
            hazards={hazards}
            layers={layers}
            selectedDriverId={selected}
            onSelect={setSelected}
            onMapClick={(p) => setPickPoint(p)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Karte nicht verfügbar"}
          </div>
        )}

        {/* Layer-Schalter */}
        <div className="absolute top-3 right-3 z-10">
          <Button size="sm" className="bg-zinc-900/90 border border-zinc-700 text-white hover:bg-zinc-800" onClick={() => setLayerOpen((v) => !v)}>
            <Layers className="w-4 h-4 mr-1" /> Kartenebenen
          </Button>
          {layerOpen && (
            <div className="mt-2 w-56 rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 space-y-2 shadow-xl">
              {OPS_LAYERS.map((l) => (
                <label key={l.key} className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <Checkbox
                    checked={layers[l.key]}
                    onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [l.key]: !!v }))}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Hindernisse auf Route */}
        {routeHazards.length > 0 && (
          <div className="absolute top-3 left-3 z-10 w-72 space-y-2">
            {routeHazards.slice(0, 3).map((h) => (
              <div key={`${h.driverId}-${h.hazardId}`} className="rounded-lg border border-amber-500/40 bg-amber-500/15 backdrop-blur px-3 py-2">
                <p className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> HINDERNIS AUF ROUTE
                </p>
                <p className="text-sm text-white mt-1">
                  {h.icon} {h.label}
                </p>
                <p className="text-xs text-zinc-300">
                  Bus: {h.bus} · Entfernung: {formatKm(h.distanceKm)}
                </p>
                <Button
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={() => {
                    setSelected(h.driverId);
                    setRerouteOpen(true);
                  }}
                >
                  Alternative Route berechnen
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Fahrzeug-Detailpanel */}
        {selectedPos && (
          <aside className="absolute top-0 right-0 bottom-0 z-20 w-[340px] bg-[#0f1218]/97 border-l border-zinc-800 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Fahrzeug</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400" onClick={() => setSelected(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-white flex items-center gap-2">
                  <BusIcon className="w-5 h-5 text-primary" />
                  {labels[selectedPos.driver_user_id]?.bus}
                </p>
                <p className="text-sm text-zinc-300">{labels[selectedPos.driver_user_id]?.driver}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${FLEET_STATUS_COLOR[selectedPos.status]}22`,
                      color: FLEET_STATUS_COLOR[selectedPos.status],
                    }}
                  >
                    ● {FLEET_STATUS_LABEL[selectedPos.status]}
                  </span>
                  <span className="text-sm text-white font-medium">{Math.round(selectedPos.speed_kmh)} km/h</span>
                  <span className="text-xs text-zinc-500">Kurs {Math.round(selectedPos.heading)}°</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Route</p>
                {selectedOrder ? (
                  <div className="space-y-1 text-sm text-zinc-200">
                    <p>{selectedOrder.origin_name ?? "Start"}</p>
                    {(selectedOrder.waypoints ?? []).map((w, i) => (
                      <p key={i} className="text-zinc-400">↓ {w.name}</p>
                    ))}
                    <p className="text-primary">↓ {selectedOrder.destination_name ?? "Ziel"}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-zinc-400">
                      <span>ETA: <b className="text-white">{timeFmt(selectedOrder.eta)}</b></span>
                      <span>Rest: <b className="text-white">{remainingKm != null ? formatKm(remainingKm) : "–"}</b></span>
                      <span>Geplant: <b className="text-white">{timeFmt(selectedOrder.departure_at)}</b></span>
                      <span>
                        Verspätung:{" "}
                        <b className={delay > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {delay > 0 ? `+${delay} Min.` : "pünktlich"}
                        </b>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Kein aktiver Auftrag</p>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Auftrag</p>
                <p className="text-sm text-white">{selectedOrder?.order_number ?? "–"}</p>
                {selectedOrder && (
                  <p className="text-xs text-zinc-400">{ORDER_STATUS_LABEL[selectedOrder.status]}</p>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">GPS</p>
                <p className="text-sm" style={{ color: health ? GPS_HEALTH_COLOR[health] : undefined }}>
                  {health === "live" ? "🟢" : health === "lost" ? "🟠" : "🔴"} {health ? GPS_HEALTH_LABEL[health] : "–"}
                </p>
                <p className="text-xs text-zinc-400">{relativeAge(selectedPos.updated_at)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Aktionen</p>
                <Button
                  variant="outline"
                  className="w-full justify-start border-zinc-700 text-zinc-200"
                  onClick={() => setLayers((p) => ({ ...p, routes: true }))}
                >
                  <RouteIcon className="w-4 h-4 mr-2" /> Route anzeigen
                </Button>
                <Button className="w-full justify-start" disabled={!selectedOrder} onClick={() => setRerouteOpen(true)}>
                  <Navigation className="w-4 h-4 mr-2" /> Route ändern
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-zinc-700 text-zinc-200"
                  onClick={() => navigate(`/admin/leitstelle?order=${selectedOrder?.id ?? ""}`)}
                  disabled={!selectedOrder}
                >
                  <ChevronRight className="w-4 h-4 mr-2" /> Auftrag öffnen
                </Button>
              </div>

              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Nachricht senden
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                  {messages.slice(-6).map((m) => (
                    <p key={m.id} className={cn("text-xs", m.sender_role === "driver" ? "text-zinc-300" : "text-primary")}>
                      <b>{m.sender_role === "driver" ? "Fahrer" : "OPS"}:</b> {m.body}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nachricht …"
                    className="bg-white text-black h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim() && user) {
                        send(chatInput, user.id, "dispatcher", selectedOrder?.id ?? null);
                        setChatInput("");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      if (!chatInput.trim() || !user) return;
                      send(chatInput, user.id, "dispatcher", selectedOrder?.id ?? null);
                      setChatInput("");
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-600 flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                Feste Messstellen werden nur hier als Verkehrsinformation dargestellt – die Fahrer-App warnt nicht aktiv.
              </p>
            </div>
          </aside>
        )}
      </div>

      <RerouteDialog
        open={rerouteOpen}
        onOpenChange={setRerouteOpen}
        token={token ?? ""}
        order={selectedOrder}
        bus={selectedBus}
        currentPosition={selectedPos ? { lat: selectedPos.latitude, lng: selectedPos.longitude } : null}
        onDone={async () => {
          if (selectedOrder && user) {
            await db.from("dispatch_messages").insert({
              driver_user_id: selectedOrder.driver_user_id,
              sender_id: user.id,
              sender_role: "dispatcher",
              order_id: selectedOrder.id,
              body: "🔄 Neue Route vom OPS Center.",
            });
          }
        }}
      />

      <HazardDialog
        open={hazardOpen}
        onOpenChange={setHazardOpen}
        token={token ?? ""}
        presetPoint={pickPoint}
        onCreate={createHazard}
      />
    </div>
    </AdminLayout>
  );
};

export default OpsCenter;
