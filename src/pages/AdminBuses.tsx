import { useState, useEffect } from "react";
import { Plus, Loader2, Bus, Pencil, Trash2, Wifi, Plug, Bath, Wind, Tv, Usb } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AMENITIES = [
  { key: "wifi", label: "WLAN", icon: Wifi },
  { key: "power", label: "Steckdosen", icon: Plug },
  { key: "wc", label: "WC", icon: Bath },
  { key: "ac", label: "Klimaanlage", icon: Wind },
  { key: "tv", label: "TV", icon: Tv },
  { key: "usb", label: "USB", icon: Usb },
];

interface BusForm {
  name: string;
  license_plate: string;
  total_seats: number;
  amenities: string[];
  is_active: boolean;
  bus_number: string;
  height_cm: string;
  width_cm: string;
  length_cm: string;
  weight_kg: string;
  axles: string;
  emission_class: string;
  fuel_type: string;
  routing_notes: string;
}

const emptyForm: BusForm = { name: "", license_plate: "", total_seats: 50, amenities: ["wifi", "power", "wc"], is_active: true, bus_number: "", height_cm: "", width_cm: "", length_cm: "", weight_kg: "", axles: "", emission_class: "", fuel_type: "", routing_notes: "" };

const AdminBuses = () => {
  const [buses, setBuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusForm>(emptyForm);

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("buses").select("*").order("name");
    setBuses(data || []);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (b: any) => {
    setEditingId(b.id);
    setForm({
      name: b.name, license_plate: b.license_plate, total_seats: b.total_seats,
      amenities: b.amenities || [], is_active: b.is_active,
      bus_number: b.bus_number ?? "", height_cm: b.height_cm?.toString() ?? "",
      width_cm: b.width_cm?.toString() ?? "", length_cm: b.length_cm?.toString() ?? "",
      weight_kg: b.weight_kg?.toString() ?? "", axles: b.axles?.toString() ?? "",
      emission_class: b.emission_class ?? "", fuel_type: b.fuel_type ?? "", routing_notes: b.routing_notes ?? "",
    });
    setDialogOpen(true);
  };

  const toggleAmenity = (key: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.includes(key) ? f.amenities.filter(a => a !== key) : [...f.amenities, key] }));
  };

  const save = async () => {
    if (!form.name || !form.license_plate) { toast.error("Name und Kennzeichen sind Pflicht"); return; }
    setSaving(true);
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    const payload: any = {
      name: form.name, license_plate: form.license_plate, total_seats: form.total_seats,
      amenities: form.amenities, is_active: form.is_active,
      bus_number: form.bus_number || null,
      height_cm: num(form.height_cm), width_cm: num(form.width_cm), length_cm: num(form.length_cm),
      weight_kg: num(form.weight_kg), axles: num(form.axles),
      emission_class: form.emission_class || null, fuel_type: form.fuel_type || null,
      routing_notes: form.routing_notes || null,
    };
    const { error } = editingId
      ? await supabase.from("buses").update(payload).eq("id", editingId)
      : await supabase.from("buses").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Bus aktualisiert" : "Bus angelegt");
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("buses").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); } else { toast.success("Bus gelöscht"); }
    setDeleteId(null);
    load();
  };

  const amenityIcon = (key: string) => {
    const a = AMENITIES.find(x => x.key === key);
    if (!a) return null;
    const Icon = a.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <AdminLayout
      title="Fahrzeuge"
      subtitle="Busflotte verwalten"
      actions={<Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Neues Fahrzeug</Button>}
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Kennzeichen</TableHead>
                  <TableHead className="text-zinc-400">Sitzplätze</TableHead>
                  <TableHead className="text-zinc-400">Ausstattung</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((b) => (
                  <TableRow key={b.id} className="border-zinc-800">
                    <TableCell className="text-white font-medium">{b.name}</TableCell>
                    <TableCell className="text-zinc-300 font-mono">{b.license_plate}</TableCell>
                    <TableCell className="text-zinc-300">{b.total_seats}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {(b.amenities || []).map((a: string) => (
                          <span key={a} className="text-zinc-400" title={AMENITIES.find(x => x.key === a)?.label || a}>{amenityIcon(a)}</span>
                        ))}
                        {(!b.amenities || b.amenities.length === 0) && <span className="text-zinc-600">–</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={b.is_active ? "bg-emerald-600" : "bg-zinc-600"}>{b.is_active ? "Aktiv" : "Inaktiv"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4 text-zinc-400" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {buses.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-8">Keine Fahrzeuge vorhanden</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"}</DialogTitle>
            <DialogDescription className="text-zinc-400">Fahrzeugdaten eingeben</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Name *</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. MT-01 Setra" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Kennzeichen *</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white font-mono" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} placeholder="z.B. WI-MT 100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Sitzplätze</Label>
              <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.total_seats} onChange={e => setForm(f => ({ ...f, total_seats: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Ausstattung</Label>
              <div className="grid grid-cols-3 gap-2">
                {AMENITIES.map(a => (
                  <label key={a.key} className="flex items-center gap-2 cursor-pointer text-zinc-300 text-sm">
                    <Checkbox checked={form.amenities.includes(a.key)} onCheckedChange={() => toggleAmenity(a.key)} />
                    <a.icon className="w-3.5 h-3.5" /> {a.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <p className="text-sm font-semibold text-white">Fahrzeugprofil (für Bus-Routing)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Busnummer</Label>
                  <Input className="bg-zinc-800 border-zinc-700 text-white" value={form.bus_number} onChange={e => setForm(f => ({ ...f, bus_number: e.target.value }))} placeholder="z.B. MT-07" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Achsen</Label>
                  <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.axles} onChange={e => setForm(f => ({ ...f, axles: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Höhe (cm)</Label>
                  <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} placeholder="380" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Breite (cm)</Label>
                  <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.width_cm} onChange={e => setForm(f => ({ ...f, width_cm: e.target.value }))} placeholder="255" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Länge (cm)</Label>
                  <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.length_cm} onChange={e => setForm(f => ({ ...f, length_cm: e.target.value }))} placeholder="1370" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Gewicht (kg)</Label>
                  <Input type="number" className="bg-zinc-800 border-zinc-700 text-white" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="19000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Emissionsklasse</Label>
                  <Input className="bg-zinc-800 border-zinc-700 text-white" value={form.emission_class} onChange={e => setForm(f => ({ ...f, emission_class: e.target.value }))} placeholder="Euro 6" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300">Kraftstoff</Label>
                  <Input className="bg-zinc-800 border-zinc-700 text-white" value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))} placeholder="Diesel" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Routing-Hinweise</Label>
                <Input className="bg-zinc-800 border-zinc-700 text-white" value={form.routing_notes} onChange={e => setForm(f => ({ ...f, routing_notes: e.target.value }))} placeholder="z.B. keine Innenstadt Bremen Altstadt" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-zinc-300">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}{editingId ? "Speichern" : "Anlegen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Fahrzeug löschen?</DialogTitle>
            <DialogDescription className="text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={confirmDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBuses;
