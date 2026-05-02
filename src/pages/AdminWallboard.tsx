import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Tv, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface WallboardToken {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

const AdminWallboard = () => {
  const [tokens, setTokens] = useState<WallboardToken[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wallboard_tokens" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTokens((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!label.trim()) return toast.error("Bezeichnung erforderlich");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("wallboard_tokens" as any).insert({
      label: label.trim(),
      created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setLabel("");
    toast.success("Wallboard-Token erstellt");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Token wirklich löschen?")) return;
    const { error } = await supabase.from("wallboard_tokens" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const url = (tok: string) => `${window.location.origin}/wallboard/${tok}`;

  return (
    <AdminLayout title="Live Operations Wallboard" subtitle="TV-Display fürs Büro – Echtzeit-KPIs, Karte, Live-Ticker">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[#0f1218] border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Tv className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Direkt öffnen</h3>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Vollbild-Anzeige für eingeloggte Mitarbeiter. Drücke F11 für Vollbildmodus.
          </p>
          <Link to="/admin/wallboard/live">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              <Tv className="w-4 h-4 mr-2" /> Wallboard jetzt öffnen
            </Button>
          </Link>
        </Card>

        <Card className="p-6 bg-[#0f1218] border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Token-URL für TV (kein Login nötig)</h3>
          <div className="flex gap-2">
            <Input
              placeholder="z.B. Empfang TV"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-white text-black"
            />
            <Button onClick={create} className="bg-emerald-600 hover:bg-emerald-500">
              <Plus className="w-4 h-4 mr-1" /> Erstellen
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 bg-[#0f1218] border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Aktive Token-URLs</h3>
        {loading ? (
          <p className="text-white/50 text-sm">Lade…</p>
        ) : tokens.length === 0 ? (
          <p className="text-white/50 text-sm">Noch keine Tokens. Erstelle einen oben.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{t.label}</div>
                  <code className="text-xs text-emerald-400 truncate block">{url(t.token)}</code>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(url(t.token)); toast.success("Kopiert"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={url(t.token)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => remove(t.id)} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminWallboard;
