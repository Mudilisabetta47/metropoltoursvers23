import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wrench, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminWorkshops() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ country: "DE", is_active: true });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("workshops").select("*").order("name");
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return toast.error("Name erforderlich");
    const { error } = await supabase.from("workshops").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Werkstatt gespeichert");
    setOpen(false); setForm({ country: "DE", is_active: true }); load();
  };

  const columns: DataTableColumn<any>[] = [
    { key: "name", header: "Werkstatt", accessor: r => (
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-zinc-500" />
        <div><div className="font-medium text-white">{r.name}</div><div className="text-xs text-zinc-500">{r.contact_person || "—"}</div></div>
      </div>
    ), sortValue: r => r.name },
    { key: "city", header: "Stadt", accessor: r => `${r.postal_code || ""} ${r.city || "—"}`.trim() },
    { key: "phone", header: "Kontakt", accessor: r => <div className="text-xs"><div>{r.phone || "—"}</div><div className="text-zinc-500">{r.email || ""}</div></div> },
    { key: "spec", header: "Spezialisierung", accessor: r => (r.specializations || []).slice(0, 3).join(", ") || "—" },
    { key: "rate", header: "Std.-Satz", accessor: r => r.hourly_rate ? `${Number(r.hourly_rate).toFixed(2)} €` : "—", sortValue: r => Number(r.hourly_rate || 0) },
    { key: "rating", header: "Bewertung", accessor: r => r.rating ? <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3 fill-current" />{Number(r.rating).toFixed(1)}</span> : "—", sortValue: r => Number(r.rating || 0) },
    { key: "status", header: "Status", accessor: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>{r.is_active ? "Aktiv" : "Inaktiv"}</span>
    ) },
  ];

  return (
    <AdminLayout title="Werkstätten" subtitle="Vertragspartner & Reparaturhistorie"
      actions={<Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neue Werkstatt</Button>}>
      <DataTable data={rows} columns={columns} rowKey={r => r.id} isLoading={loading} exportFilename="werkstaetten" emptyMessage="Noch keine Werkstätten erfasst" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Werkstatt anlegen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Name *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Ansprechpartner</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>E-Mail</Label><Input type="email" className="bg-white text-black" onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Stundensatz (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, hourly_rate: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Adresse</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>PLZ</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, postal_code: e.target.value })} /></div>
            <div><Label>Stadt</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div className="col-span-2"><Label>Spezialisierungen (kommagetrennt)</Label>
              <Input className="bg-white text-black" placeholder="Motor, Bremsen, Tachograph" onChange={e => setForm({ ...form, specializations: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
            <div className="col-span-2"><Label>Notizen</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
