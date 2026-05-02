import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, X, Pin, Trash2, Mail, Phone, Calendar, Euro, Ticket, AlertTriangle, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

interface Tag { id: string; tag: string; color: string; }
interface Note { id: string; body: string; pinned: boolean; created_at: string; author_id: string | null; }

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const PRESET_TAGS = [
  { tag: "VIP", color: "#FFD700" },
  { tag: "Stammkunde", color: "#00CC36" },
  { tag: "Senior", color: "#3B82F6" },
  { tag: "Problemkunde", color: "#EF4444" },
  { tag: "B2B", color: "#8B5CF6" },
];

const AdminCustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = profile?.user_id;

  const load = async () => {
    if (!customerId) return;
    setLoading(true);

    // Load profile (try by user_id first, fallback profiles.id)
    let prof: Profile | null = null;
    const r1 = await supabase.from("profiles").select("*").eq("user_id", customerId).maybeSingle();
    if (r1.data) prof = r1.data as Profile;
    else {
      const r2 = await supabase.from("profiles").select("*").eq("id", customerId).maybeSingle();
      if (r2.data) prof = r2.data as Profile;
    }
    setProfile(prof);

    if (!prof) { setLoading(false); return; }

    const uid = prof.user_id;
    const [tagsRes, notesRes, bookingsRes, inqRes, compRes] = await Promise.all([
      supabase.from("customer_tags" as any).select("*").eq("customer_user_id", uid),
      supabase.from("customer_notes" as any).select("*").eq("customer_user_id", uid).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id,ticket_number,price_paid,status,created_at,passenger_first_name,passenger_last_name").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
      (supabase.from("package_tour_inquiries") as any).select("id,inquiry_number,status,created_at,destination,passenger_count").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
      (supabase.from("complaints") as any).select("id,ticket_number,status,subject,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
    ]);

    setTags((tagsRes.data as any) ?? []);
    setNotes((notesRes.data as any) ?? []);
    setBookings(bookingsRes.data ?? []);
    setInquiries(inqRes.data ?? []);
    setComplaints(compRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [customerId]);

  const ltv = bookings
    .filter((b) => ["paid", "confirmed", "completed"].includes(b.status))
    .reduce((s, b) => s + Number(b.price_paid || 0), 0);

  const lastBooking = bookings[0];
  const daysSinceLast = lastBooking ? Math.floor((Date.now() - new Date(lastBooking.created_at).getTime()) / 86400000) : null;
  const churnRisk = daysSinceLast !== null && daysSinceLast > 365 ? "high" : daysSinceLast !== null && daysSinceLast > 180 ? "medium" : "low";

  const addTag = async (tag: string, color: string) => {
    if (!userId) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("customer_tags" as any).insert({
      customer_user_id: userId, tag, color, created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setCustomTag("");
    load();
  };

  const removeTag = async (id: string) => {
    const { error } = await supabase.from("customer_tags" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addNote = async () => {
    if (!userId || !newNote.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("customer_notes" as any).insert({
      customer_user_id: userId, body: newNote.trim(), author_id: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setNewNote("");
    toast.success("Notiz gespeichert");
    load();
  };

  const togglePin = async (n: Note) => {
    await supabase.from("customer_notes" as any).update({ pinned: !n.pinned }).eq("id", n.id);
    load();
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Notiz löschen?")) return;
    await supabase.from("customer_notes" as any).delete().eq("id", id);
    load();
  };

  if (loading) return <AdminLayout title="Kunde"><p className="text-white/50">Lade…</p></AdminLayout>;
  if (!profile) return <AdminLayout title="Kunde"><p className="text-white/50">Kunde nicht gefunden.</p></AdminLayout>;

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Unbenannt";

  return (
    <AdminLayout title="Customer 360°" subtitle={fullName}>
      <Link to="/admin/customers" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Kunden
      </Link>

      {/* Header card */}
      <Card className="p-6 bg-[#0f1218] border-white/10 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl font-bold text-white">
            {(profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "") || <User className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{fullName}</h2>
              <Badge className={churnRisk === "high" ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : churnRisk === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                Churn: {churnRisk === "high" ? "Hoch" : churnRisk === "medium" ? "Mittel" : "Niedrig"}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-white/70">
              {profile.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</div>}
              {profile.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{profile.phone}</div>}
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Kunde seit {new Date(profile.created_at).toLocaleDateString("de-DE")}</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((t) => (
                <Badge key={t.id} style={{ backgroundColor: `${t.color}20`, color: t.color, borderColor: `${t.color}40` }} className="border">
                  {t.tag}
                  <button onClick={() => removeTag(t.id)} className="ml-2 hover:opacity-70"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">{fmtEUR(ltv)}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">LTV</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400 tabular-nums">{bookings.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">Buchungen</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="text-2xl font-bold text-violet-400 tabular-nums">{inquiries.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">Anfragen</div>
            </div>
          </div>
        </div>

        {/* Tag actions */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-widest mr-2">Tag hinzufügen:</span>
          {PRESET_TAGS.filter(p => !tags.some(t => t.tag === p.tag)).map((p) => (
            <Button key={p.tag} size="sm" variant="outline" onClick={() => addTag(p.tag, p.color)} className="border-white/10 text-white/80 hover:bg-white/5">
              <Plus className="w-3 h-3 mr-1" />{p.tag}
            </Button>
          ))}
          <Input
            placeholder="Eigener Tag"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            className="w-40 h-8 bg-white text-black"
            onKeyDown={(e) => { if (e.key === "Enter" && customTag.trim()) addTag(customTag.trim(), "#00CC36"); }}
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="notes">
        <TabsList className="bg-[#0f1218] border border-white/10">
          <TabsTrigger value="notes"><MessageCircle className="w-4 h-4 mr-2" />Notizen ({notes.length})</TabsTrigger>
          <TabsTrigger value="bookings"><Ticket className="w-4 h-4 mr-2" />Buchungen ({bookings.length})</TabsTrigger>
          <TabsTrigger value="inquiries"><Mail className="w-4 h-4 mr-2" />Anfragen ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="complaints"><AlertTriangle className="w-4 h-4 mr-2" />Reklamationen ({complaints.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card className="p-6 bg-[#0f1218] border-white/10">
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Neue interne Notiz…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-white text-black"
                rows={2}
              />
              <Button onClick={addNote} className="bg-emerald-600 hover:bg-emerald-500 self-start">
                <Plus className="w-4 h-4 mr-1" />Speichern
              </Button>
            </div>
            <div className="space-y-2">
              {notes.length === 0 && <p className="text-white/40 text-sm">Noch keine Notizen.</p>}
              {notes.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.pinned ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white/90 whitespace-pre-wrap flex-1">{n.body}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(n)} className={`p-1 rounded hover:bg-white/10 ${n.pinned ? "text-amber-400" : "text-white/40"}`}>
                        <Pin className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteNote(n.id)} className="p-1 rounded hover:bg-white/10 text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
                    {new Date(n.created_at).toLocaleString("de-DE")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="p-6 bg-[#0f1218] border-white/10">
            {bookings.length === 0 && <p className="text-white/40 text-sm">Keine Buchungen.</p>}
            <div className="space-y-2">
              {bookings.map((b) => (
                <Link key={b.id} to={`/admin/booking/${b.id}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <div>
                    <div className="font-mono text-sm text-emerald-400">{b.ticket_number}</div>
                    <div className="text-xs text-white/50">{new Date(b.created_at).toLocaleDateString("de-DE")} · {b.status}</div>
                  </div>
                  <div className="text-emerald-400 font-bold tabular-nums">{fmtEUR(Number(b.price_paid || 0))}</div>
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <Card className="p-6 bg-[#0f1218] border-white/10">
            {inquiries.length === 0 && <p className="text-white/40 text-sm">Keine Anfragen.</p>}
            <div className="space-y-2">
              {inquiries.map((i) => (
                <Link key={i.id} to={`/admin/inquiries/${i.id}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <div>
                    <div className="font-mono text-sm text-emerald-400">{i.inquiry_number}</div>
                    <div className="text-xs text-white/60">{i.destination} · {i.passenger_count} Pax</div>
                    <div className="text-xs text-white/40">{new Date(i.created_at).toLocaleDateString("de-DE")}</div>
                  </div>
                  <Badge>{i.status}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card className="p-6 bg-[#0f1218] border-white/10">
            {complaints.length === 0 && <p className="text-white/40 text-sm">Keine Reklamationen.</p>}
            <div className="space-y-2">
              {complaints.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm text-rose-400">{c.ticket_number}</div>
                    <Badge>{c.status}</Badge>
                  </div>
                  <div className="text-sm text-white/80 mt-1">{c.subject}</div>
                  <div className="text-xs text-white/40 mt-1">{new Date(c.created_at).toLocaleDateString("de-DE")}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminCustomerDetail;
