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
}

const emptyForm: BusForm = { name: "", license_plate: "", total_seats: 50, amenities: ["wifi", "power", "wc"], is_active: true };

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
    setForm({ name: b.name, license_plate: b.license_plate, total_seats: b.total_seats, amenities: b.amenities || [], is_active: b.is_active });
    setDialogOpen(true);
  };

  const toggleAmenity = (key: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.includes(key) ? f.amenities.filter(a => a !== key) : [...f.amenities, key] }));
  };

  const save = async () => {
    if (!form.name || !form.license_plate) { toast.error("Name und Kennzeichen sind Pflicht"); return; }
    setSaving(true);
    const payload = { name: form.name, license_plate: form.license_plate, total_seats: form.total_seats, amenities: form.amenities, is_active: form.is_active };
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
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
