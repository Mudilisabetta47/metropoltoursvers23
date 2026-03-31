import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CheckCircle2, Loader2, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TourBooking {
  id: string;
  booking_number: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  participants: number;
  total_price: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  tour_id: string;
  tour_date_id: string;
  tariff_id: string;
}

const TourBookingsTab = () => {
  const { toast } = useToast();
  useAuth();
  const navigate = useNavigate();
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => { loadTourBookings(); }, []);

  const loadTourBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tour_bookings").select("*").order("created_at", { ascending: false }).limit(200);
    if (!error && data) setTourBookings(data as TourBooking[]);
    setIsLoading(false);
  };

  const markAsPaid = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from("tour_bookings")
        .update({ status: "confirmed", paid_at: new Date().toISOString(), payment_method: "bank_transfer" })
        .eq("id", bookingId);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-booking-confirmation", { body: { tourBookingId: bookingId } });
        toast({ title: "✅ Zahlung bestätigt & Mail gesendet" });
      } catch {
        toast({ title: "✅ Zahlung bestätigt (Mail fehlgeschlagen)" });
      }
      loadTourBookings();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    finally { setProcessingId(null); }
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "confirmed") updateData.paid_at = new Date().toISOString();
      const { error } = await supabase.from("tour_bookings").update(updateData).eq("id", bookingId);
      if (error) throw error;
      toast({ title: `Status auf "${newStatus}" geändert` });
      loadTourBookings();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
  };

  // Batch actions
  const batchMarkPaid = async () => {
    setBatchProcessing(true);
    const ids = Array.from(selectedIds);
    let success = 0;
    for (const id of ids) {
      const { error } = await supabase.from("tour_bookings")
        .update({ status: "confirmed", paid_at: new Date().toISOString(), payment_method: "bank_transfer" })
        .eq("id", id);
      if (!error) success++;
    }
    toast({ title: `✅ ${success}/${ids.length} als bezahlt markiert` });
    setSelectedIds(new Set());
    setBatchProcessing(false);
    loadTourBookings();
  };

  const batchSendPDF = async () => {
    setBatchProcessing(true);
    const ids = Array.from(selectedIds);
    let success = 0;
    for (const id of ids) {
      try {
        await supabase.functions.invoke("send-booking-confirmation", { body: { tourBookingId: id } });
        success++;
      } catch { /* skip */ }
    }
    toast({ title: `✅ ${success}/${ids.length} E-Mails gesendet` });
    setSelectedIds(new Set());
    setBatchProcessing(false);
  };

  const batchUpdateStatus = async (newStatus: string) => {
    setBatchProcessing(true);
    const ids = Array.from(selectedIds);
    const updateData: any = { status: newStatus };
    if (newStatus === "confirmed") updateData.paid_at = new Date().toISOString();
    let success = 0;
    for (const id of ids) {
      const { error } = await supabase.from("tour_bookings").update(updateData).eq("id", id);
      if (!error) success++;
    }
    toast({ title: `✅ ${success}/${ids.length} Status geändert` });
    setSelectedIds(new Set());
    setBatchProcessing(false);
    loadTourBookings();
  };

  const filtered = tourBookings.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesSearch = search === "" ||
      b.booking_number.toLowerCase().includes(search.toLowerCase()) ||
      b.contact_first_name.toLowerCase().includes(search.toLowerCase()) ||
      b.contact_last_name.toLowerCase().includes(search.toLowerCase()) ||
      b.contact_email.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(filtered.map(b => b.id))); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-emerald-600">Bezahlt</Badge>;
      case "pending": return <Badge className="bg-amber-600">Offen</Badge>;
      case "cancelled": return <Badge className="bg-red-600">Storniert</Badge>;
      default: return <Badge className="bg-zinc-600">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <Input placeholder="Suche nach Buchungsnummer, Name, E-Mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-white">Alle</SelectItem>
            <SelectItem value="pending" className="text-white">Offen</SelectItem>
            <SelectItem value="confirmed" className="text-white">Bezahlt</SelectItem>
            <SelectItem value="cancelled" className="text-white">Storniert</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-zinc-400">{filtered.length} Buchung(en)</div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-emerald-400 font-medium">{selectedIds.size} ausgewählt</span>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={batchMarkPaid} disabled={batchProcessing}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Zahlung erhalten
          </Button>
          <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-300" onClick={batchSendPDF} disabled={batchProcessing}>
            <Mail className="w-3 h-3 mr-1" /> PDF senden
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" disabled={batchProcessing}>
                <MoreHorizontal className="w-3 h-3 mr-1" /> Status ändern
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
              <DropdownMenuItem className="text-white" onClick={() => batchUpdateStatus("pending")}>→ Offen</DropdownMenuItem>
              <DropdownMenuItem className="text-white" onClick={() => batchUpdateStatus("confirmed")}>→ Bezahlt</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400" onClick={() => batchUpdateStatus("cancelled")}>→ Storniert</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" className="text-zinc-400 ml-auto" onClick={() => setSelectedIds(new Set())}>Auswahl aufheben</Button>
        </div>
      )}

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="w-10"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="text-zinc-400">Buchungs-Nr.</TableHead>
              <TableHead className="text-zinc-400">Kunde</TableHead>
              <TableHead className="text-zinc-400">E-Mail / Tel</TableHead>
              <TableHead className="text-zinc-400">Personen</TableHead>
              <TableHead className="text-zinc-400">Betrag</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Datum</TableHead>
              <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={9} className="text-center text-zinc-500 py-8">Keine Buchungen gefunden</TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className={`border-zinc-800 ${selectedIds.has(b.id) ? "bg-emerald-950/20" : ""}`}>
                  <TableCell><Checkbox checked={selectedIds.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} /></TableCell>
                  <TableCell className="font-mono text-emerald-400 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/admin/booking/${b.id}`)}>{b.booking_number}</TableCell>
                  <TableCell className="text-white">{b.contact_first_name} {b.contact_last_name}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    <div>{b.contact_email}</div>
                    {b.contact_phone && <div className="text-zinc-500">{b.contact_phone}</div>}
                  </TableCell>
                  <TableCell className="text-zinc-300">{b.participants}</TableCell>
                  <TableCell className="text-emerald-400 font-semibold">{b.total_price.toFixed(2)}€</TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{format(new Date(b.created_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {b.status === "pending" && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" disabled={processingId === b.id} onClick={() => markAsPaid(b.id)}>
                        {processingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        Bezahlt
                      </Button>
                    )}
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                      <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700 text-white text-xs h-8 inline-flex"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="pending" className="text-white">Offen</SelectItem>
                        <SelectItem value="confirmed" className="text-white">Bezahlt</SelectItem>
                        <SelectItem value="cancelled" className="text-white">Storniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-400">{tourBookings.filter(b => b.status === "pending").length}</div><div className="text-xs text-zinc-500">Offen</div></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-400">{tourBookings.filter(b => b.status === "confirmed").length}</div><div className="text-xs text-zinc-500">Bezahlt</div></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-white">{tourBookings.length}</div><div className="text-xs text-zinc-500">Gesamt</div></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-400">{tourBookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total_price, 0).toFixed(2)}€</div><div className="text-xs text-zinc-500">Umsatz</div></CardContent></Card>
      </div>
    </div>
  );
};

export default TourBookingsTab;
