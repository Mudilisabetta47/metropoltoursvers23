import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, X, PenLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CHECK_ITEMS = [
  "Beleuchtung (Front/Heck/Blinker)",
  "Reifen (Profil & Druck)",
  "Ölstand",
  "Kühlwasser",
  "Erste-Hilfe-Kasten vollständig",
  "Feuerlöscher geprüft",
  "Warndreieck & Warnwesten",
  "Sauberkeit Innen & Außen",
];

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  busId: string | null;
}

const ChecklistDialog = ({ open, onClose, userId, busId }: Props) => {
  const [checked, setChecked] = useState<boolean[]>(new Array(CHECK_ITEMS.length).fill(false));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  if (!open) return null;

  const allOk = checked.every(Boolean);
  const doneCount = checked.filter(Boolean).length;

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  };
  const endDraw = () => { setDrawing(false); lastPos.current = null; };
  const clearSig = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const save = async () => {
    setSaving(true);
    try {
      const signature = canvasRef.current?.toDataURL() || null;
      const items = CHECK_ITEMS.map((label, i) => ({ label, ok: checked[i] }));
      const { error } = await (supabase as any).from("driver_checklists").insert({
        driver_user_id: userId,
        bus_id: busId,
        shift_date: new Date().toISOString().split("T")[0],
        items,
        signature_data: signature,
        notes: notes.slice(0, 500),
        all_ok: allOk,
      });
      if (error) throw error;
      toast.success("Check gespeichert", { description: allOk ? "Alle Punkte OK ✓" : `${doneCount}/${CHECK_ITEMS.length} Punkte erledigt` });
      onClose();
    } catch (e: any) {
      toast.error("Speichern fehlgeschlagen", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[95vh] bg-[#131720] sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-6">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pre-Trip Check</h2>
            <p className="text-xs text-zinc-500">{doneCount}/{CHECK_ITEMS.length} Punkte · vor Fahrtantritt</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="space-y-2">
            {CHECK_ITEMS.map((item, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition text-left ${
                  checked[i]
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                {checked[i] ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Circle className="w-5 h-5 text-zinc-500 shrink-0" />}
                <span className="text-sm">{item}</span>
              </button>
            ))}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anmerkungen (optional)…"
            rows={2}
            maxLength={500}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1"><PenLine className="w-3 h-3" /> Unterschrift Fahrer</span>
              <button onClick={clearSig} className="text-xs text-zinc-500 hover:text-white">Löschen</button>
            </div>
            <canvas
              ref={canvasRef}
              width={500}
              height={140}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full h-32 rounded-lg bg-white/95 touch-none cursor-crosshair"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {allOk ? "Check abschließen ✓" : `Speichern (${doneCount}/${CHECK_ITEMS.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistDialog;
