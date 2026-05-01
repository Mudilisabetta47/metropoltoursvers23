import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, Sticker } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const eur = (n: number | null) => (n != null ? `${Number(n).toFixed(2)} €` : "—");

const COUNTRIES = ["DE","AT","CH","FR","IT","SI","SK","CZ","HU","PL","BE","NL","LU"];

export default function AdminTollVignettes() {
  const [tolls, setTolls] = useState<any[]>([]);
  const [vignettes, setVignettes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"toll" | "vignette">("toll");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    const [t, v, b] = await Promise.all([
      supabase.from("toll_accounts").select("*, bus:buses(name, license_plate)").order("contract_end", { ascending: true, nullsFirst: false }),
      supabase.from("vignettes").select("*, bus:buses(name, license_plate)").order("valid_until", { ascending: true }),
      supabase.from("buses").select("id, name, license_plate").eq("is_active", true).order("name"),
    ]);
    setTolls(t.data || []); setVignettes(v.data || []); setBuses(b.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const table = tab === "toll" ? "toll_accounts" : "vignettes";
    const { error } = await supabase.from(table).insert(form);
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
    setOpen(false); setForm({}); load();
  };

  const tollCols: DataTableColumn<any>[] = [
    { key: "provider", header: "Anbieter", accessor: r => <span className="font-medium text-white">{r.provider}</span>, sortValue: r => r.provider },
    { key: "country", header: "Land", accessor: r => r.country },
    { key: "bus", header: "Fahrzeug", accessor: r => r.bus ? `${r.bus.name} (${r.bus.license_plate})` : "—" },
    { key: "account", header: "Konto", accessor: r => r.account_number || "—" },
    { key: "balance", header: "Guthaben", accessor: r => {
      const low = r.low_balance_threshold && r.current_balance != null && Number(r.current_balance) < Number(r.low_balance_threshold);
      return <span className={low ? "text-amber-400 font-semibold" : "text-emerald-400"}>{eur(r.current_balance)}</span>;
    }, sortValue: r => Number(r.current_balance || 0) },
    { key: "fee", header: "Mtl. Gebühr", accessor: r => eur(r.monthly_fee) },
    { key: "end", header: "Vertragsende", accessor: r => {
      if (!r.contract_end) return "—";
      const d = daysUntil(r.contract_end);
      const cls = d < 0 ? "text-red-400" : d <= 60 ? "text-amber-400" : "text-zinc-300";
      return <span className={cls}>{fmtDate(r.contract_end)}</span>;
    }, sortValue: r => r.contract_end || "" },
  ];

  const vigCols: DataTableColumn<any>[] = [
    { key: "country", header: "Land", accessor: r => <span className="font-medium text-white">{r.country}</span>, sortValue: r => r.country },
    { key: "bus", header: "Fahrzeug", accessor: r => r.bus ? `${r.bus.name} (${r.bus.license_plate})` : "—" },
    { key: "type", header: "Typ", accessor: r => r.vignette_type },
    { key: "from", header: "Gültig ab", accessor: r => fmtDate(r.valid_from), sortValue: r => r.valid_from },
    { key: "until", header: "Gültig bis", accessor: r => {
      const d = daysUntil(r.valid_until);
      const cls = d < 0 ? "text-red-400" : d <= 14 ? "text-amber-400" : "text-emerald-400";
      return <div><div className={cls}>{fmtDate(r.valid_until)}</div><div className="text-xs text-zinc-500">{d < 0 ? `abgelaufen` : `${d} T.`}</div></div>;
    }, sortValue: r => r.valid_until },
    { key: "price", header: "Preis", accessor: r => eur(r.price) },
    { key: "serial", header: "Seriennr.", accessor: r => r.serial_number || "—" },
  ];

  return (
    <AdminLayout title="Mautkonten & Vignetten" subtitle="Toll Collect, Go-Box, Europa-Vignetten"
      actions={<Button onClick={() => { setForm({}); setOpen(true); }} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neuer Eintrag</Button>}>
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="toll" className="data-[state=active]:bg-zinc-800"><CreditCard className="w-4 h-4 mr-2" />Mautkonten</TabsTrigger>
          <TabsTrigger value="vignette" className="data-[state=active]:bg-zinc-800"><Sticker className="w-4 h-4 mr-2" />Vignetten</TabsTrigger>
        </TabsList>
        <TabsContent value="toll" className="mt-4">
          <DataTable data={tolls} columns={tollCols} rowKey={r => r.id} isLoading={loading} exportFilename="mautkonten" emptyMessage="Keine Mautkonten" />
        </TabsContent>
        <TabsContent value="vignette" className="mt-4">
          <DataTable data={vignettes} columns={vigCols} rowKey={r => r.id} isLoading={loading} exportFilename="vignetten" emptyMessage="Keine Vignetten" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>{tab === "toll" ? "Mautkonto" : "Vignette"} hinzufügen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fahrzeug</Label>
              <Select value={form.bus_id} onValueChange={v => setForm({ ...form, bus_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>{buses.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Land</Label>
              <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Land" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {tab === "toll" ? (
              <>
                <div className="col-span-2"><Label>Anbieter *</Label><Input className="bg-white text-black" placeholder="Toll Collect, ASFINAG..." onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
                <div><Label>Konto-Nr.</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, account_number: e.target.value })} /></div>
                <div><Label>Geräte-ID</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, device_id: e.target.value })} /></div>
                <div><Label>Aktuelles Guthaben (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, current_balance: Number(e.target.value) })} /></div>
                <div><Label>Niedrig-Schwelle (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, low_balance_threshold: Number(e.target.value) })} /></div>
                <div><Label>Mtl. Gebühr (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, monthly_fee: Number(e.target.value) })} /></div>
                <div><Label>Vertragsende</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, contract_end: e.target.value })} /></div>
              </>
            ) : (
              <>
                <div><Label>Vignette-Typ</Label><Input className="bg-white text-black" placeholder="10-Tage, 1-Monat, Jahr" onChange={e => setForm({ ...form, vignette_type: e.target.value })} /></div>
                <div><Label>Seriennummer</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
                <div><Label>Gültig ab *</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, valid_from: e.target.value })} /></div>
                <div><Label>Gültig bis *</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
                <div><Label>Preis (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
                <div><Label>Erinnerung (Tage)</Label><Input type="number" className="bg-white text-black" defaultValue={14} onChange={e => setForm({ ...form, reminder_days: Number(e.target.value) })} /></div>
              </>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
