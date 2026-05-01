import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Trash2, Search, UserPlus } from "lucide-react";

interface WaitlistEntry {
  id: string;
  position: number;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string | null;
  seats_requested: number;
  status: string;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  trip_id: string | null;
  tour_date_id: string | null;
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("waiting");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("waitlist_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setEntries((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notify = async (id: string) => {
    const { error } = await supabase.functions.invoke("waitlist-notify", { body: { entry_id: id } });
    if (error) return toast.error(error.message);
    toast.success("Benachrichtigung gesendet");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Eintrag wirklich entfernen?")) return;
    const { error } = await supabase.from("waitlist_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entfernt");
    load();
  };

  const filtered = entries.filter(e => {
    if (filter !== "all" && e.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return e.passenger_name?.toLowerCase().includes(q) || e.passenger_email?.toLowerCase().includes(q);
  });

  const statusColor = (s: string) => ({
    waiting: "bg-zinc-700 text-zinc-200",
    notified: "bg-amber-500/20 text-amber-300",
    converted: "bg-emerald-500/20 text-emerald-300",
    expired: "bg-red-500/20 text-red-300",
  }[s] || "bg-zinc-700 text-zinc-200");

  return (
    <AdminLayout title="Wartelisten" subtitle="Auto-Nachrücken bei freien Plätzen">
      <Card className="p-4 mb-4 bg-[#161b22] border-zinc-800">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name oder E-Mail" className="pl-9 bg-white" />
          </div>
          <div className="flex gap-1">
            {["waiting", "notified", "converted", "expired", "all"].map(s => (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
                {s === "all" ? "Alle" : s}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-[#161b22] border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0f1218] text-zinc-400 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Pos.</th>
                <th className="text-left p-3">Kunde</th>
                <th className="text-left p-3">Plätze</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Erstellt</th>
                <th className="text-left p-3">Frist</th>
                <th className="text-right p-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center text-zinc-500">Lädt…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-zinc-500">Keine Einträge</td></tr>}
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-zinc-800 hover:bg-[#1c222b]">
                  <td className="p-3 font-mono text-emerald-400">#{e.position}</td>
                  <td className="p-3 text-white">
                    <div className="font-medium">{e.passenger_name}</div>
                    <div className="text-xs text-zinc-500">{e.passenger_email}</div>
                  </td>
                  <td className="p-3 text-white">{e.seats_requested}</td>
                  <td className="p-3"><Badge className={statusColor(e.status)}>{e.status}</Badge></td>
                  <td className="p-3 text-zinc-400 text-xs">{new Date(e.created_at).toLocaleString("de-DE")}</td>
                  <td className="p-3 text-zinc-400 text-xs">{e.expires_at ? new Date(e.expires_at).toLocaleString("de-DE") : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      {e.status === "waiting" && (
                        <Button size="sm" variant="outline" onClick={() => notify(e.id)}>
                          <Bell className="w-3 h-3 mr-1" /> Benachrichtigen
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => remove(e.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
