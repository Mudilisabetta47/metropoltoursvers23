import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Bus as BusIcon, ChevronRight, Gauge, Layers, Loader2, MapPin, MessageSquare,
  Navigation, Phone, Plus, Radio, Route as RouteIcon, Send, Siren, TrafficCone, X,
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

const timeFmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";

/** Kompakte Kennzahl in der Leitstellen-Statusleiste. */
const Stat = ({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "neutral" | "ok" | "warn" | "bad" }) => (
  <div className="flex items-baseline gap-1.5 px-3 py-1 border-r border-zinc-800/80 last:border-r-0">
    <span
      className={cn(
        "text-[15px] font-semibold tabular-nums leading-none",
        tone === "ok" && "text-emerald-400",
        tone === "warn" && "text-amber-400",
        tone === "bad" && "text-red-400",
        tone === "neutral" && "text-zinc-100",
      )}
    >
      {value}
    </span>
    <span className="text-[10px] uppercase tracking-[0.08em] text-zinc-500 whitespace-nowrap">{label}</span>
  </div>
);

/** Panelrahmen fuer die unteren Leitstellen-Bereiche. */
const Panel = ({
  title, icon, count, children,
}: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode }) => (
  <section className="flex flex-col min-w-0 border-r border-zinc-800/80 last:border-r-0 bg-[#0d1017]">
    <header className="shrink-0 flex items-center gap-1.5 px-2.5 h-7 border-b border-zinc-800/80 bg-[#11151d]">
      <span className="text-zinc-500">{icon}</span>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{title}</h3>
      {count != null && (
        <span className="ml-auto text-[10px] tabular-nums text-zinc-500 bg-zinc-800/80 px-1.5 rounded">{count}</span>
      )}
    </header>
    <div className="flex-1 overflow-y-auto text-[11px] leading-tight divide-y divide-zinc-800/60">{children}</div>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <p className="px-2.5 py-3 text-[11px] text-zinc-600">{text}</p>
);

