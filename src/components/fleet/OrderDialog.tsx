import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Plus, Trash2, Route as RouteIcon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  GeoPoint,
  GeocodeResult,
  buildVehicleProfile,
  formatKm,
  formatDuration,
  geocodeAddress,
  requestRoute,
  vehicleProfileWarnings,
} from "@/lib/navigation/routing";
import { FleetDriver } from "@/hooks/useFleet";

const db = supabase as any;

interface AddressFieldProps {
  label: string;
  token: string;
  value: { name: string; address: string; lat: number | null; lng: number | null };
  onChange: (v: { name: string; address: string; lat: number | null; lng: number | null }) => void;
}

const AddressField = ({ label, token, value, onChange }: AddressFieldProps) => {
  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || query.trim().length < 3 || query === value.address) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await geocodeAddress(token, query);
      setResults(r);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, token, open, value.address]);

  return (
    <div className="space-y-1.5 relative">
      <Label className="text-white">{label}</Label>
      <Input
        value={query}
        placeholder="Adresse suchen …"
        className="bg-white text-black"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {value.lat != null && (
        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {value.lat.toFixed(4)}, {value.lng?.toFixed(4)}
        </p>
      )}
      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg max-h-56 overflow-y-auto shadow-xl">
          {loading && <div className="p-3 text-xs text-zinc-400">Suche …</div>}
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800"
              onClick={() => {
                onChange({ name: r.name, address: r.address, lat: r.lat, lng: r.lng });
                setQuery(r.address);
                setResults([]);
                setOpen(false);
              }}
            >
              {r.address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const emptyAddr = { name: "", address: "", lat: null as number | null, lng: null as number | null };
/** Zwischenhalt inkl. Planzeit und Art – wird als echte Haltestelle an den Fahrer übergeben. */
const emptyStop = { ...emptyAddr, time: "", type: "stop", dwell: 5 };
type StopDraft = typeof emptyStop;

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  drivers: FleetDriver[];
  buses: any[];
  defaultDriverId?: string | null;
  createdBy: string;
  onCreated: () => void;
}

const OrderDialog = ({
  open,
  onOpenChange,
  token,
  drivers,
  buses,
  defaultDriverId,
  createdBy,
  onCreated,
}: OrderDialogProps) => {
  const [title, setTitle] = useState("");
  const [driverId, setDriverId] = useState(defaultDriverId ?? "");
  const [busId, setBusId] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("normal");
  const [departure, setDeparture] = useState("");
  const [origin, setOrigin] = useState(emptyAddr);
  const [destination, setDestination] = useState(emptyAddr);
  const [waypoints, setWaypoints] = useState<StopDraft[]>([]);
  const [preview, setPreview] = useState<{ km: number; min: number } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDriverId(defaultDriverId ?? "");
  }, [open, defaultDriverId]);

  const bus = useMemo(() => buses.find((b) => b.id === busId), [buses, busId]);
  const warnings = vehicleProfileWarnings(buildVehicleProfile(bus));

  const calcRoute = async () => {
    if (origin.lat == null || destination.lat == null) {
      toast.error("Bitte Start und Ziel über die Adresssuche wählen");
      return;
    }
    setCalculating(true);
    try {
      const points: GeoPoint[] = [
        { lat: origin.lat, lng: origin.lng! },
        ...waypoints.filter((w) => w.lat != null).map((w) => ({ lat: w.lat!, lng: w.lng! })),
        { lat: destination.lat, lng: destination.lng! },
      ];
      const r = await requestRoute(token, points, { vehicleProfile: buildVehicleProfile(bus) });
      setPreview({ km: r.distanceKm, min: r.durationMin });
    } catch (e: any) {
      toast.error(e.message ?? "Route konnte nicht berechnet werden");
    } finally {
      setCalculating(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !driverId || origin.lat == null || destination.lat == null) {
      toast.error("Titel, Fahrer, Start und Ziel sind erforderlich");
      return;
    }
    setSaving(true);
    try {
      const dep = departure ? new Date(departure).toISOString() : null;
      const eta =
        preview && dep ? new Date(new Date(dep).getTime() + preview.min * 60000).toISOString() : null;

      const { data: created, error } = await db.from("dispatch_orders").insert({
        title: title.trim(),
        driver_user_id: driverId,
        bus_id: busId || null,
        customer_name: customer || null,
        customer_phone: phone || null,
        origin_name: origin.name,
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_name: destination.name,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        waypoints: waypoints
          .filter((w) => w.lat != null)
          .map((w) => ({ name: w.name, address: w.address, lat: w.lat, lng: w.lng })),
        departure_at: dep,
        notes: notes || null,
        priority,
        status: "sent",
        distance_km: preview?.km ?? null,
        duration_min: preview?.min ?? null,
        eta,
        created_by: createdBy,
      }).select("id").single();
      if (error) throw error;

      // Zwischenhalte und Ziel als echte Haltestellen fuer die Fahrer-Navi anlegen
      const stopRows = [
        ...waypoints
          .filter((w) => w.lat != null)
          .map((w, i) => ({
            order_id: created.id,
            sort_order: i,
            name: w.name || w.address,
            address: w.address,
            lat: w.lat,
            lng: w.lng,
            stop_type: w.type,
            dwell_minutes: Number(w.dwell) || 0,
            planned_arrival: w.time ? new Date(w.time).toISOString() : null,
          })),
        {
          order_id: created.id,
          sort_order: waypoints.length,
          name: destination.name || destination.address,
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng,
          stop_type: "destination",
          dwell_minutes: 0,
          planned_arrival: eta,
        },
      ];
      const { error: stopError } = await db.from("dispatch_order_stops").insert(stopRows);
      if (stopError) throw stopError;

      toast.success("Auftrag an Fahrer gesendet");
      setTitle(""); setCustomer(""); setPhone(""); setNotes(""); setDeparture("");
      setOrigin(emptyAddr); setDestination(emptyAddr); setWaypoints([]); setPreview(null);

      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Auftrag konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0f1218] border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Neuen Fahrauftrag senden</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Der Fahrer erhält den Auftrag sofort in der Fahrer-Navi und kann ihn annehmen oder ablehnen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white">Auftragstitel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white text-black" placeholder="z. B. Vereinsfahrt Bremen – Hamburg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Fahrer *</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrer wählen" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => <SelectItem key={d.user_id} value={d.user_id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Bus</Label>
              <Select value={busId} onValueChange={setBusId}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrzeug wählen" /></SelectTrigger>
                <SelectContent>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bus_number ? `${b.bus_number} · ` : ""}{b.name} ({b.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Abfahrtszeit</Label>
              <Input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} className="bg-white text-black" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Kunde</Label>
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} className="bg-white text-black" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Telefon Kunde</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white text-black" />
            </div>
          </div>

          <AddressField label="Startadresse *" token={token} value={origin} onChange={setOrigin} />

          {waypoints.map((w, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 p-3 space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <AddressField
                    label={`Halt ${i + 1}`}
                    token={token}
                    value={w}
                    onChange={(v) => setWaypoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...v } : p)))}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-red-400 mb-1" onClick={() => setWaypoints((p) => p.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-white text-xs">Planankunft</Label>
                  <Input
                    type="datetime-local"
                    value={w.time}
                    className="bg-white text-black"
                    onChange={(e) => setWaypoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, time: e.target.value } : p)))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white text-xs">Art</Label>
                  <Select
                    value={w.type}
                    onValueChange={(v) => setWaypoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, type: v } : p)))}
                  >
                    <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stop">Haltestelle</SelectItem>
                      <SelectItem value="pickup">Zustieg</SelectItem>
                      <SelectItem value="dropoff">Ausstieg</SelectItem>
                      <SelectItem value="break">Pausenhalt</SelectItem>
                      <SelectItem value="border">Grenzübergang</SelectItem>
                      <SelectItem value="toll">Mautstelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-white text-xs">Aufenthalt (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={w.dwell}
                    className="bg-white text-black"
                    onChange={(e) => setWaypoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, dwell: Number(e.target.value) } : p)))}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setWaypoints((p) => [...p, { ...emptyStop }])}>
            <Plus className="w-4 h-4 mr-1" /> Halt hinzufügen
          </Button>


          <AddressField label="Zieladresse *" token={token} value={destination} onChange={setDestination} />

          <div className="space-y-1.5">
            <Label className="text-white">Notizen für den Fahrer</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white text-black" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white">Priorität</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
              <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Fahrzeugprofil-Hinweise
              </p>
              {warnings.map((w, i) => <p key={i} className="text-[11px] text-amber-200/80">{w}</p>)}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={calcRoute} disabled={calculating}>
              {calculating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RouteIcon className="w-4 h-4 mr-1" />}
              Route berechnen
            </Button>
            {preview && (
              <Badge className="bg-emerald-500/20 text-emerald-300">
                {formatKm(preview.km)} · {formatDuration(preview.min)}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Auftrag senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
