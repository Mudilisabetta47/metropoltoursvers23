import { useState } from "react";
import { useCommandActions } from "@/hooks/useOperations";
import { 
  Zap, Ban, Clock, UserCheck, Send, RefreshCw,
  CheckCircle, Loader2, AlertTriangle, MapPin, BarChart3, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommandAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  priority: 'primary' | 'secondary' | 'critical';
}

const commands: CommandAction[] = [
  // Critical actions first
  {
    id: 'emergency_stop', icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Notfall-Stopp', description: 'Sofortige Fahrtunterbrechung',
    color: 'text-red-400', bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-800/30',
    priority: 'critical',
  },
  // Primary operational actions
  {
    id: 'report_delay', icon: <Clock className="w-4 h-4" />,
    label: 'Verspätung melden', description: 'Verspätung eintragen',
    color: 'text-amber-400', bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-800/30',
    priority: 'primary',
  },
  {
    id: 'cancel_trip', icon: <Ban className="w-4 h-4" />,
    label: 'Fahrt stornieren', description: 'Aktive Fahrt abbrechen',
    color: 'text-red-400', bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-800/30',
    priority: 'primary',
  },
  {
    id: 'reassign_driver', icon: <UserCheck className="w-4 h-4" />,
    label: 'Fahrer zuweisen', description: 'Neues Fahrzeug zuordnen',
    color: 'text-blue-400', bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-800/30',
    priority: 'primary',
  },
  {
    id: 'route_change', icon: <MapPin className="w-4 h-4" />,
    label: 'Route ändern', description: 'Umleitung disponieren',
    color: 'text-orange-400', bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-800/30',
    priority: 'primary',
  },
  {
    id: 'send_notification', icon: <Send className="w-4 h-4" />,
    label: 'Fahrer benachrichtigen', description: 'Nachricht senden',
    color: 'text-purple-400', bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-800/30',
    priority: 'primary',
  },
  // Secondary system actions
  {
    id: 'capacity_alert', icon: <BarChart3 className="w-4 h-4" />,
    label: 'Kapazität melden', description: 'Überbuchung / Zusatzbus',
    color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-800/30',
    priority: 'secondary',
  },
  {
    id: 'vehicle_offline', icon: <WifiOff className="w-4 h-4" />,
    label: 'Fahrzeug sperren', description: 'Außer Betrieb setzen',
    color: 'text-zinc-400', bgColor: 'bg-zinc-500/10 hover:bg-zinc-500/20 border-zinc-700/30',
    priority: 'secondary',
  },
  {
    id: 'system_refresh', icon: <RefreshCw className="w-4 h-4" />,
    label: 'System-Sync', description: 'Daten neu laden',
    color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-800/30',
    priority: 'secondary',
  },
];

