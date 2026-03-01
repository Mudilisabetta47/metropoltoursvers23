import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminTemplates = () => {
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", body_html: "" });

  useEffect(() => {
    if (!authLoading && user && isAdmin) loadTemplates();
  }, [user, isAdmin, authLoading]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("tour_email_templates").select("*").order("category, name");
    setTemplates(data || []);
    setIsLoading(false);
  };

  const startEdit = (t: any) => { setEditing(t.id); setEditForm({ subject: t.subject, body_html: t.body_html }); };
  const saveEdit = async (id: string) => {
    await supabase.from("tour_email_templates").update(editForm).eq("id", id);
    toast({ title: "✅ Gespeichert" });
    setEditing(null);
    loadTemplates();
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) { case "payment": return "Zahlung"; case "reminder": return "Erinnerung"; case "ticket": return "Ticket"; case "cancellation": return "Stornierung"; default: return cat; }
  };

  return (
    <AdminLayout title="E-Mail Vorlagen" subtitle={`${templates.length} Vorlagen • Variablen: {{first_name}}, {{booking_number}}, {{total_price}}`}>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-4">
          {templates.map((t: any) => (
            <Card key={t.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm text-white">{t.name}</CardTitle>
                    <Badge className="bg-zinc-700 text-xs">{getCategoryLabel(t.category)}</Badge>
                  </div>
                  {editing === t.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7" onClick={() => saveEdit(t.id)}><Save className="w-3 h-3 mr-1" /> Speichern</Button>
                      <Button size="sm" variant="ghost" className="text-zinc-400 h-7" onClick={() => setEditing(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-zinc-400 h-7" onClick={() => startEdit(t)}><Pencil className="w-3 h-3 mr-1" /> Bearbeiten</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing === t.id ? (
                  <div className="space-y-3">
                    <div><Label className="text-zinc-400 text-xs">Betreff</Label><Input value={editForm.subject} onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
                    <div><Label className="text-zinc-400 text-xs">Inhalt (HTML)</Label><Textarea value={editForm.body_html} onChange={(e) => setEditForm(f => ({ ...f, body_html: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" rows={10} /></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Betreff: <span className="text-white">{t.subject}</span></div>
                    <div className="bg-zinc-800 rounded p-3 text-xs text-zinc-300 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: t.body_html }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTemplates;
