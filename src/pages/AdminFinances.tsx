import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminFinances = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!authLoading && user && isAdmin) loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    const [bookingsRes, paymentsRes] = await Promise.all([
      supabase.from("tour_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("tour_payment_entries").select("*").order("recorded_at", { ascending: false }),
    ]);
    setBookings(bookingsRes.data || []);
    setPayments(paymentsRes.data || []);
    setIsLoading(false);
  };

  const filterByPeriod = (items: any[], dateField: string) => {
    if (period === "all") return items;
    const cutoff = new Date();
    if (period === "month") cutoff.setMonth(cutoff.getMonth() - 1);
    else if (period === "quarter") cutoff.setMonth(cutoff.getMonth() - 3);
    else if (period === "year") cutoff.setFullYear(cutoff.getFullYear() - 1);
    return items.filter(i => new Date(i[dateField]) >= cutoff);
  };

  const filteredBookings = filterByPeriod(bookings, "created_at");
  const filteredPayments = filterByPeriod(payments, "recorded_at");
  const totalRevenue = filteredBookings.filter(b => b.status !== "cancelled").reduce((s: number, b: any) => s + Number(b.total_price), 0);
  const totalPaid = filteredPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const openAmount = filteredBookings.filter(b => b.status === "pending").reduce((s: number, b: any) => s + Number(b.total_price), 0);
  const netRevenue = totalPaid / 1.19;
  const taxAmount = totalPaid - netRevenue;

  const exportCSV = () => {
    const rows = [
      ["Buchungsnr.", "Kunde", "E-Mail", "Betrag", "Status", "Zahlungsart", "Datum", "Bezahlt am"].join(";"),
      ...filteredBookings.map((b: any) => [b.booking_number, `${b.contact_first_name} ${b.contact_last_name}`, b.contact_email, b.total_price, b.status, b.payment_method || "", format(new Date(b.created_at), "dd.MM.yyyy"), b.paid_at ? format(new Date(b.paid_at), "dd.MM.yyyy") : ""].join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `finanzen-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast({ title: "✅ CSV exportiert" });
  };

  return (
    <AdminLayout title="Finanzen" subtitle="Umsatz, offene Posten & Exporte" actions={
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-white">Gesamt</SelectItem>
            <SelectItem value="month" className="text-white">Monat</SelectItem>
            <SelectItem value="quarter" className="text-white">Quartal</SelectItem>
            <SelectItem value="year" className="text-white">Jahr</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
      </div>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Umsatz (brutto)</div><div className="text-2xl font-bold text-emerald-400">{totalRevenue.toFixed(2)}€</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Eingegangen</div><div className="text-2xl font-bold text-emerald-400">{totalPaid.toFixed(2)}€</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Offen</div><div className="text-2xl font-bold text-red-400">{openAmount.toFixed(2)}€</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Netto</div><div className="text-2xl font-bold text-white">{netRevenue.toFixed(2)}€</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">MwSt</div><div className="text-2xl font-bold text-zinc-400">{taxAmount.toFixed(2)}€</div></CardContent></Card>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Zahlungseingänge ({filteredPayments.length})</CardTitle></CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine Zahlungen</p> : (
                <Table>
                  <TableHeader><TableRow className="border-zinc-800"><TableHead className="text-zinc-400">Datum</TableHead><TableHead className="text-zinc-400">Betrag</TableHead><TableHead className="text-zinc-400">Methode</TableHead><TableHead className="text-zinc-400">Referenz</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredPayments.slice(0, 50).map((p: any) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300">{format(new Date(p.recorded_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                        <TableCell className="text-emerald-400 font-semibold">{Number(p.amount).toFixed(2)}€</TableCell>
                        <TableCell className="text-zinc-300">{p.method === "bank_transfer" ? "Überweisung" : p.method}</TableCell>
                        <TableCell className="text-zinc-400">{p.reference || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Buchungen ({filteredBookings.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="border-zinc-800"><TableHead className="text-zinc-400">Nr.</TableHead><TableHead className="text-zinc-400">Kunde</TableHead><TableHead className="text-zinc-400">Betrag</TableHead><TableHead className="text-zinc-400">Status</TableHead><TableHead className="text-zinc-400">Datum</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredBookings.slice(0, 100).map((b: any) => (
                    <TableRow key={b.id} className="border-zinc-800 cursor-pointer hover:bg-zinc-800" onClick={() => navigate(`/admin/booking/${b.id}`)}>
                      <TableCell className="text-emerald-400 font-mono">{b.booking_number}</TableCell>
                      <TableCell className="text-white">{b.contact_first_name} {b.contact_last_name}</TableCell>
                      <TableCell className="text-white font-semibold">{Number(b.total_price).toFixed(2)}€</TableCell>
                      <TableCell><Badge className={b.status === "confirmed" ? "bg-emerald-600" : b.status === "pending" ? "bg-amber-600" : "bg-red-600"}>{b.status}</Badge></TableCell>
                      <TableCell className="text-zinc-300">{format(new Date(b.created_at), "dd.MM.yy", { locale: de })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFinances;
