import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Plus, Route as RouteIcon, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DispatchOrder, pushRouteUpdate } from "@/hooks/useFleet";
import {
  GeocodeResult,
  buildVehicleProfile,
  formatDuration,
  formatKm,
  geocodeAddress,
  requestRoute,
  RouteResult,
} from "@/lib/navigation/routing";

interface Stop {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

interface RerouteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  order: DispatchOrder | null;
  bus: any | null;
  currentPosition?: { lat: number; lng: number } | null;
  onDone: () => void;
}

const AddressSearch = ({ token, onPick }: { token: string; onPick: (r: GeocodeResult) => void }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setResults(await geocodeAddress(token, q));
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q, token]);

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ort oder Adresse suchen …"
        className="bg-white text-black"
      />
      {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-zinc-500" />}
      {results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 shadow-xl">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800"
              onClick={() => {
                onPick(r);
                setQ("");
                setResults([]);
              }}
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-zinc-400 truncate">{r.address}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RerouteDialog = ({
  open,
  onOpenChange,
  token,
  order,
  bus,
  currentPosition,
  onDone,
}: RerouteDialogProps) => {
  const [waypoints, setWaypoints] = useState<Stop[]>([]);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [preview, setPreview] = useState<RouteResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    setWaypoints((order.waypoints ?? []).map((w) => ({ ...w, lat: Number(w.lat), lng: Number(w.lng) })));
    setDestination(
      order.destination_lat != null
        ? {
            name: order.destination_name ?? "Ziel",
            address: order.destination_address ?? undefined,
            lat: Number(order.destination_lat),
            lng: Number(order.destination_lng),
          }
        : null,
    );
    setPreview(null);
  }, [open, order]);

  const start = useMemo(() => {
    if (currentPosition) return currentPosition;
    if (order?.origin_lat != null) return { lat: Number(order.origin_lat), lng: Number(order.origin_lng) };
    return null;
  }, [currentPosition, order]);

  const calculate = async () => {
    if (!start || !destination) {
      toast.error("Startposition oder Ziel fehlt");
      return;
    }
    setCalculating(true);
    try {
      const r = await requestRoute(
        token,
        [start, ...waypoints.map((w) => ({ lat: w.lat, lng: w.lng })), { lat: destination.lat, lng: destination.lng }],
        { vehicleProfile: buildVehicleProfile(bus) },
      );
      setPreview(r);
      toast.success("Neue Route berechnet");
    } catch (e: any) {
      toast.error(e.message ?? "Routenberechnung fehlgeschlagen");
    } finally {
      setCalculating(false);
    }
  };

  const transmit = async () => {
    if (!order || !destination || !preview) return;
    setSaving(true);
    try {
      await pushRouteUpdate(order, {
        waypoints,
        destination,
        geometry: preview.geometry,
        distanceKm: preview.distanceKm,
        durationMin: preview.durationMin,
      });
      toast.success("Neue Route an den Fahrer übertragen");
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Übertragung fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0f1218] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-primary" /> Route ändern · {order?.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-zinc-400">Aktuelle Route</Label>
            <p className="text-sm text-zinc-300 mt-1">
              {[order?.origin_name, ...(order?.waypoints ?? []).map((w) => w.name), order?.destination_name]
                .filter(Boolean)
                .join(" → ")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Zwischenstopps (neue Route)</Label>
            {waypoints.map((w, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{w.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-zinc-400"
                  onClick={() => setWaypoints(waypoints.filter((_, x) => x !== i))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <AddressSearch
              token={token}
              onPick={(r) => setWaypoints((prev) => [...prev, { name: r.name, address: r.address, lat: r.lat, lng: r.lng }])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Neues Ziel</Label>
            {destination && (
              <div className="flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm truncate flex-1">{destination.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400" onClick={() => setDestination(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <AddressSearch
              token={token}
              onPick={(r) => setDestination({ name: r.name, address: r.address, lat: r.lat, lng: r.lng })}
            />
          </div>

          {preview && (
            <div className="flex items-center gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
              <Badge className="bg-emerald-500/20 text-emerald-300">Neue Route</Badge>
              <span className="text-sm text-zinc-200">
                {formatKm(preview.distanceKm)} · {formatDuration(preview.durationMin)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-zinc-700" onClick={calculate} disabled={calculating}>
            {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Route neu berechnen
          </Button>
          <Button onClick={transmit} disabled={!preview || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            An Fahrer übertragen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RerouteDialog;
