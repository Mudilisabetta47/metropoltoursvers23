import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRightLeft, Plus, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Handover {
  id: string;
  from_user_id: string;
  to_user_id: string | null;
  shift_date: string;
  summary: string;
  open_issues: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const ShiftHandoverPanel = () => {
  const { user } = useAuth();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [openIssues, setOpenIssues] = useState("");

  const fetchHandovers = useCallback(async () => {
    const { data, error } = await supabase
      .from("shift_handovers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) setHandovers(data as Handover[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchHandovers();
    const channel = supabase
      .channel("shift_handovers_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_handovers" }, () => fetchHandovers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchHandovers]);

  const handleCreate = async () => {
    if (!summary.trim() || !user) return;
    const { error } = await supabase.from("shift_handovers").insert({
      from_user_id: user.id,
      summary: summary.trim(),
      open_issues: openIssues.trim() || null,
      status: "pending",
    } as any);
    if (error) {
      toast.error("Fehler beim Erstellen");
    } else {
      setSummary("");
      setOpenIssues("");
      setDialogOpen(false);
      toast.success("Übergabe erstellt");
    }
  };

  const acknowledgeHandover = async (id: string) => {
    await supabase.from("shift_handovers").update({ status: "acknowledged", to_user_id: user?.id } as any).eq("id", id);
  };

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Schichtübergabe</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-5 px-2 text-[9px] bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-2.5 h-2.5 mr-0.5" /> Neu
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2836] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-200">Schichtübergabe erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Zusammenfassung *</label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Was ist passiert, was muss beachtet werden..."
                  className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Offene Punkte</label>
                <Textarea
                  value={openIssues}
                  onChange={(e) => setOpenIssues(e.target.value)}
                  placeholder="Offene Vorfälle, wartende Aufgaben..."
                  className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs min-h-[60px]"
                />
              </div>
              <Button onClick={handleCreate} disabled={!summary.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Übergabe erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" />
        </div>
      ) : handovers.length === 0 ? (
        <div className="text-center py-3">
          <ArrowRightLeft className="w-5 h-5 mx-auto mb-1 text-zinc-700" />
          <p className="text-[10px] text-zinc-600">Keine Übergaben vorhanden</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[200px] overflow-auto">
          {handovers.map((h) => (
            <div key={h.id} className={cn(
              "p-2 rounded border",
              h.status === "pending" ? "bg-indigo-500/5 border-indigo-500/20" : "bg-[#0c1018] border-[#1e2836]"
            )}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-zinc-300 flex-1 line-clamp-2">{h.summary}</p>
                {h.status === "pending" ? (
                  <button
                    onClick={() => acknowledgeHandover(h.id)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 flex-shrink-0"
                  >
                    Bestätigen
                  </button>
                ) : (
                  <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
              </div>
              {h.open_issues && (
                <p className="text-[10px] text-amber-400/80 mt-1">⚠ {h.open_issues}</p>
              )}
              <p className="text-[9px] text-zinc-600 mt-1">
                {format(new Date(h.created_at), "dd. MMM HH:mm", { locale: de })} · #{h.from_user_id.slice(0, 6)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShiftHandoverPanel;
