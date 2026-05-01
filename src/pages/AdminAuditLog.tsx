import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface AuditEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_identifier: string | null;
  details: any;
  created_at: string;
}

const actionColor = (action: string): string => {
  if (action.startsWith("REVEAL_")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (action.includes("DELETE")) return "bg-red-500/15 text-red-400 border-red-500/30";
  if (action.includes("UPDATE")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (action.includes("INSERT") || action.includes("CREATE")) return "bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30";
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
};

export default function AdminAuditLog() {
  const { isAdmin, isLoading } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_audit_logs", {
        p_limit: 200,
        p_offset: 0,
      });
      if (!error && data) setEntries(data as AuditEntry[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const columns: DataTableColumn<AuditEntry>[] = [
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
      sortValue: (r) => r.user_email ?? "",
    },
    {
      key: "action",
      header: "Aktion",
      accessor: (r) => (
        <Badge variant="outline" className={`${actionColor(r.action)} font-cockpit-mono text-[10px]`}>
          {r.action}
        </Badge>
      ),
      sortValue: (r) => r.action,
    },
    {
      key: "table_name",
      header: "Tabelle",
      accessor: (r) => <code className="text-[11px] text-zinc-400">{r.table_name}</code>,
      sortValue: (r) => r.table_name,
    },
    {
      key: "record",
      header: "Datensatz",
      accessor: (r) => (
        <span className="text-[11px] text-zinc-500 font-cockpit-mono">
          {r.record_identifier ?? r.record_id?.slice(0, 8) ?? "–"}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      accessor: (r) => (
        <details className="text-[11px] text-zinc-500 max-w-md">
          <summary className="cursor-pointer hover:text-zinc-300">anzeigen</summary>
          <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] overflow-x-auto">
            {JSON.stringify(r.details, null, 2)}
          </pre>
        </details>
      ),
    },
  ];

  return (
    <AdminLayout title="Audit-Log" subtitle="Wer hat wann was geändert? Vollständige Nachvollziehbarkeit aller PII- und Admin-Aktionen.">
      <DataTable
        data={entries}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={["action", "table_name", "user_email", "record_identifier"] as any}
        isLoading={loading}
        emptyMessage="Keine Audit-Einträge gefunden."
        exportFilename={`audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`}
      />
    </AdminLayout>
  );
}
