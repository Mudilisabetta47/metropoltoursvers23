import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  Download, Loader2, AlertTriangle, Plus, FileText, Receipt,
  Upload, Trash2, Eye, Save, CreditCard, TrendingUp, Fuel, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const AdminFinances = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [overdueFilter, setOverdueFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  // Modals
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ booking_id: "", notes: "" });
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "fuel", description: "", amount: 0, tax_rate: 19,
    expense_date: format(new Date(), "yyyy-MM-dd"), payment_method: "cash",
    vendor: "", notes: "",
  });
  const [expenseFile, setExpenseFile] = useState<File | null>(null);

  useEffect(() => { if (!authLoading && user && isAdmin) loadData(); }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    const [bookingsRes, paymentsRes, invoicesRes, expensesRes] = await Promise.all([
      supabase.from("tour_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("tour_payment_entries").select("*").order("recorded_at", { ascending: false }),
      supabase.from("tour_invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    ]);
    setBookings(bookingsRes.data || []);
    setPayments(paymentsRes.data || []);
    setInvoices(invoicesRes.data || []);
    setExpenses(expensesRes.data || []);
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
  const filteredInvoices = filterByPeriod(invoices, "created_at");
  const filteredExpenses = filterByPeriod(expenses, "expense_date");

  const totalRevenue = filteredBookings.filter(b => b.status !== "cancelled").reduce((s: number, b: any) => s + Number(b.total_price), 0);
  const totalPaid = filteredPayments.filter((p: any) => Number(p.amount) > 0).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRefunded = filteredPayments.filter((p: any) => Number(p.amount) < 0).reduce((s: number, p: any) => s + Math.abs(Number(p.amount)), 0);
  const openAmount = filteredBookings.filter(b => b.status === "pending").reduce((s: number, b: any) => s + Number(b.total_price), 0);
  const totalExpenses = filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netRevenue = totalPaid / 1.19;
  const taxAmount = totalPaid - netRevenue;
  const profit = totalPaid - totalRefunded - totalExpenses;

  // Open items
  const openItems = filteredBookings
    .filter((b: any) => b.status === "pending")
    .map((b: any) => {
      const days = differenceInDays(new Date(), new Date(b.created_at));
      return { ...b, daysOpen: days, dunningLevel: days > 14 ? 3 : days > 7 ? 2 : days > 3 ? 1 : 0 };
    })
    .filter((b: any) => {
      if (overdueFilter === "all") return true;
      if (overdueFilter === "overdue7") return b.daysOpen > 7;
      if (overdueFilter === "overdue14") return b.daysOpen > 14;
      return b.dunningLevel >= parseInt(overdueFilter.replace("level", "") || "0");
    })
    .sort((a: any, b: any) => b.daysOpen - a.daysOpen);

  // ─── Invoice creation ───
  const createInvoice = async () => {
    if (!invoiceForm.booking_id) return;
    setProcessing("invoice");
    try {
      const booking = bookings.find(b => b.id === invoiceForm.booking_id);
      if (!booking) throw new Error("Buchung nicht gefunden");

      const year = new Date().getFullYear();
      const count = invoices.filter(i => i.invoice_number?.startsWith(`RE-${year}`)).length + 1;
      const invoiceNumber = `RE-${year}-${String(count).padStart(4, "0")}`;
      const amount = Number(booking.total_price);
      const netAmt = amount / 1.19;
      const taxAmt = amount - netAmt;

      const { error } = await supabase.from("tour_invoices").insert({
        booking_id: booking.id,
        invoice_number: invoiceNumber,
        amount,
        net_amount: Math.round(netAmt * 100) / 100,
        tax_amount: Math.round(taxAmt * 100) / 100,
        tax_rate: 19,
        status: booking.paid_at ? "paid" : "issued",
        issued_at: new Date().toISOString(),
        paid_at: booking.paid_at || null,
        notes: invoiceForm.notes || null,
      });
      if (error) throw error;
      toast({ title: `✅ Rechnung ${invoiceNumber} erstellt` });
      setInvoiceModal(false);
      setInvoiceForm({ booking_id: "", notes: "" });
      loadData();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally { setProcessing(null); }
  };

  // ─── Expense creation ───
  const createExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return;
    setProcessing("expense");
    try {
      const amount = Number(expenseForm.amount);
      const taxRate = Number(expenseForm.tax_rate);
      const netAmt = amount / (1 + taxRate / 100);
      const taxAmt = amount - netAmt;

      let receiptUrl = null;
      let receiptFilename = null;

      if (expenseFile) {
        const ext = expenseFile.name.split(".").pop();
        const path = `expenses/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("tour-documents").upload(path, expenseFile, { upsert: true });
        if (uploadError) throw uploadError;
        receiptUrl = path;
        receiptFilename = expenseFile.name;
      }

      const { error } = await supabase.from("expenses").insert({
        category: expenseForm.category,
        description: expenseForm.description,
        amount,
        tax_rate: taxRate,
        tax_amount: Math.round(taxAmt * 100) / 100,
        net_amount: Math.round(netAmt * 100) / 100,
        expense_date: expenseForm.expense_date,
        payment_method: expenseForm.payment_method,
        vendor: expenseForm.vendor || null,
        notes: expenseForm.notes || null,
        receipt_url: receiptUrl,
        receipt_filename: receiptFilename,
        recorded_by: user?.id,
        status: "approved",
      });
      if (error) throw error;
      toast({ title: "✅ Ausgabe erfasst" });
      setExpenseModal(false);
      setExpenseForm({ category: "fuel", description: "", amount: 0, tax_rate: 19, expense_date: format(new Date(), "yyyy-MM-dd"), payment_method: "cash", vendor: "", notes: "" });
      setExpenseFile(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally { setProcessing(null); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Ausgabe wirklich löschen?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    toast({ title: "✅ Gelöscht" }); loadData();
  };

  const cancelInvoice = async (id: string) => {
    if (!confirm("Rechnung wirklich stornieren?")) return;
    const { error } = await supabase.from("tour_invoices").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    toast({ title: "✅ Rechnung storniert" }); loadData();
  };

  const markInvoicePaid = async (id: string) => {
    const { error } = await supabase.from("tour_invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    toast({ title: "✅ Als bezahlt markiert" }); loadData();
  };

  // ─── CSV Exports ───
  const exportCSV = () => {
    const rows = [
      ["Buchungsnr.", "Kunde", "E-Mail", "Betrag", "Status", "Zahlungsart", "Datum", "Bezahlt am"].join(";"),
      ...filteredBookings.map((b: any) => [b.booking_number, `${b.contact_first_name} ${b.contact_last_name}`, b.contact_email, b.total_price, b.status, b.payment_method || "", format(new Date(b.created_at), "dd.MM.yyyy"), b.paid_at ? format(new Date(b.paid_at), "dd.MM.yyyy") : ""].join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `finanzen-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    toast({ title: "✅ CSV exportiert" });
  };

  const exportOpenItemsCSV = () => {
    const rows = [
      ["Buchungsnr.", "Kunde", "E-Mail", "Betrag", "Tage offen", "Mahnstufe", "Buchungsdatum"].join(";"),
      ...openItems.map((b: any) => [b.booking_number, `${b.contact_first_name} ${b.contact_last_name}`, b.contact_email, b.total_price, b.daysOpen, b.dunningLevel, format(new Date(b.created_at), "dd.MM.yyyy")].join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `offene-posten-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    toast({ title: "✅ CSV exportiert" });
  };

  const exportExpensesCSV = () => {
    const rows = [
      ["Datum", "Kategorie", "Beschreibung", "Lieferant", "Brutto", "Netto", "MwSt", "Zahlungsart", "Beleg"].join(";"),
      ...filteredExpenses.map((e: any) => [format(new Date(e.expense_date), "dd.MM.yyyy"), e.category, e.description, e.vendor || "", e.amount, e.net_amount, e.tax_amount, e.payment_method, e.receipt_filename || ""].join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ausgaben-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    toast({ title: "✅ CSV exportiert" });
  };

  const exportInvoicesCSV = () => {
    const rows = [
      ["Rechnungsnr.", "Buchung", "Brutto", "Netto", "MwSt", "Status", "Ausgestellt", "Bezahlt"].join(";"),
      ...filteredInvoices.map((i: any) => {
        const b = bookings.find(bk => bk.id === i.booking_id);
        return [i.invoice_number, b?.booking_number || "", i.amount, i.net_amount, i.tax_amount, i.status, i.issued_at ? format(new Date(i.issued_at), "dd.MM.yyyy") : "", i.paid_at ? format(new Date(i.paid_at), "dd.MM.yyyy") : ""].join(";");
      }),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rechnungen-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    toast({ title: "✅ CSV exportiert" });
  };

  const getDunningBadge = (level: number) => {
    const map: Record<number, { label: string; cls: string }> = {
      0: { label: "Aktuell", cls: "bg-zinc-700/50 text-zinc-300 border-zinc-600/40" },
      1: { label: "Stufe 1", cls: "bg-amber-500/20 text-amber-300 border-amber-600/40" },
      2: { label: "Stufe 2", cls: "bg-orange-500/20 text-orange-300 border-orange-600/40" },
      3: { label: "Stufe 3", cls: "bg-red-500/20 text-red-300 border-red-600/40" },
    };
    const m = map[level] || map[0];
    return <Badge className={cn("text-[10px] border", m.cls)}>{m.label}</Badge>;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: "Entwurf", cls: "bg-zinc-700/50 text-zinc-300 border-zinc-600/40" },
      issued: { label: "Ausgestellt", cls: "bg-blue-500/20 text-blue-300 border-blue-600/40" },
      paid: { label: "Bezahlt", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" },
      cancelled: { label: "Storniert", cls: "bg-red-500/20 text-red-300 border-red-600/40" },
    };
    const m = map[status] || map.draft;
    return <Badge className={cn("text-[10px] border", m.cls)}>{m.label}</Badge>;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "fuel": return <Fuel className="w-3.5 h-3.5 text-amber-400" />;
      case "maintenance": return <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />;
      case "toll": return <CreditCard className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Receipt className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      fuel: "Kraftstoff", maintenance: "Wartung/Reparatur", toll: "Maut",
      parking: "Parkgebühren", cleaning: "Reinigung", insurance: "Versicherung",
      office: "Bürobedarf", marketing: "Marketing", other: "Sonstiges",
    };
    return map[cat] || cat;
  };

  // Bookings without invoice
  const bookingsWithoutInvoice = bookings.filter(b =>
    b.status !== "cancelled" && !invoices.some(i => i.booking_id === b.id && i.status !== "cancelled")
  );

  return (
    <AdminLayout title="Buchhaltung" subtitle="Rechnungen, Ausgaben, offene Posten & Exporte" actions={
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 bg-[#1a1f2a] border-[#2a3040] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
            <SelectItem value="all" className="text-white">Gesamt</SelectItem>
            <SelectItem value="month" className="text-white">Letzter Monat</SelectItem>
            <SelectItem value="quarter" className="text-white">Quartal</SelectItem>
            <SelectItem value="year" className="text-white">Jahr</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
      </div>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Umsatz (brutto)", value: fmt(totalRevenue), cls: "text-emerald-400", icon: TrendingUp },
              { label: "Eingegangen", value: fmt(totalPaid), cls: "text-emerald-400", icon: CreditCard },
              { label: "Offen", value: fmt(openAmount), cls: "text-red-400", icon: AlertTriangle },
              { label: "Erstattet", value: fmt(totalRefunded), cls: "text-orange-400", icon: null },
              { label: "Ausgaben", value: fmt(totalExpenses), cls: "text-red-400", icon: Receipt },
              { label: "Netto-Umsatz", value: fmt(netRevenue), cls: "text-zinc-100", icon: null },
              { label: "MwSt (19%)", value: fmt(taxAmount), cls: "text-zinc-400", icon: null },
              { label: "Gewinn (ca.)", value: fmt(profit), cls: profit >= 0 ? "text-emerald-400" : "text-red-400", icon: null },
            ].map((kpi, i) => (
              <Card key={i} className="bg-[#151920] border-[#252b38]">
                <CardContent className="pt-3 pb-2 px-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    {kpi.icon && <kpi.icon className="w-3 h-3" />} {kpi.label}
                  </div>
                  <div className={cn("text-lg font-bold", kpi.cls)}>{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="invoices" className="space-y-4">
            <TabsList className="bg-[#151920] border border-[#252b38] flex-wrap h-auto gap-0.5 p-1">
              {[
                { value: "invoices", icon: FileText, label: `Rechnungen (${filteredInvoices.length})` },
                { value: "expenses", icon: Receipt, label: `Ausgaben (${filteredExpenses.length})` },
                { value: "open-items", icon: AlertTriangle, label: `Offene Posten (${openItems.length})` },
                { value: "payments", icon: CreditCard, label: "Zahlungseingänge" },
                { value: "all-bookings", icon: Eye, label: "Alle Buchungen" },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs gap-1">
                  <tab.icon className="w-3 h-3" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ─── INVOICES ─── */}
            <TabsContent value="invoices">
              <Card className="bg-[#151920] border-[#252b38]">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm text-zinc-400">Rechnungen</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => setInvoiceModal(true)}>
                        <Plus className="w-3 h-3 mr-1" /> Rechnung erstellen
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={exportInvoicesCSV}>
                        <Download className="w-3 h-3 mr-1" /> CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredInvoices.length === 0 ? (
                    <p className="text-zinc-500 text-sm py-6 text-center">Noch keine Rechnungen erstellt</p>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="border-[#252b38]">
                        <TableHead className="text-zinc-400 text-xs">Rechnungsnr.</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Buchung</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Kunde</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Brutto</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Netto</TableHead>
                        <TableHead className="text-zinc-400 text-xs">MwSt</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Ausgestellt</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Aktionen</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredInvoices.map((inv: any, i: number) => {
                          const b = bookings.find(bk => bk.id === inv.booking_id);
                          return (
                            <TableRow key={inv.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                              <TableCell className="text-emerald-400 font-mono text-xs">{inv.invoice_number}</TableCell>
                              <TableCell className="text-zinc-300 text-xs font-mono cursor-pointer hover:text-emerald-400" onClick={() => b && navigate(`/admin/booking/${b.id}`)}>{b?.booking_number || "–"}</TableCell>
                              <TableCell className="text-zinc-200 text-xs">{b ? `${b.contact_first_name} ${b.contact_last_name}` : "–"}</TableCell>
                              <TableCell className="text-zinc-100 text-xs font-semibold">{fmt(Number(inv.amount))}</TableCell>
                              <TableCell className="text-zinc-400 text-xs">{fmt(Number(inv.net_amount))}</TableCell>
                              <TableCell className="text-zinc-400 text-xs">{fmt(Number(inv.tax_amount))}</TableCell>
                              <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                              <TableCell className="text-zinc-300 text-xs">{inv.issued_at ? format(new Date(inv.issued_at), "dd.MM.yy", { locale: de }) : "–"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {inv.status === "issued" && (
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400" onClick={() => markInvoicePaid(inv.id)}>Bezahlt</Button>
                                  )}
                                  {inv.status !== "cancelled" && (
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400" onClick={() => cancelInvoice(inv.id)}>Storno</Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── EXPENSES ─── */}
            <TabsContent value="expenses">
              <Card className="bg-[#151920] border-[#252b38]">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-sm text-zinc-400">Ausgaben & Belege</CardTitle>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Tankbelege, Maut, Wartung und sonstige Betriebskosten</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => setExpenseModal(true)}>
                        <Plus className="w-3 h-3 mr-1" /> Ausgabe erfassen
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={exportExpensesCSV}>
                        <Download className="w-3 h-3 mr-1" /> CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Expense category summary */}
                  {filteredExpenses.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                      {["fuel", "maintenance", "toll", "parking", "other"].map(cat => {
                        const catTotal = filteredExpenses.filter(e => e.category === cat).reduce((s: number, e: any) => s + Number(e.amount), 0);
                        if (catTotal === 0) return null;
                        return (
                          <div key={cat} className="bg-[#1a1f2a] border border-[#2a3040] rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
                              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                            </div>
                            <div className="text-sm font-bold text-zinc-200">{fmt(catTotal)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredExpenses.length === 0 ? (
                    <p className="text-zinc-500 text-sm py-6 text-center">Noch keine Ausgaben erfasst</p>
                  ) : (
                    <Table>
                      <TableHeader><TableRow className="border-[#252b38]">
                        <TableHead className="text-zinc-400 text-xs">Datum</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Kategorie</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Beschreibung</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Lieferant</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Brutto</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Netto</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Zahlungsart</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Beleg</TableHead>
                        <TableHead className="text-zinc-400 text-xs"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredExpenses.map((exp: any, i: number) => (
                          <TableRow key={exp.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                            <TableCell className="text-zinc-300 text-xs">{format(new Date(exp.expense_date), "dd.MM.yy", { locale: de })}</TableCell>
                            <TableCell><div className="flex items-center gap-1.5 text-xs text-zinc-200">{getCategoryIcon(exp.category)} {getCategoryLabel(exp.category)}</div></TableCell>
                            <TableCell className="text-zinc-200 text-xs max-w-[200px] truncate">{exp.description}</TableCell>
                            <TableCell className="text-zinc-400 text-xs">{exp.vendor || "–"}</TableCell>
                            <TableCell className="text-red-400 text-xs font-semibold">{fmt(Number(exp.amount))}</TableCell>
                            <TableCell className="text-zinc-400 text-xs">{fmt(Number(exp.net_amount))}</TableCell>
                            <TableCell className="text-zinc-300 text-xs">{exp.payment_method === "cash" ? "Bar" : exp.payment_method === "card" ? "Karte" : exp.payment_method === "bank_transfer" ? "Überweisung" : exp.payment_method}</TableCell>
                            <TableCell>
                              {exp.receipt_url ? (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400" onClick={() => {
                                  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/tour-documents/${exp.receipt_url}`;
                                  window.open(url, "_blank");
                                }}><Eye className="w-3 h-3 mr-0.5" /> Beleg</Button>
                              ) : <span className="text-zinc-600 text-[10px]">–</span>}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={() => deleteExpense(exp.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── OPEN ITEMS ─── */}
            <TabsContent value="open-items">
              <Card className="bg-[#151920] border-[#252b38]">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm text-zinc-400">Offene Posten</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                        <SelectTrigger className="w-44 bg-[#1a1f2a] border-[#2a3040] text-white text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="all" className="text-white">Alle offenen</SelectItem>
                          <SelectItem value="overdue7" className="text-white">Überfällig &gt; 7 Tage</SelectItem>
                          <SelectItem value="overdue14" className="text-white">Überfällig &gt; 14 Tage</SelectItem>
                          <SelectItem value="level1" className="text-white">Mahnstufe ≥ 1</SelectItem>
                          <SelectItem value="level2" className="text-white">Mahnstufe ≥ 2</SelectItem>
                          <SelectItem value="level3" className="text-white">Mahnstufe 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 text-xs h-8" onClick={exportOpenItemsCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {openItems.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine offenen Posten</p> : (
                    <Table>
                      <TableHeader><TableRow className="border-[#252b38]">
                        <TableHead className="text-zinc-400 text-xs">Nr.</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Kunde</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Betrag</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Tage offen</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Mahnstufe</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Datum</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {openItems.map((b: any, i: number) => (
                          <TableRow key={b.id} className={cn("border-[#252b38] cursor-pointer hover:bg-[#1e2430]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")} onClick={() => navigate(`/admin/booking/${b.id}`)}>
                            <TableCell className="text-emerald-400 font-mono text-xs">{b.booking_number}</TableCell>
                            <TableCell className="text-zinc-200 text-xs">{b.contact_first_name} {b.contact_last_name}</TableCell>
                            <TableCell className="text-red-400 font-semibold text-xs">{fmt(Number(b.total_price))}</TableCell>
                            <TableCell className={cn("font-medium text-xs", b.daysOpen > 7 ? "text-red-400" : b.daysOpen > 3 ? "text-amber-400" : "text-zinc-300")}>{b.daysOpen} Tage</TableCell>
                            <TableCell>{getDunningBadge(b.dunningLevel)}</TableCell>
                            <TableCell className="text-zinc-300 text-xs">{format(new Date(b.created_at), "dd.MM.yy", { locale: de })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PAYMENTS ─── */}
            <TabsContent value="payments">
              <Card className="bg-[#151920] border-[#252b38]">
                <CardHeader><CardTitle className="text-sm text-zinc-400">Zahlungseingänge ({filteredPayments.length})</CardTitle></CardHeader>
                <CardContent>
                  {filteredPayments.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine Zahlungen</p> : (
                    <Table>
                      <TableHeader><TableRow className="border-[#252b38]">
                        <TableHead className="text-zinc-400 text-xs">Datum</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Betrag</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Methode</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Referenz</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Notiz</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredPayments.slice(0, 100).map((p: any, i: number) => (
                          <TableRow key={p.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                            <TableCell className="text-zinc-300 text-xs">{format(new Date(p.recorded_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                            <TableCell className={cn("font-semibold text-xs", Number(p.amount) < 0 ? "text-orange-400" : "text-emerald-400")}>{Number(p.amount) < 0 ? "" : "+"}{fmt(Number(p.amount))}</TableCell>
                            <TableCell className="text-zinc-300 text-xs">{p.method === "bank_transfer" ? "Überweisung" : p.method === "refund" ? "Erstattung" : p.method === "cash" ? "Bar" : p.method === "stripe" ? "Stripe" : p.method}</TableCell>
                            <TableCell className="text-zinc-400 text-xs font-mono">{p.reference || "–"}</TableCell>
                            <TableCell className="text-zinc-400 text-xs">{p.note || "–"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ALL BOOKINGS ─── */}
            <TabsContent value="all-bookings">
              <Card className="bg-[#151920] border-[#252b38]">
                <CardHeader><CardTitle className="text-sm text-zinc-400">Buchungen ({filteredBookings.length})</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow className="border-[#252b38]">
                      <TableHead className="text-zinc-400 text-xs">Nr.</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Kunde</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Betrag</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Zahlung</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Datum</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredBookings.slice(0, 100).map((b: any, i: number) => (
                        <TableRow key={b.id} className={cn("border-[#252b38] cursor-pointer hover:bg-[#1e2430]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")} onClick={() => navigate(`/admin/booking/${b.id}`)}>
                          <TableCell className="text-emerald-400 font-mono text-xs">{b.booking_number}</TableCell>
                          <TableCell className="text-zinc-200 text-xs">{b.contact_first_name} {b.contact_last_name}</TableCell>
                          <TableCell className="text-zinc-100 font-semibold text-xs">{fmt(Number(b.total_price))}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] border",
                              b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" :
                              b.status === "pending" ? "bg-amber-500/20 text-amber-300 border-amber-600/40" :
                              "bg-red-500/20 text-red-300 border-red-600/40"
                            )}>{b.status === "confirmed" ? "Bestätigt" : b.status === "pending" ? "Offen" : "Storniert"}</Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400 text-xs">{b.payment_method === "bank_transfer" ? "Überweisung" : b.payment_method === "stripe" ? "Stripe" : b.payment_method || "–"}</TableCell>
                          <TableCell className="text-zinc-300 text-xs">{format(new Date(b.created_at), "dd.MM.yy", { locale: de })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ══════ INVOICE MODAL ══════ */}
      <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white">
          <DialogHeader><DialogTitle>Rechnung erstellen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-400 text-xs">Buchung auswählen</Label>
              <Select value={invoiceForm.booking_id} onValueChange={(v) => setInvoiceForm(f => ({ ...f, booking_id: v }))}>
                <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue placeholder="Buchung wählen..." /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2a] border-[#2a3040] max-h-60">
                  {bookingsWithoutInvoice.map(b => (
                    <SelectItem key={b.id} value={b.id} className="text-white">
                      {b.booking_number} – {b.contact_first_name} {b.contact_last_name} ({fmt(Number(b.total_price))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bookingsWithoutInvoice.length === 0 && <p className="text-zinc-500 text-[10px] mt-1">Alle Buchungen haben bereits eine Rechnung</p>}
            </div>
            {invoiceForm.booking_id && (() => {
              const sel = bookings.find(b => b.id === invoiceForm.booking_id);
              if (!sel) return null;
              const amt = Number(sel.total_price);
              return (
                <div className="bg-[#1a1f2a] border border-[#2a3040] rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-400">Bruttobetrag</span><span className="text-zinc-100 font-semibold">{fmt(amt)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Netto</span><span className="text-zinc-300">{fmt(amt / 1.19)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">MwSt (19%)</span><span className="text-zinc-300">{fmt(amt - amt / 1.19)}</span></div>
                </div>
              );
            })()}
            <div>
              <Label className="text-zinc-400 text-xs">Notiz (optional)</Label>
              <Textarea value={invoiceForm.notes} onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" placeholder="z.B. Sonderkonditionen..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInvoiceModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={createInvoice} disabled={!invoiceForm.booking_id || processing === "invoice"}>
              {processing === "invoice" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />} Rechnung erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ EXPENSE MODAL ══════ */}
      <Dialog open={expenseModal} onOpenChange={setExpenseModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white max-w-lg">
          <DialogHeader><DialogTitle>Ausgabe erfassen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Kategorie</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    <SelectItem value="fuel" className="text-white">🛢️ Kraftstoff</SelectItem>
                    <SelectItem value="maintenance" className="text-white">🔧 Wartung / Reparatur</SelectItem>
                    <SelectItem value="toll" className="text-white">🛣️ Maut</SelectItem>
                    <SelectItem value="parking" className="text-white">🅿️ Parkgebühren</SelectItem>
                    <SelectItem value="cleaning" className="text-white">🧹 Reinigung</SelectItem>
                    <SelectItem value="insurance" className="text-white">🛡️ Versicherung</SelectItem>
                    <SelectItem value="office" className="text-white">📎 Bürobedarf</SelectItem>
                    <SelectItem value="marketing" className="text-white">📢 Marketing</SelectItem>
                    <SelectItem value="other" className="text-white">📦 Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Datum</Label>
                <Input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Beschreibung</Label>
              <Input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" placeholder="z.B. Diesel OMV Autobahn A2" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Betrag (brutto, €)</Label>
                <Input type="number" step="0.01" value={expenseForm.amount || ""} onChange={e => setExpenseForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">MwSt (%)</Label>
                <Select value={String(expenseForm.tax_rate)} onValueChange={(v) => setExpenseForm(f => ({ ...f, tax_rate: parseInt(v) }))}>
                  <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    <SelectItem value="19" className="text-white">19%</SelectItem>
                    <SelectItem value="7" className="text-white">7%</SelectItem>
                    <SelectItem value="0" className="text-white">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Zahlungsart</Label>
                <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    <SelectItem value="cash" className="text-white">Bar</SelectItem>
                    <SelectItem value="card" className="text-white">Karte</SelectItem>
                    <SelectItem value="bank_transfer" className="text-white">Überweisung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Lieferant / Tankstelle</Label>
              <Input value={expenseForm.vendor} onChange={e => setExpenseForm(f => ({ ...f, vendor: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" placeholder="z.B. OMV, Shell, ATU..." />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Beleg hochladen (Foto/PDF)</Label>
              <div className="mt-1">
                <input type="file" accept="image/*,.pdf" onChange={e => setExpenseFile(e.target.files?.[0] || null)} className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#2a3040] file:text-zinc-300 hover:file:bg-[#353d50]" />
                {expenseFile && <p className="text-[10px] text-emerald-400 mt-1">✓ {expenseFile.name}</p>}
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Notiz</Label>
              <Textarea value={expenseForm.notes} onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" placeholder="Optional..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExpenseModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={createExpense} disabled={!expenseForm.description || !expenseForm.amount || processing === "expense"}>
              {processing === "expense" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Ausgabe speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFinances;
