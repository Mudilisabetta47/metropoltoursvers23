import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Copy, Tag, Percent, Euro, TicketCheck } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  is_active: boolean | null;
  max_redemptions: number | null;
  times_redeemed: number | null;
  valid_from: string | null;
  valid_until: string | null;
  min_amount: number | null;
  created_at: string | null;
}

const emptyCoupon = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "amount",
  percent_off: 10,
  amount_off: 5,
  currency: "eur",
  is_active: true,
  max_redemptions: null as number | null,
  valid_from: "",
  valid_until: "",
  min_amount: null as number | null,
};

const AdminCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "ME-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, code }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCoupon);
    generateCode();
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.percent_off ? "percent" : "amount",
      percent_off: c.percent_off || 10,
      amount_off: c.amount_off || 5,
      currency: c.currency || "eur",
      is_active: c.is_active ?? true,
      max_redemptions: c.max_redemptions,
      valid_from: c.valid_from ? c.valid_from.slice(0, 10) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : "",
      min_amount: c.min_amount,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Bitte Code eingeben"); return; }

    const payload: any = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      percent_off: form.discount_type === "percent" ? form.percent_off : null,
      amount_off: form.discount_type === "amount" ? form.amount_off : null,
      currency: form.discount_type === "amount" ? form.currency : null,
      is_active: form.is_active,
      max_redemptions: form.max_redemptions || null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      min_amount: form.min_amount || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    if (error) {
      toast.error(error.message.includes("unique") ? "Dieser Code existiert bereits" : error.message);
      return;
    }

    toast.success(editingId ? "Gutschein aktualisiert" : "Gutschein erstellt");
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Gutschein wirklich löschen?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gutschein gelöscht");
    fetchCoupons();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code kopiert");
  };

  const formatDiscount = (c: Coupon) => {
    if (c.percent_off) return `${c.percent_off}%`;
    if (c.amount_off) return `${c.amount_off.toFixed(2)} €`;
    return "–";
  };

  const activeCoupons = coupons.filter(c => c.is_active);
  const totalRedemptions = coupons.reduce((s, c) => s + (c.times_redeemed || 0), 0);

  return (
    <AdminLayout title="Gutscheine" subtitle="Rabattcodes erstellen und verwalten"
      actions={
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Neuer Gutschein
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Gesamt", value: coupons.length, icon: Tag, color: "text-blue-400" },
          { label: "Aktiv", value: activeCoupons.length, icon: TicketCheck, color: "text-green-400" },
          { label: "Einlösungen", value: totalRedemptions, icon: Percent, color: "text-yellow-400" },
          { label: "Inaktiv", value: coupons.length - activeCoupons.length, icon: Euro, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Rabatt</TableHead>
                <TableHead>Einlösungen</TableHead>
                <TableHead>Gültigkeit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
              ) : coupons.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Keine Gutscheine vorhanden</TableCell></TableRow>
              ) : coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">{c.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.description || "–"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatDiscount(c)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {c.times_redeemed || 0}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.valid_from ? new Date(c.valid_from).toLocaleDateString("de-DE") : "–"}
                    {" → "}
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString("de-DE") : "∞"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.is_active ?? false} onCheckedChange={() => toggleActive(c.id, c.is_active ?? false)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Gutschein bearbeiten" : "Neuer Gutschein"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="ME-ABC123" className="font-mono" />
                <Button variant="outline" size="sm" onClick={generateCode} type="button">Generieren</Button>
              </div>
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="z.B. Sommeraktion 2026" rows={2} />
            </div>

            <div>
              <Label>Rabatt-Typ</Label>
              <Select value={form.discount_type} onValueChange={(v: "percent" | "amount") => setForm(f => ({ ...f, discount_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Prozent (%)</SelectItem>
                  <SelectItem value="amount">Fester Betrag (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.discount_type === "percent" ? (
              <div>
                <Label>Rabatt in %</Label>
                <Input type="number" min={1} max={100} value={form.percent_off}
                  onChange={e => setForm(f => ({ ...f, percent_off: Number(e.target.value) }))} />
              </div>
            ) : (
              <div>
                <Label>Rabatt in €</Label>
                <Input type="number" min={1} step={0.5} value={form.amount_off}
                  onChange={e => setForm(f => ({ ...f, amount_off: Number(e.target.value) }))} />
              </div>
            )}

            <div>
              <Label>Mindestbestellwert (€, optional)</Label>
              <Input type="number" min={0} step={1} value={form.min_amount ?? ""}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value ? Number(e.target.value) : null }))} />
            </div>

            <div>
              <Label>Max. Einlösungen (leer = unbegrenzt)</Label>
              <Input type="number" min={1} value={form.max_redemptions ?? ""}
                onChange={e => setForm(f => ({ ...f, max_redemptions: e.target.value ? Number(e.target.value) : null }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gültig ab</Label>
                <Input type="date" value={form.valid_from}
                  onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
              </div>
              <div>
                <Label>Gültig bis</Label>
                <Input type="date" value={form.valid_until}
                  onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Aktiv</Label>
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editingId ? "Speichern" : "Gutschein erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCoupons;