const CommandCenter = () => {
  const { cancelTrip, reportDelay, reassignDriver, logCommand } = useCommandActions();
  const { toast } = useToast();
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleExecuteCommand = async () => {
    if (!activeCommand) return;
    setIsExecuting(true);
    try {
      let result: { error: Error | null } = { error: null };
      switch (activeCommand) {
        case 'cancel_trip':
          if (formData.tripId && formData.reason) result = await cancelTrip(formData.tripId, formData.reason);
          break;
        case 'report_delay':
          if (formData.tripId && formData.delayMinutes) result = await reportDelay(formData.tripId, parseInt(formData.delayMinutes));
          break;
        case 'reassign_driver':
          if (formData.shiftId && formData.busId) result = await reassignDriver(formData.shiftId, formData.busId);
          break;
        case 'send_notification':
          await logCommand('SEND_NOTIFICATION', 'broadcast', null, { message: formData.message });
          break;
        case 'emergency_stop':
          await logCommand('EMERGENCY_STOP', 'trip', formData.tripId || null, { reason: formData.reason });
          break;
        case 'route_change':
          await logCommand('ROUTE_CHANGE', 'trip', formData.tripId || null, { newRoute: formData.newRoute, reason: formData.reason });
          break;
        case 'capacity_alert':
          await logCommand('CAPACITY_ALERT', 'trip', formData.tripId || null, { type: formData.alertType, details: formData.details });
          break;
        case 'vehicle_offline':
          await logCommand('VEHICLE_OFFLINE', 'bus', formData.busId || null, { reason: formData.reason });
          break;
        case 'system_refresh':
          await logCommand('SYSTEM_REFRESH', 'system', null, {});
          setTimeout(() => window.location.reload(), 1000);
          break;
      }
      if (result.error) {
        toast({ title: "Fehler", description: "Maßnahme konnte nicht ausgeführt werden", variant: "destructive" });
      } else {
        toast({ title: "Ausgeführt", description: "Maßnahme wurde protokolliert" });
        setActiveCommand(null);
        setFormData({});
      }
    } catch {
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten", variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderCommandForm = () => {
    switch (activeCommand) {
      case 'cancel_trip':
      case 'emergency_stop':
        return (
          <div className="space-y-3">
            {activeCommand === 'emergency_stop' && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs font-medium">
                ⚠️ Notfall-Befehl – nur bei akuter Gefahr verwenden
              </div>
            )}
            <div><Label className="text-xs text-zinc-400">Fahrt-ID</Label><Input value={formData.tripId || ''} onChange={(e) => setFormData(p => ({ ...p, tripId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Grund</Label><Textarea value={formData.reason || ''} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} placeholder="Begründung..." className="bg-[#0c1018] border-[#1e2836] mt-1 text-xs" rows={2} /></div>
          </div>
        );
      case 'report_delay':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">Fahrt-ID</Label><Input value={formData.tripId || ''} onChange={(e) => setFormData(p => ({ ...p, tripId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Verspätung (Minuten)</Label><Input type="number" value={formData.delayMinutes || ''} onChange={(e) => setFormData(p => ({ ...p, delayMinutes: e.target.value }))} placeholder="z.B. 15" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
          </div>
        );
      case 'reassign_driver':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">Schicht-ID</Label><Input value={formData.shiftId || ''} onChange={(e) => setFormData(p => ({ ...p, shiftId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Neues Fahrzeug-ID</Label><Input value={formData.busId || ''} onChange={(e) => setFormData(p => ({ ...p, busId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
          </div>
        );
      case 'send_notification':
        return (
          <div><Label className="text-xs text-zinc-400">Nachricht</Label><Textarea value={formData.message || ''} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Nachricht an Fahrer..." className="bg-[#0c1018] border-[#1e2836] mt-1 text-xs" rows={3} /></div>
        );
      case 'route_change':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">Fahrt-ID</Label><Input value={formData.tripId || ''} onChange={(e) => setFormData(p => ({ ...p, tripId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Neue Route / Umleitung</Label><Input value={formData.newRoute || ''} onChange={(e) => setFormData(p => ({ ...p, newRoute: e.target.value }))} placeholder="z.B. A7 statt A1" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Grund</Label><Textarea value={formData.reason || ''} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} className="bg-[#0c1018] border-[#1e2836] mt-1 text-xs" rows={2} /></div>
          </div>
        );
      case 'vehicle_offline':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">Fahrzeug-ID</Label><Input value={formData.busId || ''} onChange={(e) => setFormData(p => ({ ...p, busId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Grund</Label><Textarea value={formData.reason || ''} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} placeholder="z.B. Motorschaden, TÜV..." className="bg-[#0c1018] border-[#1e2836] mt-1 text-xs" rows={2} /></div>
          </div>
        );
      case 'capacity_alert':
        return (
          <div className="space-y-3">
            <div><Label className="text-xs text-zinc-400">Fahrt-ID</Label><Input value={formData.tripId || ''} onChange={(e) => setFormData(p => ({ ...p, tripId: e.target.value }))} placeholder="UUID" className="bg-[#0c1018] border-[#1e2836] mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-zinc-400">Alert-Typ</Label>
              <select value={formData.alertType || ''} onChange={(e) => setFormData(p => ({ ...p, alertType: e.target.value }))} className="w-full bg-[#0c1018] border border-[#1e2836] rounded-md px-3 py-1.5 text-white mt-1 text-xs">
                <option value="">Bitte wählen</option>
                <option value="overbooking">Überbuchung</option>
                <option value="extra_bus">Zusatzbus anfordern</option>
                <option value="low_occupancy">Niedrige Auslastung</option>
              </select>
            </div>
          </div>
        );
      case 'system_refresh':
        return (
          <div className="p-3 bg-[#0c1018] rounded text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-zinc-300 text-xs">Alle Daten werden neu synchronisiert.</p>
          </div>
        );
      default: return null;
    }
  };

  const criticalCmds = commands.filter(c => c.priority === 'critical');
  const primaryCmds = commands.filter(c => c.priority === 'primary');
  const secondaryCmds = commands.filter(c => c.priority === 'secondary');

  return (
    <div className="p-4 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-zinc-300">Leitstelle — Maßnahmen</h2>
      </div>

      {/* Critical actions */}
      <div className="flex gap-2 mb-2">
        {criticalCmds.map(cmd => (
          <button key={cmd.id} onClick={() => setActiveCommand(cmd.id)}
            className={cn("flex items-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-all", cmd.bgColor, cmd.color)}>
            {cmd.icon} {cmd.label}
          </button>
        ))}
      </div>

      <Separator className="bg-[#1e2836] my-2" />

      {/* Primary actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-2">
        {primaryCmds.map(cmd => (
          <button key={cmd.id} onClick={() => setActiveCommand(cmd.id)}
            className={cn("p-2.5 rounded border text-left transition-all", cmd.bgColor)}>
            <div className={cn("mb-1", cmd.color)}>{cmd.icon}</div>
            <div className="text-xs font-medium text-white">{cmd.label}</div>
            <div className="text-[10px] text-zinc-500">{cmd.description}</div>
          </button>
        ))}
      </div>

      <Separator className="bg-[#1e2836] my-2" />

      {/* Secondary / System actions */}
      <div className="flex gap-1.5">
        {secondaryCmds.map(cmd => (
          <button key={cmd.id} onClick={() => setActiveCommand(cmd.id)}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px] transition-all", cmd.bgColor, cmd.color)}>
            {cmd.icon} {cmd.label}
          </button>
        ))}
      </div>

      <Dialog open={!!activeCommand} onOpenChange={(open) => !open && setActiveCommand(null)}>
        <DialogContent className="bg-[#141a24] border-[#1e2836] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {commands.find(c => c.id === activeCommand)?.icon}
              {commands.find(c => c.id === activeCommand)?.label}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {commands.find(c => c.id === activeCommand)?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">{renderCommandForm()}</div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setActiveCommand(null); setFormData({}); }}>Abbrechen</Button>
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleExecuteCommand} disabled={isExecuting}>
              {isExecuting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Wird ausgeführt...</> : <><CheckCircle className="w-3 h-3 mr-1" /> Ausführen</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommandCenter;
