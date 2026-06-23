import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { RefreshCw, X } from "lucide-react";

interface PaymentAuditEntry {
  id: string;
  booking_id: string | null;
  user_id: string | null;
  provider: string | null;
  operation: string | null;
  order_id: string | null;
  capture_id: string | null;
  expected_amount: number | null;
  actual_amount: number | null;
  currency: string | null;
  paypal_status: string | null;
  result_status: string | null;
  error_code: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

const statusColor = (s: string | null) => {
  switch (s) {
    case "success":
      return "bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30";
    case "failure":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "fraud_suspected":
      return "bg-rose-600/20 text-rose-300 border-rose-500/40";
    case "duplicate":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
};

const fmtAmount = (a: number | null, c: string | null) =>
  a == null ? "–" : new Intl.NumberFormat("de-DE", { style: "currency", currency: c || "EUR" }).format(Number(a));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminPaymentAudit() {
  const { isAdmin, isLoading } = useAuth();
  const [rows, setRows] = useState<PaymentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState("");
  const [userId, setUserId] = useState("");
  const [resultStatus, setResultStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("payment_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (bookingId.trim() && UUID_RE.test(bookingId.trim())) q = q.eq("booking_id", bookingId.trim());
    if (userId.trim() && UUID_RE.test(userId.trim())) q = q.eq("user_id", userId.trim());
    if (resultStatus !== "all") q = q.eq("result_status", resultStatus);
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }

    const { data, error } = await q;
    if (error) setError(error.message);
    setRows((data as PaymentAuditEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const reset = () => {
    setBookingId("");
    setUserId("");
    setResultStatus("all");
    setFrom("");
    setTo("");
    setTimeout(load, 0);
  };

  const stats = useMemo(() => {
    const s = { total: rows.length, success: 0, failure: 0, fraud: 0, duplicate: 0 };
    rows.forEach((r) => {
      if (r.result_status === "success") s.success++;
      else if (r.result_status === "failure") s.failure++;
      else if (r.result_status === "fraud_suspected") s.fraud++;
      else if (r.result_status === "duplicate") s.duplicate++;
    });
    return s;
  }, [rows]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const columns: DataTableColumn<PaymentAuditEntry>[] = [
    {
      key: "created_at",
      header: "Zeitpunkt",
      accessor: (r) => (
        <span className="font-cockpit-mono text-[12px] text-zinc-300">
          {format(new Date(r.created_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
        </span>
      ),
      sortValue: (r) => new Date(r.created_at),
      width: "170px",
    },
    {
      key: "provider",
      header: "Provider",
      accessor: (r) => <span className="text-zinc-300">{r.provider ?? "–"}</span>,
      sortValue: (r) => r.provider ?? "",
    },
    {
      key: "operation",
      header: "Operation",
      accessor: (r) => <code className="text-[11px] text-zinc-400">{r.operation ?? "–"}</code>,
      sortValue: (r) => r.operation ?? "",
    },
    {
      key: "result_status",
      header: "Status",
      accessor: (r) => (
        <Badge variant="outline" className={`${statusColor(r.result_status)} font-cockpit-mono text-[10px]`}>
          {r.result_status ?? "–"}
        </Badge>
      ),
      sortValue: (r) => r.result_status ?? "",
    },
    {
      key: "amount",
      header: "Betrag (ist / soll)",
      accessor: (r) => (
        <span className="font-cockpit-mono text-[12px] text-zinc-200">
          {fmtAmount(r.actual_amount, r.currency)}
          <span className="text-zinc-500"> / {fmtAmount(r.expected_amount, r.currency)}</span>
        </span>
      ),
      sortValue: (r) => Number(r.actual_amount ?? 0),
    },
    {
      key: "order_id",
      header: "PayPal Order",
      accessor: (r) => <code className="text-[11px] text-zinc-400">{r.order_id ?? "–"}</code>,
      sortValue: (r) => r.order_id ?? "",
    },
    {
      key: "booking_id",
      header: "Buchung",
      accessor: (r) => (
        <code className="text-[11px] text-zinc-500 font-cockpit-mono">{r.booking_id?.slice(0, 8) ?? "–"}</code>
      ),
      sortValue: (r) => r.booking_id ?? "",
    },
    {
      key: "user_id",
      header: "User",
      accessor: (r) => (
        <code className="text-[11px] text-zinc-500 font-cockpit-mono">{r.user_id?.slice(0, 8) ?? "–"}</code>
      ),
    },
    {
      key: "error",
      header: "Fehler",
      accessor: (r) =>
        r.error_code || r.error_message ? (
          <span className="text-[11px] text-red-400">
            {r.error_code && <code className="mr-1">{r.error_code}</code>}
            {r.error_message}
          </span>
        ) : (
          <span className="text-zinc-600">–</span>
        ),
    },
    {
      key: "details",
      header: "Details",
      accessor: (r) => (
        <details className="text-[11px] text-zinc-500 max-w-md">
          <summary className="cursor-pointer hover:text-zinc-300">anzeigen</summary>
          <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] overflow-x-auto">
            {JSON.stringify(
              {
                capture_id: r.capture_id,
                paypal_status: r.paypal_status,
                ip: r.ip_address,
                ua: r.user_agent,
                metadata: r.metadata,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Zahlungs-Auditlog"
      subtitle="Vollständige Nachverfolgung aller PayPal Create/Capture-Versuche inkl. Beträge, Status und Fehlern."
    >
      {/* Filter */}
      <div className="cockpit-glass rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <Label className="text-[11px] text-zinc-400">Booking-ID (UUID)</Label>
          <Input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="00000000-0000-…"
            className="h-9 bg-white/5 border-zinc-800 text-white font-cockpit-mono text-xs"
          />
        </div>
        <div className="lg:col-span-2">
          <Label className="text-[11px] text-zinc-400">User-ID (UUID)</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="00000000-0000-…"
            className="h-9 bg-white/5 border-zinc-800 text-white font-cockpit-mono text-xs"
          />
        </div>
        <div>
          <Label className="text-[11px] text-zinc-400">Status</Label>
          <Select value={resultStatus} onValueChange={setResultStatus}>
            <SelectTrigger className="h-9 bg-white/5 border-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="success">success</SelectItem>
              <SelectItem value="failure">failure</SelectItem>
              <SelectItem value="fraud_suspected">fraud_suspected</SelectItem>
              <SelectItem value="duplicate">duplicate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-zinc-400">Von</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 bg-white/5 border-zinc-800 text-white"
          />
        </div>
        <div>
          <Label className="text-[11px] text-zinc-400">Bis</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 bg-white/5 border-zinc-800 text-white"
          />
        </div>
        <div className="lg:col-span-6 flex items-center gap-2">
          <Button size="sm" onClick={load} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Anwenden
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5 mr-1.5" />
            Zurücksetzen
          </Button>
          <div className="ml-auto flex flex-wrap gap-3 text-[11px] text-zinc-400">
            <span>Gesamt: <span className="text-white font-cockpit-mono">{stats.total}</span></span>
            <span className="text-[#00CC36]">✓ {stats.success}</span>
            <span className="text-red-400">✗ {stats.failure}</span>
            <span className="text-amber-400">⊘ {stats.duplicate}</span>
            <span className="text-rose-300">⚠ {stats.fraud}</span>
          </div>
        </div>
        {error && <div className="lg:col-span-6 text-xs text-red-400">{error}</div>}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={["order_id", "capture_id", "booking_id", "user_id", "error_code", "error_message", "operation"] as any}
        isLoading={loading}
        emptyMessage="Keine Auditeinträge für die aktuellen Filter."
        exportFilename={`payment-audit-${format(new Date(), "yyyy-MM-dd")}.csv`}
      />
    </AdminLayout>
  );
}
