import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Entry {
  id: string;
  user_email: string | null;
  tool_name: string;
  input: any;
  output: any;
  status: "success" | "error" | "denied";
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

const statusColor = (s: string) =>
  s === "success"
    ? "bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30"
    : s === "denied"
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";

export default function AdminCopilotAudit() {
  const { isAdmin, isLoading } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("copilot_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows((data as Entry[]) ?? []);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const columns: DataTableColumn<Entry>[] = [
    {
      key: "created_at",
      header: "Zeitpunkt",
      accessor: (r) => (
        <span className="font-cockpit-mono text-[12px] text-zinc-300">
          {format(new Date(r.created_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
        </span>
      ),
      sortValue: (r) => new Date(r.created_at),
      width: "180px",
    },
    {
      key: "user_email",
      header: "Benutzer",
      accessor: (r) => <span className="text-zinc-200">{r.user_email ?? "–"}</span>,
    },
    {
      key: "tool_name",
      header: "Tool",
      accessor: (r) => <code className="text-[11px] text-zinc-300">{r.tool_name}</code>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <Badge variant="outline" className={`${statusColor(r.status)} text-[10px]`}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "duration_ms",
      header: "Dauer",
      accessor: (r) => (
        <span className="text-[11px] text-zinc-400 font-cockpit-mono">
          {r.duration_ms ?? 0} ms
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      accessor: (r) => (
        <details className="text-[11px] text-zinc-500 max-w-md">
          <summary className="cursor-pointer hover:text-zinc-300">
            {r.error ? "Fehler anzeigen" : "Ein-/Ausgabe anzeigen"}
          </summary>
          <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] overflow-x-auto max-h-64">
            {JSON.stringify({ input: r.input, output: r.output, error: r.error }, null, 2)}
          </pre>
        </details>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Copilot Audit-Log"
      subtitle="Vollständige Protokollierung aller KI-Tool-Aufrufe."
    >
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={["tool_name", "user_email", "status"] as any}
        isLoading={loading}
        emptyMessage="Noch keine Copilot-Aktionen protokolliert."
        exportFilename={`copilot-audit-${format(new Date(), "yyyy-MM-dd")}.csv`}
      />
    </AdminLayout>
  );
}
