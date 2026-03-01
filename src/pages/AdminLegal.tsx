import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, FileText, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminLegal = () => {
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ document_type: "agb", version: "v1", title: "", content: "" });

  useEffect(() => {
    if (!authLoading && user && isAdmin) loadDocs();
  }, [user, isAdmin, authLoading]);

  const loadDocs = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("tour_legal_documents").select("*").order("document_type, created_at desc");
    setDocs(data || []);
    setIsLoading(false);
  };

  const addDoc = async () => {
    await supabase.from("tour_legal_documents").update({ is_current: false }).eq("document_type", form.document_type);
    await supabase.from("tour_legal_documents").insert({ ...form, is_current: true });
    toast({ title: "✅ Gespeichert" });
    setAddModal(false);
    setForm({ document_type: "agb", version: "v1", title: "", content: "" });
    loadDocs();
  };

  const getTypeLabel = (t: string) => {
    switch (t) { case "agb": return "AGB"; case "datenschutz": return "Datenschutz"; case "impressum": return "Impressum"; case "sicherungsschein": return "Sicherungsschein"; case "widerruf": return "Widerrufsbelehrung"; default: return t; }
  };

  const grouped = docs.reduce((acc: Record<string, any[]>, d: any) => { if (!acc[d.document_type]) acc[d.document_type] = []; acc[d.document_type].push(d); return acc; }, {});

  return (
    <AdminLayout title="Rechtliches" subtitle="AGB, Datenschutz, Sicherungsschein – versioniert" actions={
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddModal(true)}><Plus className="w-3 h-3 mr-1" /> Neue Version</Button>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, versions]) => (
            <Card key={type} className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><FileText className="w-4 h-4" /> {getTypeLabel(type)}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(versions as any[]).map((v: any) => (
                    <div key={v.id} className="bg-zinc-800 rounded p-3 flex items-center justify-between">
                      <div><div className="text-sm text-white font-medium">{v.title}</div><div className="text-xs text-zinc-500">{v.version} • {format(new Date(v.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</div></div>
                      {v.is_current ? <Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Aktiv</Badge> : <Badge className="bg-zinc-600">Archiv</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {Object.keys(grouped).length === 0 && <p className="text-zinc-500 text-center py-8">Noch keine Dokumente</p>}
        </div>
      )}

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Neues Dokument</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Dokumenttyp</Label>
              <Select value={form.document_type} onValueChange={(v) => setForm(f => ({ ...f, document_type: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="agb" className="text-white">AGB</SelectItem>
                  <SelectItem value="datenschutz" className="text-white">Datenschutz</SelectItem>
                  <SelectItem value="impressum" className="text-white">Impressum</SelectItem>
                  <SelectItem value="sicherungsschein" className="text-white">Sicherungsschein</SelectItem>
                  <SelectItem value="widerruf" className="text-white">Widerrufsbelehrung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-zinc-400">Version</Label><Input value={form.version} onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
              <div><Label className="text-zinc-400">Titel</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            </div>
            <div><Label className="text-zinc-400">Inhalt</Label><Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={8} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addDoc}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLegal;
