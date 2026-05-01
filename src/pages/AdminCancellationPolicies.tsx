import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Tier { days_before: number; refund_percent: number; label: string; }
interface Policy {
  id: string;
  name: string;
  description: string | null;
  tiers: Tier[];
  is_default: boolean;
  is_active: boolean;
}

export default function AdminCancellationPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Policy | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("cancellation_policies").select("*").order("is_default", { ascending: false });
    if (error) toast.error(error.message);
    else setPolicies((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, tiers: editing.tiers as any };
    const { error } = editing.id
      ? await supabase.from("cancellation_policies").update(payload).eq("id", editing.id)
      : await supabase.from("cancellation_policies").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("cancellation_policies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const newPolicy = () => setEditing({
    id: "", name: "Neue Stornoregel", description: "",
    tiers: [
      { days_before: 30, refund_percent: 90, label: ">30 Tage" },
      { days_before: 14, refund_percent: 50, label: "14–30 Tage" },
      { days_before: 7, refund_percent: 25, label: "7–14 Tage" },
      { days_before: 0, refund_percent: 0, label: "<7 Tage" },
    ],
    is_default: false, is_active: true,
  });

  const updateTier = (i: number, k: keyof Tier, v: any) => {
    if (!editing) return;
    const tiers = [...editing.tiers];
    (tiers[i] as any)[k] = k === "label" ? v : Number(v);
    setEditing({ ...editing, tiers });
  };

  return (
    <AdminLayout title="Stornoregeln" subtitle="Erstattungsstaffeln nach Tagen vor Abreise"
      actions={<Button onClick={newPolicy} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90"><Plus className="w-4 h-4 mr-2" />Neue Regel</Button>}>
      {loading ? (
        <div className="text-zinc-500 p-6">Lädt…</div>
      ) : (
        <div className="grid gap-4">
          {policies.map(p => (
            <Card key={p.id} className="bg-[#161b22] border-zinc-800 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{p.name}</h3>
                    {p.is_default && <Badge className="bg-emerald-500/20 text-emerald-300">Standard</Badge>}
                    {!p.is_active && <Badge className="bg-zinc-700">Inaktiv</Badge>}
                  </div>
                  {p.description && <p className="text-sm text-zinc-400 mt-1">{p.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /></Button>
                  {!p.is_default && <Button size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {p.tiers?.map((t, i) => (
                  <div key={i} className="bg-[#0f1218] rounded-lg p-3 border border-zinc-800">
                    <div className="text-xs text-zinc-500">{t.label}</div>
                    <div className="text-lg font-bold text-emerald-400">{t.refund_percent}%</div>
                    <div className="text-[10px] text-zinc-500 mt-1">ab {t.days_before} Tage vorher</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <Card className="bg-[#161b22] border-zinc-800 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editing.id ? "Bearbeiten" : "Neue Stornoregel"}</h2>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-zinc-400">Name</label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="bg-white" /></div>
              <div><label className="text-xs text-zinc-400">Beschreibung</label><Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="bg-white" /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editing.is_default} onChange={e => setEditing({ ...editing, is_default: e.target.checked })} />Standard</label>
                <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />Aktiv</label>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-2">Erstattungsstaffeln</label>
                <div className="space-y-2">
                  {editing.tiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="Tage vorher" value={t.days_before} onChange={e => updateTier(i, "days_before", e.target.value)} className="bg-white" />
                      <Input type="number" placeholder="%" value={t.refund_percent} onChange={e => updateTier(i, "refund_percent", e.target.value)} className="bg-white" />
                      <Input placeholder="Label" value={t.label} onChange={e => updateTier(i, "label", e.target.value)} className="bg-white" />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={save} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90 w-full"><Save className="w-4 h-4 mr-2" />Speichern</Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
