import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { HAZARD_META, HazardType } from "@/lib/ops/hazards";
import { geocodeAddress } from "@/lib/navigation/routing";

interface HazardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  presetPoint?: { lat: number; lng: number } | null;
  onCreate: (payload: any) => Promise<void>;
}

const HazardDialog = ({ open, onOpenChange, token, presetPoint, onCreate }: HazardDialogProps) => {
  const [type, setType] = useState<HazardType>("construction");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speed, setSpeed] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (presetPoint) {
      setLat(presetPoint.lat.toFixed(6));
      setLng(presetPoint.lng.toFixed(6));
    }
  }, [presetPoint]);

  const locate = async () => {
    const res = await geocodeAddress(token, query);
    if (!res.length) {
      toast.error("Keine Adresse gefunden");
      return;
    }
    setLat(res[0].lat.toFixed(6));
    setLng(res[0].lng.toFixed(6));
    if (!title) setTitle(res[0].name);
    toast.success(res[0].address);
  };

  const submit = async () => {
    if (!title.trim() || !lat || !lng) {
      toast.error("Titel und Position erforderlich");
      return;
    }
    setBusy(true);
    try {
      await onCreate({
        hazard_type: type,
        title: title.trim(),
        description: description.trim() || null,
        latitude: Number(lat),
        longitude: Number(lng),
        speed_limit_kmh: speed ? Number(speed) : null,
        severity,
      });
      toast.success("Meldung angelegt");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setSpeed("");
    } catch (e: any) {
      toast.error(e.message ?? "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0f1218] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Verkehrsmeldung anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-zinc-400">Typ</Label>
            <Select value={type} onValueChange={(v) => setType(v as HazardType)}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(HAZARD_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>
                    {m.icon} {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white text-black" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white text-black" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Tempolimit (km/h)</Label>
              <Input value={speed} onChange={(e) => setSpeed(e.target.value)} className="bg-white text-black" inputMode="numeric" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Schweregrad</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Position per Adresse</Label>
            <div className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="bg-white text-black" placeholder="A2 Anschlussstelle Peine" />
              <Button variant="outline" className="border-zinc-700 shrink-0" onClick={locate}>
                Suchen
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Breitengrad</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Längengrad</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} className="bg-white text-black" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Hinweis: Messstellen sind reine OPS-Information. Die Fahrer-App gibt daraus keine Blitzerwarnung aus.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Meldung speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HazardDialog;