const OpsCenter = () => {
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
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "en_route" | "break" | "lost" | "offline">("all");
  const [sortBy, setSortBy] = useState<"bus" | "delay" | "speed" | "gps">("bus");
  const { messages, send } = useDispatchMessages(selected ?? undefined);

  // Ticker fuer GPS-Alter
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.user_id, d])), [drivers]);

  const labels = useMemo(() => {
    const busById = new Map(buses.map((b: any) => [b.id, b]));
    const out: Record<string, { driver: string; bus: string }> = {};
    positions.forEach((p) => {
      const bus: any = p.bus_id ? busById.get(p.bus_id) : null;
      out[p.driver_user_id] = {
        driver: driverById.get(p.driver_user_id)?.name ?? "Fahrer",
        bus: bus?.bus_number ?? bus?.name ?? "Bus",
      };
    });
    return out;
  }, [positions, buses, driverById]);

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
  const selectedDriver = selected ? driverById.get(selected) ?? null : null;
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

  const delayMinutesOf = (o: DispatchOrder | null | undefined) => {
    if (!o?.eta || !o.departure_at || !o.duration_min) return 0;
    const planned = new Date(new Date(o.departure_at).getTime() + o.duration_min * 60000);
    return Math.round((new Date(o.eta).getTime() - planned.getTime()) / 60000);
  };

  const kpi = useMemo(() => {
    const health = positions.map((p) => gpsHealth(p.updated_at));
    return {
      total: positions.length,
      enRoute: positions.filter((p, i) => health[i] !== "offline" && p.status === "en_route").length,
      pause: positions.filter((p, i) => health[i] !== "offline" && p.status === "break").length,
      offline: health.filter((h) => h === "offline").length,
      gpsLost: health.filter((h) => h === "lost").length,
      orders: activeOrders.length,
      delayed: activeOrders.filter((o) => delayMinutesOf(o) > 0).length,
      hazards: hazards.length,
    };
  }, [positions, activeOrders, hazards]);

  const fleetRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = positions.map((p) => {
      const order = orderByDriver[p.driver_user_id];
      return {
        pos: p,
        order,
        health: gpsHealth(p.updated_at),
        driver: labels[p.driver_user_id]?.driver ?? "Fahrer",
        bus: labels[p.driver_user_id]?.bus ?? "Bus",
        delay: delayMinutesOf(order),
      };
    });
    const filtered = rows.filter((r) => {
      if (q && !`${r.driver} ${r.bus} ${r.order?.order_number ?? ""} ${r.order?.destination_name ?? ""}`.toLowerCase().includes(q))
        return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "lost") return r.health === "lost";
      if (statusFilter === "offline") return r.health === "offline";
      return r.health !== "offline" && r.pos.status === statusFilter;
    });
    const order = { live: 0, lost: 1, offline: 2 } as const;
    return filtered.sort((a, b) => {
      if (sortBy === "delay") return b.delay - a.delay;
      if (sortBy === "speed") return b.pos.speed_kmh - a.pos.speed_kmh;
      if (sortBy === "gps") return order[a.health] - order[b.health];
      return a.bus.localeCompare(b.bus);
    });
  }, [positions, orderByDriver, labels, query, statusFilter, sortBy]);

  const visiblePositions = useMemo(() => fleetRows.map((r) => r.pos), [fleetRows]);

  /** Meldungsstrom: GPS verloren, offline, Verspätungen, Fahrer-Nachrichten. */
  const alerts = useMemo(() => {
    const out: { id: string; tone: "bad" | "warn"; text: string; sub: string; driverId: string }[] = [];
    positions.forEach((p) => {
      const h = gpsHealth(p.updated_at);
      const bus = labels[p.driver_user_id]?.bus ?? "Bus";
      if (h === "offline")
        out.push({ id: `off-${p.id}`, tone: "bad", text: `${bus} offline`, sub: relativeAge(p.updated_at), driverId: p.driver_user_id });
      else if (h === "lost")
        out.push({ id: `lost-${p.id}`, tone: "warn", text: `${bus} GPS verloren`, sub: relativeAge(p.updated_at), driverId: p.driver_user_id });
      const d = delayMinutesOf(orderByDriver[p.driver_user_id]);
      if (d > 0)
        out.push({
          id: `del-${p.id}`,
          tone: d >= 15 ? "bad" : "warn",
          text: `${bus} +${d} Min. verspätet`,
          sub: orderByDriver[p.driver_user_id]?.destination_name ?? "Ziel",
          driverId: p.driver_user_id,
        });
    });
    return out;
  }, [positions, labels, orderByDriver]);

  const traffic = useMemo(() => hazards.filter((h) => ["traffic", "jam"].includes(h.hazard_type)), [hazards]);
  const obstacles = useMemo(
    () => hazards.filter((h) => ["construction", "closure", "accident", "danger"].includes(h.hazard_type)),
    [hazards],
  );
  const cameras = useMemo(
    () => hazards.filter((h) => h.hazard_type === "speed_camera_fixed" || h.hazard_type === "speed_camera_mobile"),
    [hazards],
  );

  const remainingKm =
    selectedPos && selectedOrder?.destination_lat
      ? haversineMeters(
          { lat: selectedPos.latitude, lng: selectedPos.longitude },
          { lat: Number(selectedOrder.destination_lat), lng: Number(selectedOrder.destination_lng) },
        ) / 1000
      : null;

  const health = selectedPos ? gpsHealth(selectedPos.updated_at) : null;
  const delay = delayMinutesOf(selectedOrder);

  /** Nächster Wegpunkt auf der Route des ausgewählten Fahrzeugs. */
  const nextStop = useMemo(() => {
    if (!selectedPos || !selectedOrder) return null;
    const wps = [
      ...(selectedOrder.waypoints ?? []),
      selectedOrder.destination_lat
        ? { name: selectedOrder.destination_name ?? "Ziel", lat: Number(selectedOrder.destination_lat), lng: Number(selectedOrder.destination_lng) }
        : null,
    ].filter(Boolean) as { name: string; lat: number; lng: number }[];
    if (!wps.length) return null;
    let best = wps[0];
    let bestD = Infinity;
    wps.forEach((w) => {
      const d = haversineMeters({ lat: selectedPos.latitude, lng: selectedPos.longitude }, { lat: w.lat, lng: w.lng });
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    });
    return { name: best.name, km: bestD / 1000 };
  }, [selectedPos, selectedOrder]);

  const sendMessage = () => {
    if (!chatInput.trim() || !user || !selected) return;
    send(chatInput, user.id, "dispatcher", selectedOrder?.id ?? null);
    setChatInput("");
  };

  const focusVehicle = (driverId: string) => {
    setSelected(null);
    setTimeout(() => setSelected(driverId), 0);
  };

  const rowTone = (h: string) => (h === "live" ? "#10b981" : h === "lost" ? "#f97316" : "#ef4444");

  return (
    <AdminLayout title="Leitstelle" subtitle="Live-Dispatch: Flotte, Routen, Verkehr, Kommunikation">
      <div className="h-[calc(100vh-9.5rem)] min-h-[620px] rounded-lg overflow-hidden border border-zinc-800 bg-[#080a0f] flex flex-col text-zinc-200">
        {/* STATUSLEISTE */}
        <header className="shrink-0 h-9 border-b border-zinc-800 bg-[#11151d] flex items-center">
          <div className="flex items-center gap-2 px-3 border-r border-zinc-800/80 h-full">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-[0.16em] text-white uppercase">Leitstelle</span>
          </div>
          <div className="flex items-center overflow-x-auto no-scrollbar h-full">
            <Stat label="Fahrzeuge" value={kpi.total} />
            <Stat label="Unterwegs" value={kpi.enRoute} tone="ok" />
            <Stat label="Pause" value={kpi.pause} tone="warn" />
            <Stat label="GPS verloren" value={kpi.gpsLost} tone={kpi.gpsLost ? "warn" : "neutral"} />
            <Stat label="Offline" value={kpi.offline} tone={kpi.offline ? "bad" : "neutral"} />
            <Stat label="Aufträge" value={kpi.orders} />
            <Stat label="Verspätet" value={kpi.delayed} tone={kpi.delayed ? "bad" : "neutral"} />
            <Stat label="Störungen" value={kpi.hazards} tone={kpi.hazards ? "warn" : "neutral"} />
          </div>
          <div className="ml-auto flex items-center gap-1.5 pr-2">
            <span className="text-[10px] text-zinc-600 tabular-nums hidden lg:block">
              {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} · Live
            </span>
            <Button size="sm" className="h-6 px-2 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700" onClick={() => setHazardOpen(true)}>
              <Plus className="w-3 h-3 mr-1" /> Meldung
            </Button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* LINKS: FLOTTE */}
          <aside className="w-[268px] shrink-0 border-r border-zinc-800 bg-[#0d1017] flex flex-col min-h-0">
            <div className="p-2 space-y-1.5 border-b border-zinc-800">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bus, Fahrer, Auftrag, Ziel …"
                className="h-7 bg-[#161b24] border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-[11px]"
              />
              <div className="grid grid-cols-5 gap-1">
                {([
                  ["all", "Alle", positions.length],
                  ["en_route", "Fahrt", kpi.enRoute],
                  ["break", "Pause", kpi.pause],
                  ["lost", "GPS", kpi.gpsLost],
                  ["offline", "Off", kpi.offline],
                ] as const).map(([key, label, n]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={cn(
                      "px-1 py-1 rounded text-[10px] border leading-none flex flex-col items-center gap-0.5",
                      statusFilter === key
                        ? "bg-primary/20 text-primary border-primary/60"
                        : "bg-[#141922] text-zinc-500 border-zinc-800 hover:text-zinc-200",
                    )}
                  >
                    <span className="tabular-nums font-semibold">{n}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                <span className="uppercase tracking-wide">Sort</span>
                {([
                  ["bus", "Bus"],
                  ["delay", "Versp."],
                  ["speed", "Tempo"],
                  ["gps", "GPS"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={cn("px-1 py-0.5 rounded", sortBy === key ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-300")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
              {fleetRows.length === 0 && <Empty text="Keine Fahrzeuge für diesen Filter." />}
              {fleetRows.map((r) => {
                const isSel = selected === r.pos.driver_user_id;
                return (
                  <button
                    key={r.pos.id}
                    onClick={() => setSelected(r.pos.driver_user_id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 relative hover:bg-[#161b24] transition-colors",
                      isSel && "bg-[#182029]",
                    )}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: isSel ? "#00CC36" : rowTone(r.health) }} />
                    <div className="pl-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-semibold text-white truncate">{r.bus}</span>
                        {r.health === "live" && r.pos.speed_kmh > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live-Tracking" />
                        )}
                        <span className="ml-auto text-[10px] tabular-nums text-zinc-400">{Math.round(r.pos.speed_kmh)} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <span className="truncate max-w-[120px]">{r.driver}</span>
                        <span style={{ color: FLEET_STATUS_COLOR[r.pos.status] }}>● {FLEET_STATUS_LABEL[r.pos.status]}</span>
                        {r.delay > 0 && <span className="ml-auto text-amber-400 tabular-nums">+{r.delay}′</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <span className="truncate">
                          {r.order ? `${r.order.order_number} → ${r.order.destination_name ?? "Ziel"}` : "Kein Auftrag"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: GPS_HEALTH_COLOR[r.health] }}>
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="tabular-nums">
                          {r.pos.latitude.toFixed(3)}, {r.pos.longitude.toFixed(3)}
                        </span>
                        <span className="text-zinc-600">· {relativeAge(r.pos.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* MITTE: MAP + UNTERE PANELS */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 relative min-h-0">
              {token ? (
                <OpsMap
                  token={token}
                  positions={visiblePositions}
                  labels={labels}
                  orderByDriver={orderByDriver}
                  hazards={hazards}
                  layers={layers}
                  selectedDriverId={selected}
                  onSelect={setSelected}
                  onMapClick={(p) => setPickPoint(p)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                  {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : "Karte nicht verfügbar"}
                </div>
              )}

              {/* Kartenebenen */}
              <div className="absolute top-2 right-2 z-10">
                <Button
                  size="sm"
                  className="h-7 px-2 text-[11px] bg-[#11151d]/95 border border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                  onClick={() => setLayerOpen((v) => !v)}
                >
                  <Layers className="w-3.5 h-3.5 mr-1" /> Ebenen
                </Button>
                {layerOpen && (
                  <div className="mt-1.5 w-48 rounded border border-zinc-700 bg-[#11151d]/98 p-2 space-y-1.5 shadow-2xl">
                    {OPS_LAYERS.map((l) => (
                      <label key={l.key} className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
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
                <div className="absolute top-2 left-2 z-10 w-64 space-y-1.5">
                  {routeHazards.slice(0, 2).map((h) => (
                    <div key={`${h.driverId}-${h.hazardId}`} className="rounded border border-amber-500/50 bg-[#1a1508]/95 backdrop-blur px-2.5 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hindernis auf Route
                      </p>
                      <p className="text-[12px] text-white mt-0.5">{h.icon} {h.label}</p>
                      <p className="text-[10px] text-zinc-400">{h.bus} · {formatKm(h.distanceKm)} entfernt</p>
                      <Button
                        size="sm"
                        className="mt-1.5 h-6 w-full text-[11px]"
                        onClick={() => {
                          setSelected(h.driverId);
                          setRerouteOpen(true);
                        }}
                      >
                        Umleitung planen
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UNTERE LEITSTELLEN-PANELS */}
            <div className="shrink-0 h-[168px] border-t border-zinc-800 grid grid-cols-4">
              <Panel title="Verkehr" icon={<TrafficCone className="w-3 h-3" />} count={traffic.length}>
                {traffic.length === 0 && <Empty text="Keine Verkehrsstörungen." />}
                {traffic.map((h) => (
                  <div key={h.id} className="px-2.5 py-1.5 hover:bg-[#151a23]">
                    <p className="text-zinc-100 truncate">
                      {HAZARD_META[h.hazard_type]?.icon} {h.title}
                    </p>
                    <p className="text-zinc-600 truncate">
                      {h.description ?? HAZARD_META[h.hazard_type]?.label} · seit {timeFmt(h.valid_from)}
                    </p>
                  </div>
                ))}
              </Panel>

              <Panel title="Aktuelle Meldungen" icon={<Siren className="w-3 h-3" />} count={alerts.length}>
                {alerts.length === 0 && <Empty text="Keine offenen Meldungen." />}
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => focusVehicle(a.driverId)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#151a23]"
                  >
                    <p className={cn("truncate", a.tone === "bad" ? "text-red-400" : "text-amber-400")}>● {a.text}</p>
                    <p className="text-zinc-600 truncate">{a.sub}</p>
                  </button>
                ))}
              </Panel>

              <Panel title="Hindernisse" icon={<AlertTriangle className="w-3 h-3" />} count={obstacles.length}>
                {obstacles.length === 0 && <Empty text="Keine Hindernisse gemeldet." />}
                {obstacles.map((h) => (
                  <div key={h.id} className="px-2.5 py-1.5 hover:bg-[#151a23]">
                    <p className="text-zinc-100 truncate">
                      {HAZARD_META[h.hazard_type]?.icon} {h.title}
                    </p>
                    <p className="text-zinc-600 truncate">
                      {HAZARD_META[h.hazard_type]?.label} · Radius {h.radius_m} m · {h.severity}
                    </p>
                  </div>
                ))}
              </Panel>

              <Panel title="Feste Messstellen" icon={<Gauge className="w-3 h-3" />} count={cameras.length}>
                {cameras.length === 0 && <Empty text="Keine Messstellen erfasst." />}
                {cameras.map((h) => (
                  <div key={h.id} className="px-2.5 py-1.5 hover:bg-[#151a23]">
                    <p className="text-zinc-100 truncate">📍 {h.title}</p>
                    <p className="text-zinc-600 tabular-nums truncate">
                      {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                      {h.speed_limit_kmh ? ` · erlaubt ${h.speed_limit_kmh} km/h` : ""}
                    </p>
                  </div>
                ))}
              </Panel>
            </div>
          </div>

          {/* RECHTS: DETAILPANEL */}
          <aside className="w-[300px] shrink-0 border-l border-zinc-800 bg-[#0d1017] flex flex-col min-h-0">
            {!selectedPos ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <Radio className="w-7 h-7 text-zinc-700" />
                <p className="text-[11px] text-zinc-600">Fahrzeug in der Flottenliste oder auf der Karte auswählen.</p>
              </div>
            ) : (
              <>
                <header className="shrink-0 flex items-center gap-2 px-2.5 h-9 border-b border-zinc-800 bg-[#11151d]">
                  <BusIcon className="w-4 h-4 text-primary" />
                  <span className="text-[12px] font-semibold text-white truncate">{labels[selectedPos.driver_user_id]?.bus}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${FLEET_STATUS_COLOR[selectedPos.status]}22`,
                      color: FLEET_STATUS_COLOR[selectedPos.status],
                    }}
                  >
                    {FLEET_STATUS_LABEL[selectedPos.status]}
                  </span>
                  <Button size="icon" variant="ghost" className="ml-auto h-6 w-6 text-zinc-500" onClick={() => setSelected(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </header>

                <div className="flex-1 overflow-y-auto">
                  {/* FAHRZEUG */}
                  <section className="border-b border-zinc-800/80">
                    <p className="px-2.5 pt-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Fahrzeug</p>
                    <dl className="px-2.5 py-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <dt className="text-zinc-600">Fahrzeug</dt>
                      <dd className="text-zinc-100 text-right truncate">{selectedBus?.bus_number ?? labels[selectedPos.driver_user_id]?.bus}</dd>
                      <dt className="text-zinc-600">Fahrer</dt>
                      <dd className="text-zinc-100 text-right truncate">{labels[selectedPos.driver_user_id]?.driver}</dd>
                      <dt className="text-zinc-600">Geschwindigkeit</dt>
                      <dd className="text-zinc-100 text-right tabular-nums">{Math.round(selectedPos.speed_kmh)} km/h · {Math.round(selectedPos.heading)}°</dd>
                      <dt className="text-zinc-600">GPS</dt>
                      <dd className="text-right" style={{ color: health ? GPS_HEALTH_COLOR[health] : undefined }}>
                        {health ? GPS_HEALTH_LABEL[health] : "–"}
                      </dd>
                      <dt className="text-zinc-600">Standort</dt>
                      <dd className="text-zinc-100 text-right tabular-nums">
                        {selectedPos.latitude.toFixed(4)}, {selectedPos.longitude.toFixed(4)}
                      </dd>
                      <dt className="text-zinc-600">Letztes Signal</dt>
                      <dd className="text-zinc-400 text-right">{relativeAge(selectedPos.updated_at)}</dd>
                    </dl>
                  </section>

                  {/* AUFTRAG */}
                  <section className="border-b border-zinc-800/80">
                    <p className="px-2.5 pt-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Aktueller Auftrag</p>
                    {selectedOrder ? (
                      <dl className="px-2.5 py-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                        <dt className="text-zinc-600">Auftrag</dt>
                        <dd className="text-zinc-100 text-right truncate">{selectedOrder.order_number}</dd>
                        <dt className="text-zinc-600">Status</dt>
                        <dd className="text-zinc-100 text-right">{ORDER_STATUS_LABEL[selectedOrder.status]}</dd>
                        <dt className="text-zinc-600">Strecke</dt>
                        <dd className="text-zinc-100 text-right truncate">
                          {selectedOrder.origin_name ?? "Start"} → {selectedOrder.destination_name ?? "Ziel"}
                        </dd>
                        <dt className="text-zinc-600">Abfahrt</dt>
                        <dd className="text-zinc-100 text-right tabular-nums">{timeFmt(selectedOrder.departure_at)}</dd>
                        <dt className="text-zinc-600">ETA</dt>
                        <dd className="text-zinc-100 text-right tabular-nums">{timeFmt(selectedOrder.eta)}</dd>
                        <dt className="text-zinc-600">Rest</dt>
                        <dd className="text-zinc-100 text-right tabular-nums">{remainingKm != null ? formatKm(remainingKm) : "–"}</dd>
                        <dt className="text-zinc-600">Kunde</dt>
                        <dd className="text-zinc-100 text-right truncate">{selectedOrder.customer_name ?? "–"}</dd>
                        <dt className="text-zinc-600">Verspätung</dt>
                        <dd className={cn("text-right tabular-nums", delay > 0 ? "text-amber-400" : "text-emerald-400")}>
                          {delay > 0 ? `+${delay} Min.` : "pünktlich"}
                        </dd>
                      </dl>
                    ) : (
                      <Empty text="Kein aktiver Auftrag." />
                    )}
                  </section>

                  {/* LIVE-STATUS */}
                  <section className="border-b border-zinc-800/80">
                    <p className="px-2.5 pt-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Live-Status</p>
                    <div className="px-2.5 py-1.5 grid grid-cols-3 gap-1.5">
                      {[
                        { l: "GPS", v: health ? GPS_HEALTH_LABEL[health] : "–", c: health ? GPS_HEALTH_COLOR[health] : "#a1a1aa" },
                        { l: "Tempo", v: `${Math.round(selectedPos.speed_kmh)}`, c: "#e4e4e7" },
                        { l: "Versp.", v: delay > 0 ? `+${delay}′` : "0′", c: delay > 0 ? "#fbbf24" : "#34d399" },
                      ].map((s) => (
                        <div key={s.l} className="rounded border border-zinc-800 bg-[#11151d] px-1.5 py-1">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-600">{s.l}</p>
                          <p className="text-[12px] font-semibold tabular-nums truncate" style={{ color: s.c }}>{s.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-2.5 pb-2 text-[11px] space-y-0.5">
                      <p className="text-zinc-600">
                        Nächste Haltestelle:{" "}
                        <span className="text-zinc-100">{nextStop ? `${nextStop.name} (${formatKm(nextStop.km)})` : "–"}</span>
                      </p>
                      <p className="text-zinc-600">
                        Route:{" "}
                        <span className="text-zinc-100">
                          {selectedOrder?.route_geometry
                            ? `aktiv · v${selectedOrder.route_version}${selectedOrder.distance_km ? ` · ${formatKm(Number(selectedOrder.distance_km))}` : ""}`
                            : "keine Route"}
                        </span>
                      </p>
                    </div>
                  </section>

                  {/* AKTIONEN */}
                  <section className="border-b border-zinc-800/80 p-2 grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] justify-start border-zinc-700 bg-[#11151d] text-zinc-200"
                      onClick={() => {
                        const phone = selectedDriver?.phone;
                        if (!phone) return toast.error("Keine Telefonnummer beim Fahrer hinterlegt.");
                        window.location.href = `tel:${phone}`;
                      }}
                    >
                      <Phone className="w-3.5 h-3.5 mr-1" /> Anrufen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] justify-start border-zinc-700 bg-[#11151d] text-zinc-200"
                      onClick={() => setChatOpen((v) => !v)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Nachricht
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] justify-start border-zinc-700 bg-[#11151d] text-zinc-200"
                      onClick={() => {
                        setLayers((p) => ({ ...p, routes: true, buses: true }));
                        focusVehicle(selectedPos.driver_user_id);
                      }}
                    >
                      <RouteIcon className="w-3.5 h-3.5 mr-1" /> Route zeigen
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[11px] justify-start"
                      disabled={!selectedOrder}
                      onClick={() => setRerouteOpen(true)}
                    >
                      <Navigation className="w-3.5 h-3.5 mr-1" /> Umleitung
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] justify-start border-zinc-700 bg-[#11151d] text-zinc-200"
                      onClick={() => navigate(`/admin/leitstelle?order=${selectedOrder?.id ?? ""}`)}
                      disabled={!selectedOrder}
                    >
                      <ChevronRight className="w-3.5 h-3.5 mr-1" /> Auftrag
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] justify-start border-zinc-700 bg-[#11151d] text-zinc-200"
                      onClick={() => {
                        setPickPoint({ lat: selectedPos.latitude, lng: selectedPos.longitude });
                        setHazardOpen(true);
                      }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Meldung
                    </Button>
                  </section>

                  {/* FUNK */}
                  {chatOpen && (
                    <section className="p-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 mb-1">Funk / Fahrer-Chat</p>
                      <div className="max-h-40 overflow-y-auto space-y-1 mb-1.5 rounded border border-zinc-800 bg-[#11151d] p-1.5">
                        {messages.length === 0 && <p className="text-[11px] text-zinc-600">Noch keine Nachrichten.</p>}
                        {messages.slice(-20).map((m) => (
                          <p key={m.id} className={cn("text-[11px]", m.sender_role === "driver" ? "text-zinc-300" : "text-primary")}>
                            <b>{m.sender_role === "driver" ? "Fahrer" : "OPS"}:</b> {m.body}
                          </p>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Nachricht an Fahrer …"
                          className="h-7 bg-[#161b24] border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-[11px]"
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <Button size="icon" className="h-7 w-7 shrink-0" onClick={sendMessage}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </section>
                  )}

                  <p className="px-2.5 py-2 text-[10px] text-zinc-600 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    Feste Messstellen sind nur Leitstellen-Information – die Fahrer-App warnt nicht aktiv.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
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
              body: "🔄 Neue Route von der Leitstelle.",
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
    </AdminLayout>
  );
};

export default OpsCenter;
