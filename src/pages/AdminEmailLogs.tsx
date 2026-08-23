import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, MailCheck, MailX, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface LogRow {
  id: string;
  template_name: string | null;
  recipient_email: string | null;
  message_id: string | null;
  status: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const RANGES = [
  { key: "24h", label: "Letzte 24 Std.", hours: 24 },
  { key: "7d", label: "Letzte 7 Tage", hours: 24 * 7 },
  { key: "30d", label: "Letzte 30 Tage", hours: 24 * 30 },
  { key: "all", label: "Gesamt", hours: 0 },
];

const statusStyle = (s: string | null) => {
  switch (s) {
    case "sent": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "failed":
    case "dlq": return "bg-red-500/15 text-red-400 border-red-500/30";
    case "suppressed": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default: return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
};

const AdminEmailLogs = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [status, setStatus] = useState("all");
  const [template, setTemplate] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LogRow | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("email_send_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const r = RANGES.find(x => x.key === range);
    if (r?.hours) {
      q = q.gte("created_at", new Date(Date.now() - r.hours * 3600_000).toISOString());
    }
    const { data } = await q;
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line */ }, [range]);

  const templates = useMemo(
    () => Array.from(new Set(rows.map(r => r.template_name).filter(Boolean))) as string[],
    [rows],
  );

  /** Pro message_id nur der aktuellste Eintrag. */
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter(r => {
      const key = r.message_id ?? r.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deduped.filter(r => {
      if (status !== "all" && r.status !== status) return false;
      if (template !== "all" && r.template_name !== template) return false;
      if (!q) return true;
      const meta = r.metadata ?? {};
      return [
        r.recipient_email, r.template_name, r.message_id,
        meta.subject, meta.booking_number, meta.sent_by_email,
      ].some(v => String(v ?? "").toLowerCase().includes(q));
    });
  }, [deduped, status, template, query]);

  const stats = useMemo(() => ({
    total: deduped.length,
    sent: deduped.filter(r => r.status === "sent").length,
    failed: deduped.filter(r => r.status === "failed" || r.status === "dlq").length,
    suppressed: deduped.filter(r => r.status === "suppressed").length,
  }), [deduped]);

  return (
    <AdminLayout title="E-Mail Protokoll">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">E-Mail Protokoll</h1>
            <p className="text-sm text-zinc-500">Alle Versandvorgänge inkl. Status, Fehler und Message-ID</p>
          </div>
          <Button variant="outline" onClick={fetchLogs} className="border-[#2a3040] text-zinc-300 gap-2 h-9">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Aktualisieren
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Gesamt", value: stats.total, icon: Send, color: "text-zinc-300" },
            { label: "Zugestellt", value: stats.sent, icon: MailCheck, color: "text-emerald-400" },
            { label: "Fehlgeschlagen", value: stats.failed, icon: MailX, color: "text-red-400" },
            { label: "Blockiert", value: stats.suppressed, icon: AlertTriangle, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1f2a] border border-[#2a3040] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-44 bg-[#1a1f2a] border-[#2a3040] text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
              {RANGES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-[#1a1f2a] border-[#2a3040] text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="sent">Zugestellt</SelectItem>
              <SelectItem value="failed">Fehlgeschlagen</SelectItem>
              <SelectItem value="suppressed">Blockiert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-52 bg-[#1a1f2a] border-[#2a3040] text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
              <SelectItem value="all">Alle Typen</SelectItem>
              {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Empfänger, Betreff, Buchungsnummer..."
              className="pl-9 bg-[#1a1f2a] border-[#2a3040] text-white h-9" />
          </div>
        </div>

        <div className="bg-[#1a1f2a] border border-[#2a3040] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#151920] text-zinc-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Zeitpunkt</th>
                  <th className="text-left px-4 py-3 font-medium">Typ</th>
                  <th className="text-left px-4 py-3 font-medium">Empfänger</th>
                  <th className="text-left px-4 py-3 font-medium">Betreff</th>
                  <th className="text-left px-4 py-3 font-medium">Buchung</th>
                  <th className="text-left px-4 py-3 font-medium">Gesendet von</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className="border-t border-[#2a3040] hover:bg-[#212836] cursor-pointer">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {format(new Date(r.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{r.template_name}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.recipient_email}</td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[240px] truncate">{r.metadata?.subject ?? "–"}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.metadata?.booking_number ?? "–"}</td>
                    <td className="px-4 py-3 text-zinc-500">{r.metadata?.sent_by_email ?? "System"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusStyle(r.status)}>{r.status ?? "unbekannt"}</Badge>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">Keine Einträge gefunden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="bg-[#1a1f2a] border border-[#2a3040] rounded-xl p-4 space-y-2">
            <p className="text-sm text-white font-medium">Details</p>
            <p className="text-xs text-zinc-500">Message-ID: <span className="text-zinc-300">{selected.message_id ?? "–"}</span></p>
            <p className="text-xs text-zinc-500">Absender: <span className="text-zinc-300">{selected.metadata?.from ?? "–"}</span></p>
            <p className="text-xs text-zinc-500">Anhänge: <span className="text-zinc-300">{(selected.metadata?.attachments ?? []).join(", ") || "keine"}</span></p>
            {selected.error_message && (
              <p className="text-xs text-red-400 break-all">Fehler: {selected.error_message}</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEmailLogs;
