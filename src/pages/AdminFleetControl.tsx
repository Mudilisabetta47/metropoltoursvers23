import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bus, Gauge, MapPin, MessageSquare, Plus, Radio, Send, Clock, Navigation,
  AlertTriangle, Loader2, Phone, User, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import {
  DispatchOrder, FLEET_STATUS_COLOR, FLEET_STATUS_LABEL, ORDER_STATUS_LABEL,
  useDispatchMessages, useFleetOverview, updateOrderStatus,
} from "@/hooks/useFleet";
import FleetMap from "@/components/fleet/FleetMap";
import OrderDialog from "@/components/fleet/OrderDialog";
import { buildVehicleProfile, etaFrom, formatDuration, formatKm, requestRoute, vehicleProfileWarnings } from "@/lib/navigation/routing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AdminFleetControl = () => {
  const { user } = useAuth();
  const { token, isLoading: tokenLoading } = useMapboxToken();
  const { drivers, buses, positions, orders, isLoading, reload } = useFleetOverview();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [routeGeom, setRouteGeom] = useState<GeoJSON.LineString | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null);
  const [routing, setRouting] = useState(false);

  const { messages, send } = useDispatchMessages(selectedDriver ?? undefined);

  const busById = useMemo(() => new Map(buses.map((b) => [b.id, b])), [buses]);
  const driverById = useMemo(() => new Map(drivers.map((d) => [d.user_id, d])), [drivers]);
  const posByDriver = useMemo(() => new Map(positions.map((p) => [p.driver_user_id, p])), [positions]);

  const activeOrderFor = (driverId: string): DispatchOrder | undefined =>
    orders.find((o) => o.driver_user_id === driverId && ["sent", "accepted", "en_route", "paused"].includes(o.status));

  const labels = useMemo(() => {
    const out: Record<string, { driver: string; bus: string }> = {};
    positions.forEach((p) => {
      const bus = p.bus_id ? busById.get(p.bus_id) : null;
      out[p.driver_user_id] = {
        driver: driverById.get(p.driver_user_id)?.name ?? "Fahrer",
        bus: bus?.bus_number || bus?.name || "Bus",
      };
    });
    return out;
  }, [positions, busById, driverById]);

  const selectedPos = selectedDriver ? posByDriver.get(selectedDriver) : null;
  const selectedOrder = selectedDriver ? activeOrderFor(selectedDriver) : undefined;
  const selectedBus = selectedPos?.bus_id
    ? busById.get(selectedPos.bus_id)
    : selectedOrder?.bus_id
      ? busById.get(selectedOrder.bus_id)
      : null;

  // Echte Mapbox-Route fuer den ausgewaehlten Auftrag (Position -> Ziel)
  useEffect(() => {
    setRouteGeom(null);
    setRouteInfo(null);
    if (!token || !selectedOrder?.destination_lat) return;
    const start = selectedPos
      ? { lat: selectedPos.latitude, lng: selectedPos.longitude }
      : selectedOrder.origin_lat != null
        ? { lat: Number(selectedOrder.origin_lat), lng: Number(selectedOrder.origin_lng) }
        : null;
    if (!start) return;
    setRouting(true);
    requestRoute(
      token,
      [
        start,
        ...(selectedOrder.waypoints ?? []).map((w) => ({ lat: Number(w.lat), lng: Number(w.lng) })),
        { lat: Number(selectedOrder.destination_lat), lng: Number(selectedOrder.destination_lng) },
      ],
      { vehicleProfile: buildVehicleProfile(selectedBus) },
    )
      .then((r) => {
        setRouteGeom(r.geometry);
        setRouteInfo({ km: r.distanceKm, min: r.durationMin });
      })
      .catch(() => setRouteGeom(null))
      .finally(() => setRouting(false));
  }, [token, selectedOrder?.id, selectedPos?.latitude, selectedPos?.longitude, selectedBus]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { en_route: 0, accepted: 0, break: 0, arrived: 0, offline: 0 };
    drivers.forEach((d) => {
      const p = posByDriver.get(d.user_id);
      c[p?.status ?? "offline"] = (c[p?.status ?? "offline"] ?? 0) + 1;
    });
    return c;
  }, [drivers, posByDriver]);

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedDriver || !user) return;
    await send(chatInput, user.id, "dispatcher", selectedOrder?.id ?? null);
    setChatInput("");
  };

  const cancelOrder = async (id: string) => {
    try {
      await updateOrderStatus(id, "cancelled");
      toast.success("Auftrag storniert");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout
      title="Flottenleitstelle"
      subtitle="Live-Disposition, Fahreraufträge und Navigation"
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={() => setOrderDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Auftrag senden
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_360px] gap-4 h-[calc(100vh-190px)] min-h-[640px]">
        {/* Fahrerliste */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Flotte</span>
              <Badge className="bg-zinc-800 text-zinc-300">{drivers.length} Fahrer</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(statusCounts).map(([k, v]) => (
                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${FLEET_STATUS_COLOR[k as never]}22`, color: FLEET_STATUS_COLOR[k as never] }}>
                  {FLEET_STATUS_LABEL[k as never]} {v}
                </span>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {isLoading && <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-500 mx-auto" /></div>}
              {drivers.map((d) => {
                const p = posByDriver.get(d.user_id);
                const o = activeOrderFor(d.user_id);
                const bus = p?.bus_id ? busById.get(p.bus_id) : o?.bus_id ? busById.get(o.bus_id) : null;
                const status = p?.status ?? "offline";
                return (
                  <button
                    key={d.user_id}
                    onClick={() => setSelectedDriver(d.user_id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-colors",
                      selectedDriver === d.user_id
                        ? "bg-primary/15 border-primary/50"
                        : "bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white truncate">{d.name}</span>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: FLEET_STATUS_COLOR[status] }} />
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <Bus className="w-3 h-3" />
                      {bus ? (bus.bus_number || bus.name) : "kein Bus"}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {o ? `${o.order_number} · ${ORDER_STATUS_LABEL[o.status]}` : "kein aktiver Auftrag"}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Karte */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[400px]">
          {tokenLoading && <div className="absolute inset-0 flex items-center justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}
          {!tokenLoading && !token && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <MapPin className="w-10 h-10" />
              <p>Mapbox-Token nicht verfügbar</p>
            </div>
          )}
          {token && (
            <FleetMap
              token={token}
              positions={positions}
              labels={labels}
              selectedDriverId={selectedDriver}
              onSelect={setSelectedDriver}
              routeGeometry={routeGeom}
              destination={
                selectedOrder?.destination_lat
                  ? { lat: Number(selectedOrder.destination_lat), lng: Number(selectedOrder.destination_lng), name: selectedOrder.destination_name ?? undefined }
                  : null
              }
            />
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Badge className="bg-zinc-900/90 text-zinc-200 border border-zinc-700">
              <Radio className="w-3 h-3 mr-1 text-emerald-400" /> Realtime aktiv
            </Badge>
            {routing && <Badge className="bg-zinc-900/90 text-zinc-300 border border-zinc-700">Route wird berechnet …</Badge>}
          </div>
        </div>

        {/* Detailpanel */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          {!selectedDriver ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 p-6 text-center">
              <User className="w-10 h-10" />
              <p className="text-sm">Fahrer in der Liste oder auf der Karte auswählen</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-zinc-800 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{driverById.get(selectedDriver)?.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    {selectedBus ? `${selectedBus.bus_number || selectedBus.name} · ${selectedBus.license_plate}` : "Kein Bus zugewiesen"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400" onClick={() => setSelectedDriver(null)}><X className="w-4 h-4" /></Button>
              </div>

              <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-3 mt-2 bg-zinc-800">
                  <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">Aufträge</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-y-auto p-3 space-y-3 m-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-zinc-800/60">
                      <p className="text-[10px] text-zinc-400">Status</p>
                      <p className="text-sm font-medium" style={{ color: FLEET_STATUS_COLOR[selectedPos?.status ?? "offline"] }}>
                        {FLEET_STATUS_LABEL[selectedPos?.status ?? "offline"]}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-800/60">
                      <p className="text-[10px] text-zinc-400">Geschwindigkeit</p>
                      <p className="text-sm font-medium text-white flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> {Math.round(selectedPos?.speed_kmh ?? 0)} km/h
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-800/60">
                      <p className="text-[10px] text-zinc-400">Restdistanz</p>
                      <p className="text-sm font-medium text-white">{routeInfo ? formatKm(routeInfo.km) : "–"}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-800/60">
                      <p className="text-[10px] text-zinc-400">ETA</p>
                      <p className="text-sm font-medium text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {routeInfo ? etaFrom(routeInfo.min) : "–"}
                      </p>
                    </div>
                  </div>

                  {selectedPos && (
                    <p className="text-[11px] text-zinc-500">
                      Position: {selectedPos.latitude.toFixed(4)}, {selectedPos.longitude.toFixed(4)} · Quelle: {selectedPos.source} ·{" "}
                      {new Date(selectedPos.updated_at).toLocaleTimeString("de-DE")}
                    </p>
                  )}

                  {selectedOrder ? (
                    <div className="p-3 rounded-lg bg-zinc-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{selectedOrder.order_number}</span>
                        <Badge className="bg-primary/20 text-primary text-[10px]">{ORDER_STATUS_LABEL[selectedOrder.status]}</Badge>
                      </div>
                      <p className="text-sm text-white">{selectedOrder.title}</p>
                      <p className="text-[11px] text-zinc-400 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" /> {selectedOrder.origin_address}</p>
                      <p className="text-[11px] text-zinc-400 flex items-start gap-1"><Navigation className="w-3 h-3 mt-0.5" /> {selectedOrder.destination_address}</p>
                      {selectedOrder.customer_name && (
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedOrder.customer_name} {selectedOrder.customer_phone}</p>
                      )}
                      {selectedOrder.notes && <p className="text-[11px] text-zinc-300 italic">{selectedOrder.notes}</p>}
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-primary" style={{ width: `${selectedOrder.progress_percent}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-500">{selectedOrder.progress_percent}% Routenfortschritt</p>
                      <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => cancelOrder(selectedOrder.id)}>Auftrag stornieren</Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-zinc-800/40 text-center">
                      <p className="text-xs text-zinc-400 mb-2">Kein aktiver Auftrag</p>
                      <Button size="sm" onClick={() => setOrderDialog(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Auftrag senden</Button>
                    </div>
                  )}

                  {vehicleProfileWarnings(buildVehicleProfile(selectedBus)).map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-300 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                    </p>
                  ))}
                </TabsContent>

                <TabsContent value="orders" className="flex-1 overflow-y-auto p-3 space-y-2 m-0">
                  {orders.filter((o) => o.driver_user_id === selectedDriver).map((o) => (
                    <div key={o.id} className="p-2.5 rounded-lg bg-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">{o.order_number}</span>
                        <Badge className="bg-zinc-700 text-zinc-200 text-[10px]">{ORDER_STATUS_LABEL[o.status]}</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400">{o.title}</p>
                      <p className="text-[10px] text-zinc-500">
                        {o.distance_km ? `${formatKm(Number(o.distance_km))} · ${formatDuration(Number(o.duration_min ?? 0))} · ` : ""}
                        {new Date(o.created_at).toLocaleString("de-DE")}
                      </p>
                      {o.status === "rejected" && o.reject_reason && (
                        <p className="text-[10px] text-red-400">Abgelehnt: {o.reject_reason}</p>
                      )}
                    </div>
                  ))}
                  {orders.filter((o) => o.driver_user_id === selectedDriver).length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-6">Noch keine Aufträge</p>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.map((m) => (
                      <div key={m.id} className={cn("max-w-[85%] p-2 rounded-lg text-xs", m.sender_role === "dispatcher" ? "ml-auto bg-primary/20 text-white" : "bg-zinc-800 text-zinc-200")}>
                        {m.body}
                        <div className="text-[9px] text-zinc-400 mt-0.5">{new Date(m.created_at).toLocaleTimeString("de-DE")}</div>
                      </div>
                    ))}
                    {messages.length === 0 && <p className="text-xs text-zinc-500 text-center py-6">Noch keine Nachrichten</p>}
                  </div>
                  <div className="p-2 border-t border-zinc-800 flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Nachricht an Fahrer …"
                      className="bg-white text-black"
                    />
                    <Button size="icon" onClick={sendChat}><Send className="w-4 h-4" /></Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {token && user && (
        <OrderDialog
          open={orderDialog}
          onOpenChange={setOrderDialog}
          token={token}
          drivers={drivers}
          buses={buses}
          defaultDriverId={selectedDriver}
          createdBy={user.id}
          onCreated={reload}
        />
      )}
    </AdminLayout>
  );
};

export default AdminFleetControl;
