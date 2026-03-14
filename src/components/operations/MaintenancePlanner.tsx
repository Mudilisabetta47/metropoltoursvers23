import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MaintenanceRecord {
  id: string;
  bus_id: string;
  maintenance_type: string;
  title: string;
  description: string | null;
  due_date: string;
  completed_date: string | null;
  status: string;
  cost: number | null;
  vendor: string | null;
  created_at: string;
}

interface Bus {
  id: string;
  name: string;
  license_plate: string;
}

const MaintenancePlanner = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ bus_id: "", title: "", type: "inspection", due_date: "", description: "" });

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from("bus_maintenance")
      .select("*")
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(20);
    if (!error && data) setRecords(data as MaintenanceRecord[]);
    setIsLoading(false);
  }, []);

  const fetchBuses = useCallback(async () => {
    const { data } = await supabase.from("buses").select("id, name, license_plate").eq("is_active", true);
    if (data) setBuses(data);
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchBuses();
    const channel = supabase
      .channel("bus_maintenance_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_maintenance" }, () => fetchRecords())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRecords, fetchBuses]);

  const handleCreate = async () => {
    if (!form.bus_id || !form.title.trim() || !form.due_date || !user) return;
    const { error } = await supabase.from("bus_maintenance").insert({
      bus_id: form.bus_id,
      title: form.title.trim(),
      maintenance_type: form.type,
      due_date: form.due_date,
      description: form.description.trim() || null,
      created_by: user.id,
    } as any);
    if (error) {
      toast.error("Fehler beim Erstellen");
    } else {
      setForm({ bus_id: "", title: "", type: "inspection", due_date: "", description: "" });
      setDialogOpen(false);
      toast.success("Wartung geplant");
    }
  };

  const markCompleted = async (id: string) => {
    await supabase.from("bus_maintenance").update({
      status: "completed",
      completed_date: new Date().toISOString().split("T")[0],
    } as any).eq("id", id);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "inspection": return "TÜV/HU";
      case "oil_change": return "Ölwechsel";
      case "tire_change": return "Reifenwechsel";
      case "repair": return "Reparatur";
      case "cleaning": return "Reinigung";
      default: return type;
    }
  };

  const overdue = records.filter(r => isPast(new Date(r.due_date)) && r.status !== "completed");
  const upcoming = records.filter(r => !isPast(new Date(r.due_date)));

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Wartungsplaner</h2>
          {overdue.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
              {overdue.length} überfällig
            </span>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-5 px-2 text-[9px] bg-orange-600 hover:bg-orange-700">
              <Plus className="w-2.5 h-2.5 mr-0.5" /> Neu
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2836] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-200">Wartung planen</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={form.bus_id} onValueChange={(v) => setForm({ ...form, bus_id: v })}>
                <SelectTrigger className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs">
                  <SelectValue placeholder="Bus auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111820] border-[#1e2836]">
                  {buses.map(b => (
                    <SelectItem key={b.id} value={b.id} className="text-zinc-200 text-xs">
                      {b.name} ({b.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111820] border-[#1e2836]">
                  <SelectItem value="inspection" className="text-zinc-200 text-xs">TÜV/HU</SelectItem>
                  <SelectItem value="oil_change" className="text-zinc-200 text-xs">Ölwechsel</SelectItem>
                  <SelectItem value="tire_change" className="text-zinc-200 text-xs">Reifenwechsel</SelectItem>
                  <SelectItem value="repair" className="text-zinc-200 text-xs">Reparatur</SelectItem>
                  <SelectItem value="cleaning" className="text-zinc-200 text-xs">Reinigung</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titel..."
                className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs"
              />
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs"
              />
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Beschreibung (optional)..."
                className="bg-[#0c1018] border-[#1e2836] text-zinc-200 text-xs min-h-[60px]"
              />
              <Button onClick={handleCreate} disabled={!form.bus_id || !form.title.trim() || !form.due_date} className="w-full bg-orange-600 hover:bg-orange-700">
                Wartung planen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-3">
          <Wrench className="w-5 h-5 mx-auto mb-1 text-zinc-700" />
          <p className="text-[10px] text-zinc-600">Keine Wartungen geplant</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[220px] overflow-auto">
          {records.map((r) => {
            const daysUntil = differenceInDays(new Date(r.due_date), new Date());
            const isOverdue = daysUntil < 0;
            const isSoon = daysUntil <= 7 && daysUntil >= 0;
            const bus = buses.find(b => b.id === r.bus_id);

            return (
              <div key={r.id} className={cn(
                "p-2 rounded border",
                isOverdue ? "bg-red-500/5 border-red-500/20" : isSoon ? "bg-amber-500/5 border-amber-500/20" : "bg-[#0c1018] border-[#1e2836]"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] px-1 py-0 rounded bg-[#1e2836] text-zinc-400">{getTypeLabel(r.maintenance_type)}</span>
                      <span className="text-[11px] font-medium text-white truncate">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{bus?.name || "Bus"} · {bus?.license_plate || ""}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                      <Calendar className="w-2.5 h-2.5" />
                      <span className={cn(
                        isOverdue ? "text-red-400 font-medium" : isSoon ? "text-amber-400" : "text-zinc-500"
                      )}>
                        {format(new Date(r.due_date), "dd. MMM yyyy", { locale: de })}
                        {isOverdue && ` (${Math.abs(daysUntil)}d überfällig)`}
                        {isSoon && !isOverdue && ` (in ${daysUntil}d)`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => markCompleted(r.id)}
                    className="p-1 rounded hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-400 flex-shrink-0"
                    title="Als erledigt markieren"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaintenancePlanner;
