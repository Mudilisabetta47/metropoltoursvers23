import { useState } from "react";
import { AlertOctagon, PhoneCall, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EmergencyButton = ({ userId }: { userId: string }) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");

  const trigger = async (severity: "critical" | "warning", label: string) => {
    setSending(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      const locationLine =
        lat != null && lng != null
          ? `\nPosition: ${lat.toFixed(5)}, ${lng.toFixed(5)} (https://www.google.com/maps?q=${lat},${lng})`
          : "\nPosition: nicht verfügbar";

      const { error } = await (supabase as any).from("incidents").insert({
        type: severity === "critical" ? "driver_emergency" : "vehicle_breakdown",
        title: `🚨 ${label} – Fahrer`,
        description: `${note || `Notfall vom Fahrer gemeldet (${label})`}${locationLine}`,
        severity,
        status: "open",
        source_type: "driver",
        source_id: userId,
      });
      if (error) throw error;


      toast.success("Notruf an Disposition gesendet", {
        description: "Die Zentrale wurde alarmiert und meldet sich umgehend.",
      });
      setOpen(false);
      setNote("");
    } catch (e: any) {
      toast.error("Notruf konnte nicht gesendet werden", { description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 border border-red-400/50 active:scale-95 transition"
        aria-label="Notfall"
      >
        <AlertOctagon className="w-4 h-4" />
        <span className="hidden sm:inline">SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131720] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-5 border-b border-white/5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Notfall melden</h3>
                <p className="text-xs text-zinc-400">Sofortige Alarmierung der Zentrale</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Kurze Lagebeschreibung (optional)…"
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:border-red-500/50"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => trigger("critical", "UNFALL")}
                  disabled={sending}
                  className="flex flex-col items-center gap-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold shadow-lg shadow-red-600/30 transition active:scale-95"
                >
                  {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <AlertOctagon className="w-6 h-6" />}
                  <span>UNFALL</span>
                  <span className="text-[10px] opacity-80">sofort alarmieren</span>
                </button>
                <button
                  onClick={() => trigger("warning", "Technische Störung")}
                  disabled={sending}
                  className="flex flex-col items-center gap-1 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold shadow-lg shadow-amber-600/30 transition active:scale-95"
                >
                  <AlertOctagon className="w-6 h-6" />
                  <span>STÖRUNG</span>
                  <span className="text-[10px] opacity-80">Panne / Defekt</span>
                </button>
              </div>

              <a
                href="tel:+4951112345678"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                Zentrale direkt anrufen
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyButton;
