import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Camera, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  busId: string;
  userId: string;
}

const DamageReportDialog = ({ open, onClose, busId, userId }: Props) => {
  const [type, setType] = useState("scratch");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, 5));
  };

  const submit = async () => {
    if (!description.trim()) {
      toast.error("Bitte Beschreibung eingeben");
      return;
    }
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) {
        const path = `damages/${busId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("incident-documents")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        photoUrls.push(path);
      }

      const { error } = await supabase.from("vehicle_damages").insert({
        bus_id: busId,
        damage_type: type,
        description: description.slice(0, 1000),
        severity,
        status: "reported",
        damage_date: new Date().toISOString().split("T")[0],
        driver_id: userId,
        reported_by: userId,
        photos: photoUrls,
      });
      if (error) throw error;

      // Notify dispatch
      await (supabase as any).from("driver_messages").insert({
        recipient_id: null,
        is_broadcast: true,
        subject: `🔧 Mängelmeldung (${severity})`,
        message: `${type}: ${description.slice(0, 200)}`,
        priority: severity === "critical" ? "critical" : severity === "high" ? "urgent" : "normal",
        sender_id: userId,
      });

      toast.success("Mängelmeldung gesendet", { description: "Disposition wurde informiert" });
      setDescription(""); setFiles([]); setSeverity("medium");
      onClose();
    } catch (e: any) {
      toast.error("Fehler beim Senden", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[95vh] bg-[#131720] sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-6">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mangel melden</h2>
              <p className="text-xs text-zinc-500">Schaden / Defekt am Fahrzeug</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Art</label>
            <select
              value={type} onChange={(e) => setType(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
            >
              <option value="scratch">Kratzer</option>
              <option value="dent">Delle</option>
              <option value="glass">Glasschaden</option>
              <option value="tire">Reifenschaden</option>
              <option value="mechanical">Technischer Defekt</option>
              <option value="interior">Innenraum</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Priorität</label>
            <div className="grid grid-cols-4 gap-2">
              {(["low", "medium", "high", "critical"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-lg text-xs font-semibold uppercase border transition ${
                    severity === s
                      ? s === "critical" ? "bg-red-600 border-red-500 text-white" :
                        s === "high" ? "bg-amber-600 border-amber-500 text-white" :
                        s === "medium" ? "bg-emerald-600 border-emerald-500 text-white" :
                        "bg-zinc-700 border-zinc-600 text-white"
                      : "bg-white/5 border-white/10 text-zinc-400"
                  }`}
                >{s === "low" ? "Niedrig" : s === "medium" ? "Mittel" : s === "high" ? "Hoch" : "Kritisch"}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Was ist passiert, wo genau am Fahrzeug?"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Fotos (bis zu 5)</label>
            <label className="flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-white/10 hover:border-emerald-500/40 bg-white/5 cursor-pointer transition">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-zinc-300">{files.length > 0 ? `${files.length} Foto(s) ausgewählt` : "Fotos aufnehmen oder auswählen"}</span>
              <input
                type="file" accept="image/*" multiple capture="environment"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={submit}
            disabled={saving || !description.trim()}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Meldung senden
          </button>
        </div>
      </div>
    </div>
  );
};

export default DamageReportDialog;
