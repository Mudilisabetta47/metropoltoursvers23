import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, LogOut, Settings, Bell, Shield, Download, ExternalLink, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const MoreTab = ({ userId }: { userId: string }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // Load recent tour documents driver may need
      const today = new Date().toISOString().split("T")[0];
      const { data: shift } = await supabase
        .from("employee_shifts")
        .select("assigned_trip_id")
        .eq("user_id", userId)
        .gte("shift_date", today)
        .limit(1)
        .maybeSingle();
      if (!shift?.assigned_trip_id) return;
      const { data } = await (supabase as any)
        .from("tour_document_sends")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setDocs(data || []);
    })();
  }, [userId]);

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <section className="rounded-2xl bg-gradient-to-br from-[#131720] to-[#0f1218] border border-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xl font-bold">
            {(profile?.first_name?.[0] || "F").toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">
              {profile?.first_name || "Fahrer"} {profile?.last_name || ""}
            </div>
            <div className="text-sm text-zinc-400">{profile?.email}</div>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="rounded-2xl bg-[#131720] border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Dokumente</h3>
        </div>
        <div className="divide-y divide-white/5">
          {docs.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">Keine Dokumente verfügbar</div>
          ) : (
            docs.map((d) => (
              <button
                key={d.id}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left transition"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{d.document_type || "Dokument"}</div>
                  <div className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString("de-DE")}</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500" />
              </button>
            ))
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-2xl bg-[#131720] border border-white/5 divide-y divide-white/5">
        <MenuItem icon={RefreshCw} label="App aktualisieren (Cache leeren)" onClick={async () => {
          try {
            if ("caches" in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if ("serviceWorker" in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {}
          // hard reload bypassing cache
          window.location.href = `/admin/driver?v=${Date.now()}`;
        }} />
        <MenuItem icon={Bell} label="Benachrichtigungen" onClick={() => {}} />
        <MenuItem icon={Shield} label="Datenschutz & Sicherheit" onClick={() => navigate("/privacy")} />
        <MenuItem icon={Settings} label="Einstellungen" onClick={() => {}} />
        <MenuItem icon={ExternalLink} label="Zurück zum Admin-Cockpit" onClick={() => navigate("/admin/dashboard")} />
        <MenuItem icon={LogOut} label="Abmelden" danger onClick={async () => { await signOut(); navigate("/"); }} />
      </section>

      <p className="text-center text-[10px] text-zinc-600 pt-2">
        METROPOL TOURS · FIS Build {new Date().toISOString().slice(0,10)} · Hannover
      </p>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, danger }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left transition ${danger ? "text-red-400" : "text-white"}`}
  >
    <Icon className="w-5 h-5" />
    <span className="flex-1 text-sm font-medium">{label}</span>
    <span className="text-zinc-600">›</span>
  </button>
);

export default MoreTab;
