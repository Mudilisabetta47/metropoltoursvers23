import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Users, Search, Mail, StickyNote, Plus, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CustomerGroup {
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  booking_count: number;
  total_spent: number;
  last_booking: string;
  bookings: any[];
}

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerGroup | null>(null);
  const [noteModal, setNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) loadCustomers();
  }, [user, isAdmin, authLoading]);

  const loadCustomers = async () => {
    setIsLoading(true);
    const { data: bookings } = await supabase
      .from("tour_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookings) {
      const grouped: Record<string, CustomerGroup> = {};
      bookings.forEach((b: any) => {
        const key = b.contact_email.toLowerCase();
        if (!grouped[key]) {
          grouped[key] = {
            email: b.contact_email,
            first_name: b.contact_first_name,
            last_name: b.contact_last_name,
            phone: b.contact_phone,
            booking_count: 0,
            total_spent: 0,
            last_booking: b.created_at,
            bookings: [],
          };
        }
        grouped[key].booking_count++;
        grouped[key].total_spent += Number(b.total_price);
        grouped[key].bookings.push(b);
        if (b.created_at > grouped[key].last_booking) grouped[key].last_booking = b.created_at;
      });
      setCustomers(Object.values(grouped).sort((a, b) => b.total_spent - a.total_spent));
    }

    const { data: allNotes } = await supabase.from("tour_customer_notes").select("*").order("created_at", { ascending: false });
    if (allNotes) {
      const byEmail: Record<string, any[]> = {};
      allNotes.forEach((n: any) => {
        if (!byEmail[n.customer_email]) byEmail[n.customer_email] = [];
        byEmail[n.customer_email].push(n);
      });
      setNotes(byEmail);
    }
    setIsLoading(false);
  };

  const addNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return;
    await supabase.from("tour_customer_notes").insert({
      customer_email: selectedCustomer.email,
      note: newNote.trim(),
      created_by: user?.id,
    });
    toast({ title: "✅ Notiz gespeichert" });
    setNoteModal(false);
    setNewNote("");
    loadCustomers();
  };

  const filtered = customers.filter(c =>
    search === "" ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  if (!user || !isAdmin) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Kein Zugriff</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")} className="text-zinc-400"><ArrowLeft className="w-4 h-4 mr-1" /> Admin</Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-emerald-400" /> Kunden (CRM)</h1>
            <p className="text-sm text-zinc-500">{customers.length} Kunden • {customers.reduce((s, c) => s + c.total_spent, 0).toFixed(2)}€ Gesamtumsatz</p>
          </div>
        </div>

        <Input
          placeholder="Suche nach Name oder E-Mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white mb-4 max-w-md"
        />

        <div className="grid gap-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-400">{customers.length}</div><div className="text-xs text-zinc-500">Kunden gesamt</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-white">{customers.filter(c => c.booking_count > 1).length}</div><div className="text-xs text-zinc-500">Stammkunden</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-400">{customers.reduce((s, c) => s + c.total_spent, 0).toFixed(0)}€</div><div className="text-xs text-zinc-500">Gesamtumsatz</div></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-2xl font-bold text-white">{customers.length > 0 ? (customers.reduce((s, c) => s + c.total_spent, 0) / customers.length).toFixed(0) : 0}€</div><div className="text-xs text-zinc-500">Ø pro Kunde</div></CardContent></Card>
          </div>

          {/* Customer Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Kunde</TableHead>
                  <TableHead className="text-zinc-400">E-Mail</TableHead>
                  <TableHead className="text-zinc-400">Telefon</TableHead>
                  <TableHead className="text-zinc-400">Buchungen</TableHead>
                  <TableHead className="text-zinc-400">Umsatz</TableHead>
                  <TableHead className="text-zinc-400">Letzte Buchung</TableHead>
                  <TableHead className="text-zinc-400">Notizen</TableHead>
                  <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.email} className="border-zinc-800">
                    <TableCell className="text-white font-medium">{c.first_name} {c.last_name}</TableCell>
                    <TableCell className="text-zinc-400">{c.email}</TableCell>
                    <TableCell className="text-zinc-400">{c.phone || "–"}</TableCell>
                    <TableCell><Badge className={c.booking_count > 1 ? "bg-emerald-600" : "bg-zinc-600"}>{c.booking_count}x</Badge></TableCell>
                    <TableCell className="text-emerald-400 font-semibold">{c.total_spent.toFixed(2)}€</TableCell>
                    <TableCell className="text-zinc-300">{format(new Date(c.last_booking), "dd.MM.yy", { locale: de })}</TableCell>
                    <TableCell className="text-zinc-400">{(notes[c.email.toLowerCase()] || []).length > 0 ? <Badge className="bg-blue-600">{(notes[c.email.toLowerCase()] || []).length}</Badge> : "–"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" className="text-zinc-400 h-7" onClick={() => { setSelectedCustomer(c); }}>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Customer Detail Panel */}
          {selectedCustomer && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">{selectedCustomer.first_name} {selectedCustomer.last_name}</CardTitle>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => { setNoteModal(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Notiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-zinc-400">{selectedCustomer.email} • {selectedCustomer.phone || "Kein Telefon"}</div>

                {/* Notes */}
                {(notes[selectedCustomer.email.toLowerCase()] || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-400">Notizen</h4>
                    {(notes[selectedCustomer.email.toLowerCase()] || []).map((n: any) => (
                      <div key={n.id} className="bg-zinc-800 rounded p-3">
                        <div className="text-sm text-white">{n.note}</div>
                        <div className="text-xs text-zinc-500 mt-1">{format(new Date(n.created_at), "dd.MM.yy HH:mm", { locale: de })}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bookings */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Buchungen</h4>
                  <div className="space-y-2">
                    {selectedCustomer.bookings.map((b: any) => (
                      <div key={b.id} className="bg-zinc-800 rounded p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-700" onClick={() => navigate(`/admin/booking/${b.id}`)}>
                        <div>
                          <span className="text-emerald-400 font-mono text-sm">{b.booking_number}</span>
                          <span className="text-zinc-400 text-sm ml-3">{format(new Date(b.created_at), "dd.MM.yy", { locale: de })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{Number(b.total_price).toFixed(2)}€</span>
                          <Badge className={b.status === "confirmed" ? "bg-emerald-600" : b.status === "pending" ? "bg-amber-600" : "bg-red-600"}>{b.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={noteModal} onOpenChange={setNoteModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Notiz für {selectedCustomer?.first_name} {selectedCustomer?.last_name}</DialogTitle></DialogHeader>
          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notiz eingeben..." className="bg-zinc-800 border-zinc-700 text-white" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addNote}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
