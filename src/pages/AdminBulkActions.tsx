import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Ban, Mail, CheckCircle, XCircle, RotateCw } from "lucide-react";

interface Booking {
  id: string;
  ticket_number: string;
  passenger_first_name: string;
  passenger_last_name: string;
  passenger_email: string;
  status: string;
  price_paid: number;
  trip_id: string | null;
  created_at: string;
}

export default function AdminBulkActions() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_bookings_for_agent", { p_limit: 50, p_offset: 0, p_status: statusFilter === "all" ? null : statusFilter });
    if (error) toast.error(error.message);
    else setBookings((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.id)));
  };

  const filtered = bookings.filter(b => !search ||
    b.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
    `${b.passenger_first_name} ${b.passenger_last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const bulkStatus = async (status: string) => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} Buchung(en) auf "${status}" setzen?`)) return;
    setBusy(true);
    const { error } = await supabase.from("bookings").update({ status: status as any }).in("id", Array.from(selected));
    if (error) toast.error(error.message);
    else toast.success(`${selected.size} aktualisiert`);
    setSelected(new Set());
    setBusy(false);
    load();
  };

  const bulkCancel = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} Buchung(en) stornieren mit automatischer Erstattung?`)) return;
    setBusy(true);
    let ok = 0, fail = 0;
    for (const id of selected) {
      const { error } = await supabase.functions.invoke("cancel-booking-refund", { body: { booking_id: id, reason: "Bulk-Storno durch Admin" } });
      if (error) fail++; else ok++;
    }
    toast.success(`${ok} storniert, ${fail} fehlgeschlagen`);
    setSelected(new Set());
    setBusy(false);
    load();
  };

  const statusColor = (s: string) => ({
    confirmed: "bg-emerald-500/20 text-emerald-300",
    pending: "bg-amber-500/20 text-amber-300",
    cancelled: "bg-red-500/20 text-red-300",
    completed: "bg-blue-500/20 text-blue-300",
  }[s] || "bg-zinc-700");

  return (
    <AdminLayout title="Bulk-Aktionen" subtitle="Mehrere Buchungen gleichzeitig bearbeiten">
      <Card className="bg-[#161b22] border-zinc-800 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ticket-Nr. oder Name" className="pl-9 bg-white" />
          </div>
          <div className="flex gap-1">
            {["all", "pending", "confirmed", "cancelled"].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>{s}</Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={load}><RotateCw className="w-3 h-3" /></Button>
        </div>
        {selected.size > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-2 items-center">
            <Badge className="bg-emerald-500/20 text-emerald-300">{selected.size} ausgewählt</Badge>
            <Button size="sm" disabled={busy} onClick={() => bulkStatus("confirmed")} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Bestätigen</Button>
            <Button size="sm" disabled={busy} onClick={bulkCancel} className="bg-red-600 hover:bg-red-700"><Ban className="w-3 h-3 mr-1" />Stornieren + Refund</Button>
            <Button size="sm" disabled={busy} variant="outline" onClick={() => bulkStatus("completed")}><CheckCircle className="w-3 h-3 mr-1" />Als abgeschlossen</Button>
          </div>
        )}
      </Card>

      <Card className="bg-[#161b22] border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0f1218] text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th className="text-left p-3">Ticket</th>
                <th className="text-left p-3">Kunde</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Preis</th>
                <th className="text-left p-3">Datum</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-6 text-center text-zinc-500">Lädt…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-zinc-500">Keine Buchungen</td></tr>}
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-zinc-800 hover:bg-[#1c222b]">
                  <td className="p-3"><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} /></td>
                  <td className="p-3 font-mono text-emerald-400 text-xs">{b.ticket_number}</td>
                  <td className="p-3 text-white">{b.passenger_first_name} {b.passenger_last_name}<div className="text-xs text-zinc-500">{b.passenger_email}</div></td>
                  <td className="p-3"><Badge className={statusColor(b.status)}>{b.status}</Badge></td>
                  <td className="p-3 text-right text-white">{Number(b.price_paid).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                  <td className="p-3 text-zinc-400 text-xs">{new Date(b.created_at).toLocaleString("de-DE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
